// Subscription-Based Provisioning Helpers
// File: lib/features/subscription.ts
// Purpose: Platform-side subscription contract + tenant shard feature provisioning.
// The subscription lives in `public` (platform level); feature overrides live in the
// tenant shard at `global` scope (owned by the platform / Nexus Management).

import { getDb, getPublicDb } from "@/lib/db";
import type { WrappedSql } from "@/lib/db";

// ============================================================
// Constants
// ============================================================

export type SubscriptionStatus = "active" | "trial" | "paused" | "cancelled";

export const TIER_LEVEL: Record<string, number> = {
  basic: 1,
  professional: 2,
  enterprise: 3,
};

export const VERTICAL_LABELS: Record<string, string> = {
  hospitality_hotels: "Hotels & Resorts",
  hospitality_serviced_apartments: "Serviced Apartments",
  apartment_rental: "Apartment Rental",
  commercial: "Commercial",
  industrial: "Industrial & Logistics",
  land_promotion: "Land Promotion",
  workplace_management: "Workplace Management",
};

export const ALL_VERTICALS = Object.keys(VERTICAL_LABELS);

// Legacy workspace type (config.workspaces[].type) <-> feature vertical code
export const WORKSPACE_TO_VERTICAL: Record<string, string> = {
  hotels: "hospitality_hotels",
  apartments: "hospitality_serviced_apartments",
  rental: "apartment_rental",
  workplace: "workplace_management",
};

export const VERTICAL_TO_WORKSPACE: Record<string, string> = {
  hospitality_hotels: "hotels",
  hospitality_serviced_apartments: "apartments",
  apartment_rental: "rental",
  workplace_management: "workplace",
};

// Feature vertical -> property vertical_type in the shard (legacy 4 only)
export const VERTICAL_TO_PROPERTY_TYPE: Record<string, string> = {
  hospitality_hotels: "hotel",
  hospitality_serviced_apartments: "service_apartment",
  apartment_rental: "rental_apartment",
  workplace_management: "workplace",
};

// ============================================================
// Types
// ============================================================

export interface TenantRow {
  id: string;
  name: string;
  code: string;
  schema_name: string;
  is_active: boolean;
  config: Record<string, unknown> | null;
}

export interface SubscriptionRow {
  tenant_id: string;
  tenant_code?: string;
  tenant_name?: string;
  plan_id: string | null;
  plan_name: string | null;
  tier: string;
  status: string;
  subscribed_verticals: string[];
  price: number | null;
  billing_period: string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface PlanRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  tier: string;
  price: number | null;
  billing_period: string;
  is_active: boolean;
}

// ============================================================
// Lookups
// ============================================================

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function getTenantByCode(code: string): Promise<TenantRow | null> {
  const db = getPublicDb();
  const rows = (await db.query(
    "SELECT id, name, code, schema_name, is_active, config FROM public.tenants WHERE code = $1 LIMIT 1",
    [code]
  )) as unknown as TenantRow[];
  return rows[0] || null;
}

export async function getTenantSubscriptionByTenantId(tenantId: string): Promise<SubscriptionRow | null> {
  const db = getPublicDb();
  const rows = (await db.query(
    `SELECT ts.tenant_id, ts.plan_id, sp.name AS plan_name, ts.tier, ts.status,
            ts.subscribed_verticals, ts.price, ts.billing_period, ts.start_date, ts.end_date
     FROM public.tenant_subscriptions ts
     LEFT JOIN public.subscription_plans sp ON sp.id = ts.plan_id
     WHERE ts.tenant_id = $1 LIMIT 1`,
    [tenantId]
  )) as unknown as SubscriptionRow[];
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    subscribed_verticals: toStringArray(row.subscribed_verticals),
  };
}

export async function getTenantSubscriptionBySchema(schemaName: string): Promise<SubscriptionRow | null> {
  const db = getPublicDb();
  const rows = (await db.query(
    "SELECT * FROM public.get_tenant_subscription($1)",
    [schemaName]
  )) as unknown as SubscriptionRow[];
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    subscribed_verticals: toStringArray(row.subscribed_verticals),
  };
}

