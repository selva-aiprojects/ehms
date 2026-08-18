import { getDb } from "@/lib/db";
import type { FeatureFlagContext } from "./types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ADMIN_ROLES = ["super_admin", "executive", "property_manager"];

export interface RequestAuth {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  tenantCode?: string;
  tenantSchema?: string;
  isPlatformAdmin: boolean;
}

export function getRequestAuth(req: Request): RequestAuth {
  return {
    userId: req.headers.get("x-user-id") || undefined,
    userEmail: req.headers.get("x-user-email") || undefined,
    userRole: req.headers.get("x-user-role") || undefined,
    tenantCode: req.headers.get("x-tenant-code") || undefined,
    tenantSchema: req.headers.get("x-tenant-schema") || undefined,
    isPlatformAdmin: req.headers.get("x-is-platform-admin") === "true",
  };
}

export function isFeatureAdmin(role?: string): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

async function resolveEnterpriseId(
  value?: string,
): Promise<string | undefined> {
  if (!value) return undefined;
  if (UUID_RE.test(value)) return value;

  try {
    const db = getDb();
    const rows = await db.query(
      `SELECT id FROM enterprises WHERE code = $1 LIMIT 1`,
      [value]
    );
    return rows[0]?.id as string | undefined;
  } catch {
    return undefined;
  }
}

export async function buildFeatureContext(
  req: Request,
  bodyContext?: Partial<FeatureFlagContext>,
): Promise<FeatureFlagContext> {
  const auth = getRequestAuth(req);
  const enterpriseId = await resolveEnterpriseId(
    bodyContext?.enterprise_id || auth.tenantCode
  );

  return {
    user_id: auth.userId || bodyContext?.user_id,
    property_id: bodyContext?.property_id,
    enterprise_id: enterpriseId,
    vertical: bodyContext?.vertical,
    region: bodyContext?.region,
    tier: bodyContext?.tier,
    user_agent:
      bodyContext?.user_agent || req.headers.get("user-agent") || undefined,
    is_beta_tester: bodyContext?.is_beta_tester,
  };
}
