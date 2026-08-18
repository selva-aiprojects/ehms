import { NextRequest, NextResponse } from "next/server";
import { getDb, getPublicDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import {
  getTenantByCode,
  getTenantSubscriptionByTenantId,
  getSubscriptionPlans,
  upsertTenantSubscription,
  syncTenantFeatures,
  deriveWorkspaces,
  syncWorkspaces,
  VERTICAL_LABELS,
  ALL_VERTICALS,
  type TenantRow,
} from "@/lib/features/subscription";

// Only platform superadmins (Nexus Management) can provision subscriptions
function requirePlatformAdmin(req: NextRequest): string | null {
  const token = req.cookies.get("ehms_token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload?.is_platform_admin) {
    return "Only platform superadmins can manage subscriptions";
  }
  return null;
}

async function loadTenant(code: string): Promise<TenantRow | null> {
  return getTenantByCode(code);
}

function buildFlagRows(
  tenant: TenantRow,
): Promise<Array<Record<string, unknown>>> {
  const db = getDb(tenant.schema_name);
  return db.query(
    `SELECT ff.flag_key, ff.name, ff.category, ff.status, ff.default_enabled,
            ff.id AS feature_flag_id,
            COALESCE(jsonb_agg(
              jsonb_build_object('vertical_name', fa.vertical_name, 'min_tier', fa.min_tier)
            ) FILTER (WHERE fa.vertical_name IS NOT NULL), '[]') AS availability,
            og.is_enabled AS granted
     FROM feature_flags ff
     LEFT JOIN feature_availability fa ON fa.feature_flag_id = ff.id
     LEFT JOIN LATERAL (
       SELECT is_enabled FROM feature_flag_overrides o
       WHERE o.feature_flag_id = ff.id AND o.scope = 'global'
         AND o.enterprise_id IS NULL AND o.property_id IS NULL AND o.user_id IS NULL
         AND (o.approval_status IS NULL OR o.approval_status = 'approved')
       LIMIT 1
     ) og ON true
     GROUP BY ff.id, og.is_enabled
     ORDER BY ff.category, ff.name`
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const denied = requirePlatformAdmin(req);
  if (denied) {
    return NextResponse.json({ error: denied }, { status: 403 });
  }

  try {
    const { code } = await params;
    const tenant = await loadTenant(code);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const [subscription, plans, flags] = await Promise.all([
      getTenantSubscriptionByTenantId(tenant.id),
      getSubscriptionPlans(),
      buildFlagRows(tenant),
    ]);

    const verticals = ALL_VERTICALS.map((v) => ({
      code: v,
      label: VERTICAL_LABELS[v],
      subscribed: !!subscription?.subscribed_verticals.includes(v),
    }));

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
        schema_name: tenant.schema_name,
        is_active: tenant.is_active,
        config: tenant.config,
      },
      subscription,
      plans,
      verticals,
      flags,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load provisioning data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const denied = requirePlatformAdmin(req);
  if (denied) {
    return NextResponse.json({ error: denied }, { status: 403 });
  }

  try {
    const { code } = await params;
    const tenant = await loadTenant(code);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      plan_id,
      tier,
      subscribed_verticals,
      status,
      price,
      billing_period,
    } = body;

    if (subscribed_verticals !== undefined) {
      if (
        !Array.isArray(subscribed_verticals) ||
        subscribed_verticals.length === 0 ||
        !subscribed_verticals.every((v: string) => ALL_VERTICALS.includes(v))
      ) {
        return NextResponse.json(
          { error: "subscribed_verticals must be a non-empty array of valid vertical codes" },
          { status: 400 }
        );
      }
    }

    const subscription = await upsertTenantSubscription(tenant.id, {
      plan_id: plan_id ?? undefined,
      tier,
      status,
      subscribed_verticals,
      price: price ?? undefined,
      billing_period,
    });

    // Sync feature overrides in the tenant shard to match the subscription
    const sync = await syncTenantFeatures(tenant, subscription);

    // Derive + persist workspaces, then sync property rows + public registry
    const existingWorkspaces =
      ((tenant.config || {}).workspaces as Array<{ type: string; name: string; is_primary: boolean }>) || [];
    const workspaces = deriveWorkspaces(subscription, existingWorkspaces);
    await syncWorkspaces(tenant, subscription, workspaces);

    const publicDb = getPublicDb();
    await publicDb.query(
      "UPDATE public.tenants SET updated_at = now() WHERE id = $1",
      [tenant.id]
    );

    return NextResponse.json({
      success: true,
      subscription,
      workspaces,
      granted: sync.granted,
      revoked: sync.revoked,
      catalogAdded: sync.catalogAdded,
      message: `Provisioned ${tenant.name} on the ${subscription.plan_name || subscription.tier} plan (${subscription.status})`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Provisioning failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