export async function getSubscriptionPlans(activeOnly = true): Promise<PlanRow[]> {
  const db = getPublicDb();
  const rows = (await db.query(
    `SELECT id, code, name, description, tier, price, billing_period, is_active
     FROM public.subscription_plans
     ${activeOnly ? "WHERE is_active = true" : ""}
     ORDER BY price NULLS LAST, tier`,
  )) as unknown as PlanRow[];
  return rows;
}

// ============================================================
// Subscription upsert
// ============================================================

export interface UpsertSubscriptionInput {
  plan_id?: string | null;
  tier?: string;
  status?: string;
  subscribed_verticals?: string[];
  price?: number | null;
  billing_period?: string;
}

export async function upsertTenantSubscription(
  tenantId: string,
  input: UpsertSubscriptionInput,
): Promise<SubscriptionRow> {
  const db = getPublicDb();
  const existing = (await db.query(
    "SELECT id FROM public.tenant_subscriptions WHERE tenant_id = $1 LIMIT 1",
    [tenantId]
  )) as unknown as { id: string }[];

  const tier = input.tier ?? "basic";
  const status = input.status ?? "active";
  const verticals = input.subscribed_verticals ?? ["hospitality_hotels"];

  if (existing[0]) {
    await db.query(
      `UPDATE public.tenant_subscriptions SET
         plan_id = COALESCE($2, plan_id),
         tier = COALESCE($3, tier),
         status = COALESCE($4, status),
         subscribed_verticals = COALESCE($5::jsonb, subscribed_verticals),
         price = COALESCE($6, price),
         billing_period = COALESCE($7, billing_period),
         updated_at = now()
       WHERE id = $1`,
      [
        existing[0].id,
        input.plan_id ?? null,
        input.tier ?? null,
        input.status ?? null,
        input.subscribed_verticals ? JSON.stringify(verticals) : null,
        input.price ?? null,
        input.billing_period ?? null,
      ]
    );
  } else {
    await db.query(
      `INSERT INTO public.tenant_subscriptions
         (tenant_id, plan_id, tier, status, subscribed_verticals, price, billing_period)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)`,
      [
        tenantId,
        input.plan_id ?? null,
        tier,
        status,
        JSON.stringify(verticals),
        input.price ?? null,
        input.billing_period ?? "monthly",
      ]
    );
  }

  const fresh = await getTenantSubscriptionByTenantId(tenantId);
  if (!fresh) throw new Error("Failed to persist tenant subscription");
  return fresh;
}

// ============================================================
// Tier / availability evaluation
// ============================================================

function tierAllows(minTier: string | null | undefined, subTier: string | undefined): boolean {
  if (!minTier) return true;
  if (!subTier) return false;
  return (TIER_LEVEL[minTier] ?? 0) <= (TIER_LEVEL[subTier] ?? 0);
}

export interface AvailabilityEntry {
  vertical_name: string;
  min_tier: string | null;
}

export async function getFlagAvailability(
  db: WrappedSql,
  flagKey: string,
): Promise<AvailabilityEntry[]> {
  const rows = (await db.query(
    `SELECT fa.vertical_name, fa.min_tier
     FROM feature_availability fa
     JOIN feature_flags ff ON ff.id = fa.feature_flag_id
     WHERE ff.flag_key = $1`,
    [flagKey]
  )) as unknown as AvailabilityEntry[];
  return rows;
}

export function isFlagGrantable(
  availability: AvailabilityEntry[],
  sub: SubscriptionRow,
): boolean {
  if (availability.length === 0) return true;
  return availability.some(
    (a) =>
      sub.subscribed_verticals.includes(a.vertical_name) &&
      tierAllows(a.min_tier, sub.tier),
  );
}

export function isSubscriptionActive(status?: string): boolean {
  return status === "active" || status === "trial";
}

