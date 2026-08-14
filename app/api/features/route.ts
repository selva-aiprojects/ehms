import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  isFeatureEnabled,
  canEnableFeature,
  enableFeature,
  disableFeature,
} from "@/lib/features/server";
import {
  buildFeatureContext,
  getRequestAuth,
  isFeatureAdmin,
} from "@/lib/features/api";
import type { FeatureFlagContext, FEATURE_FLAGS } from "@/lib/features/types";

type FlagKey = keyof typeof FEATURE_FLAGS;

const HOSPITALITY_CATEGORY = "hospitality";

interface FeatureBody {
  action?: string;
  flag?: string;
  flagKey?: string;
  scope?: string;
  property_id?: string;
  reason?: string;
  context?: Partial<FeatureFlagContext>;
}

interface FlagRow {
  id: string;
  flag_key: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  default_enabled: boolean;
}

export async function POST(req: NextRequest) {
  let body: FeatureBody;
  try {
    body = (await req.json()) as FeatureBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = body.action;

  try {
    switch (action) {
      case "get-all":
        return handleGetAll(req, body);
      case "enable":
        return handleEnable(req, body);
      case "disable":
        return handleDisable(req, body);
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[features POST]", error);
    const message = error instanceof Error ? error.message : "Feature flag operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleGetAll(req: NextRequest, body: FeatureBody) {
  const auth = getRequestAuth(req);
  if (!isFeatureAdmin(auth.userRole)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const context = await buildFeatureContext(req, body.context);
  const db = getDb();

  const rows = (await db.query(
    `SELECT * FROM feature_flags ORDER BY category, name`
  )) as unknown as FlagRow[];

  const features = await Promise.all(
    rows.map(async (flag) => {
      const depCheck = await canEnableFeature(
        flag.flag_key as FlagKey,
        context
      ).catch(() => null);
      return {
        id: flag.id,
        flag_key: flag.flag_key,
        name: flag.name,
        description: flag.description,
        category: flag.category,
        status: flag.status,
        default_enabled: flag.default_enabled === true,
        is_enabled: await isFeatureEnabled(
          flag.flag_key as FlagKey,
          context
        ),
        blocking_flags: depCheck?.blocking_flags ?? [],
        conflicting_flags: depCheck?.conflicting_flags ?? [],
        can_enable: depCheck?.can_enable ?? true,
        reason: depCheck?.reason ?? null,
      };
    })
  );

  return NextResponse.json({ features });
}

async function handleEnable(req: NextRequest, body: FeatureBody) {
  const auth = getRequestAuth(req);
  if (!isFeatureAdmin(auth.userRole)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const flag = body.flag;
  const scope = body.scope === "property" ? "property" : "global";
  const propertyId = body.property_id;

  if (!flag) {
    return NextResponse.json({ error: "Flag is required" }, { status: 400 });
  }

  const lockError = await assertToggleAllowed(flag, scope);
  if (lockError) return lockError;

  const result = await enableFeature(
    flag as FlagKey,
    scope,
    scope === "property" ? propertyId : undefined,
    { user_id: auth.userId },
    body.reason || "Admin enabled from Feature Flags UI",
    auth.tenantSchema
  );

  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

async function handleDisable(req: NextRequest, body: FeatureBody) {
  const auth = getRequestAuth(req);
  if (!isFeatureAdmin(auth.userRole)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const flag = body.flag;
  const scope = body.scope === "property" ? "property" : "global";
  const propertyId = body.property_id;

  if (!flag) {
    return NextResponse.json({ error: "Flag is required" }, { status: 400 });
  }

  const lockError = await assertToggleAllowed(flag, scope);
  if (lockError) return lockError;

  const result = await disableFeature(
    flag as FlagKey,
    scope,
    scope === "property" ? propertyId : undefined,
    body.reason || "Admin disabled from Feature Flags UI",
    { user_id: auth.userId }
  );

  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

async function assertToggleAllowed(
  flag: string,
  scope: string,
): Promise<NextResponse | null> {
  if (scope !== "global") return null;

  const db = getDb();
  const rows = (await db.query(
    `SELECT category FROM feature_flags WHERE flag_key = $1 LIMIT 1`,
    [flag]
  )) as unknown as { category: string }[];

  if (rows.length === 0) {
    return NextResponse.json(
      { success: false, message: `Feature flag '${flag}' not found` },
      { status: 404 }
    );
  }

  if (rows[0].category === HOSPITALITY_CATEGORY) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Hospitality core modules are locked at the global scope to protect existing clients. Use property scope instead.",
      },
      { status: 403 }
    );
  }

  return null;
}