/**
 * Enforcement gate used by the tenant-side enable path. The platform subscription is
 * the ceiling: a tenant cannot enable a feature that isn't included in their plan.
 */
export async function enforceSubscriptionForFlag(
  db: WrappedSql,
  flagKey: string,
  sub: SubscriptionRow,
): Promise<{ allowed: boolean; message?: string }> {
  if (!isSubscriptionActive(sub.status)) {
    return {
      allowed: false,
      message: `Tenant subscription is '${sub.status}'. Contact Nexus Management to reactivate.`,
    };
  }

  const availability = await getFlagAvailability(db, flagKey);
  if (availability.length === 0) {
    // Infra / unlisted flag — no vertical gate. Allow.
    return { allowed: true };
  }

  if (!isFlagGrantable(availability, sub)) {
    const subs = sub.subscribed_verticals.join(", ");
    return {
      allowed: false,
      message: `'${flagKey}' is not included in the '${sub.tier}' subscription${
        subs ? ` (subscribed verticals: ${subs})` : ""
      }. Contact Nexus Management to upgrade your plan.`,
    };
  }

  return { allowed: true };
}

// ============================================================
// Tenant shard provisioning (feature overrides at global scope)
// ============================================================

async function syncFlagCatalog(db: WrappedSql): Promise<number> {
  const inserted = (await db.query(
    `INSERT INTO feature_flags (flag_key, name, description, category, owner_team, status, default_enabled, config)
     SELECT ff.flag_key, ff.name, ff.description, ff.category, ff.owner_team, ff.status, ff.default_enabled, ff.config
     FROM viswa.feature_flags ff
     WHERE NOT EXISTS (SELECT 1 FROM feature_flags t WHERE t.flag_key = ff.flag_key)
     ON CONFLICT (flag_key) DO NOTHING
     RETURNING flag_key`,
  )) as unknown as { flag_key: string }[];

  await db.query(
    `INSERT INTO feature_availability (feature_flag_id, vertical_name, min_tier)
     SELECT t.id, va.vertical_name, va.min_tier
     FROM viswa.feature_availability va
     JOIN viswa.feature_flags vf ON vf.id = va.feature_flag_id
     JOIN feature_flags t ON t.flag_key = vf.flag_key
     LEFT JOIN feature_availability ta ON ta.feature_flag_id = t.id AND ta.vertical_name = va.vertical_name
     WHERE ta.id IS NULL
     ON CONFLICT (feature_flag_id, vertical_name) DO NOTHING`,
  );

  return inserted.length;
}

async function upsertGlobalOverride(
  db: WrappedSql,
  flagId: string,
  enabled: boolean,
  reason: string,
): Promise<void> {
  const existing = (await db.query(
    `SELECT id FROM feature_flag_overrides
     WHERE feature_flag_id = $1 AND scope = 'global'
       AND enterprise_id IS NULL AND property_id IS NULL AND user_id IS NULL
     LIMIT 1`,
    [flagId]
  )) as unknown as { id: string }[];

  if (existing[0]) {
    await db.query(
      `UPDATE feature_flag_overrides
       SET is_enabled = $2, reason = $3, approval_status = 'approved',
           approved_at = now(), updated_at = now()
       WHERE id = $1`,
      [existing[0].id, enabled, reason]
    );
  } else {
    await db.query(
      `INSERT INTO feature_flag_overrides
         (feature_flag_id, scope, enterprise_id, property_id, user_id, is_enabled, reason, approval_status)
       VALUES ($1, 'global', NULL, NULL, NULL, $2, $3, 'approved')`,
      [flagId, enabled, reason]
    );
  }
}

export interface SyncResult {
  granted: string[];
  revoked: string[];
  catalogAdded: number;
}

/**
 * Grant/revoke feature overrides in the tenant shard to match the subscription.
 * Only flags that carry a feature_availability matrix are managed; infra flags are left alone.
 */
export async function syncTenantFeatures(
  tenant: TenantRow,
  sub: SubscriptionRow,
): Promise<SyncResult> {
  const db = getDb(tenant.schema_name);
  const catalogAdded = await syncFlagCatalog(db);

  const rows = (await db.query(
    `SELECT ff.id, ff.flag_key,
            COALESCE(jsonb_agg(
              jsonb_build_object('vertical_name', fa.vertical_name, 'min_tier', fa.min_tier)
            ) FILTER (WHERE fa.vertical_name IS NOT NULL), '[]') AS availability
     FROM feature_flags ff
     LEFT JOIN feature_availability fa ON fa.feature_flag_id = ff.id
     GROUP BY ff.id
     ORDER BY ff.category, ff.name`,
  )) as unknown as Array<{ id: string; flag_key: string; availability: AvailabilityEntry[] }>;

  const granted: string[] = [];
  const revoked: string[] = [];

  for (const row of rows) {
    const availability: AvailabilityEntry[] = Array.isArray(row.availability) ? row.availability : [];
    if (availability.length === 0) continue;

    const grantable = isFlagGrantable(availability, sub);
    await upsertGlobalOverride(
      db,
      row.id,
      grantable,
      grantable
        ? `Provisioned by Nexus Management (${sub.plan_name || sub.tier} plan)`
        : "Not included in subscription",
    );
    if (grantable) granted.push(row.flag_key);
    else revoked.push(row.flag_key);
  }

  return { granted, revoked, catalogAdded };
}

// ============================================================
// Workspace derivation from subscription
// ============================================================

export interface WorkspaceEntry {
  type: string;
  name: string;
  is_primary: boolean;
  provisioned?: boolean;
}

export function deriveWorkspaces(
  sub: SubscriptionRow,
  existing: WorkspaceEntry[],
): WorkspaceEntry[] {
  const previous = existing && existing.length > 0 ? existing : [];

  return sub.subscribed_verticals.map((vertical, index) => {
    const legacyType = VERTICAL_TO_WORKSPACE[vertical];
    const type = legacyType || vertical;
    const prior = previous.find((w) => w.type === type);
    return {
      type,
      name: prior?.name || `${VERTICAL_LABELS[vertical] || vertical} Workspace`,
      is_primary: index === 0 ? true : prior?.is_primary === true,
      provisioned: true,
    };
  });
}

export async function syncWorkspaces(
  tenant: TenantRow,
  sub: SubscriptionRow,
  workspaces: WorkspaceEntry[],
): Promise<void> {
  const db = getDb(tenant.schema_name);

  // Activate/deactivate legacy property rows based on subscribed verticals
  const activePropertyTypes = sub.subscribed_verticals
    .map((v) => VERTICAL_TO_PROPERTY_TYPE[v])
    .filter(Boolean);

  for (const ws of workspaces) {
    const propertyType = VERTICAL_TO_PROPERTY_TYPE[
      Object.keys(VERTICAL_TO_WORKSPACE).find((k) => VERTICAL_TO_WORKSPACE[k] === ws.type) || ""
    ] as string | undefined;
    if (!propertyType) continue;
    await db.query(
      "UPDATE properties SET is_active = true WHERE vertical_type::text = $1",
      [propertyType]
    );
  }

  if (activePropertyTypes.length > 0) {
    await db.query(
      "UPDATE properties SET is_active = false WHERE vertical_type::text NOT IN (SELECT unnest($1::text[]))",
      [activePropertyTypes]
    );
  }

  const publicDb = getPublicDb();
  const config = {
    ...(tenant.config || {}),
    subscribed_verticals: sub.subscribed_verticals,
    workspaces,
    verticals: workspaces.map((w) => w.type),
  };

  await publicDb.query(
    "UPDATE public.tenants SET config = $2::jsonb, subscribed_verticals = $3::jsonb, updated_at = now() WHERE id = $1",
    [tenant.id, JSON.stringify(config), JSON.stringify(sub.subscribed_verticals)]
  );
}
