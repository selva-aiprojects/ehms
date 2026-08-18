-- ============================================================
-- Subscription-Based Provisioning (044)
--   Purpose: Give the platform (Nexus Management) a subscription
--   contract so it can provision feature flags / workspaces per
--   tenant based on their plan. Prices are PLACEHOLDERS.
--   Lives in the public schema (platform-level, shared by all shards).
-- ============================================================

-- ── 1. Subscription Plans ──
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(50) UNIQUE NOT NULL,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    tier          VARCHAR(50) NOT NULL,   -- basic | professional | enterprise
    price         NUMERIC(12,2),          -- PLACEHOLDER — finalize later
    billing_period VARCHAR(20) DEFAULT 'monthly',
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_tier ON public.subscription_plans(tier);

-- ── 2. Tenant Subscriptions (one active row per tenant) ──
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id             UUID REFERENCES public.subscription_plans(id),
    tier                VARCHAR(50) NOT NULL DEFAULT 'basic',
    status              VARCHAR(20) NOT NULL DEFAULT 'active',  -- active | trial | paused | cancelled
    subscribed_verticals JSONB NOT NULL DEFAULT '["hospitality_hotels"]',
    price               NUMERIC(12,2),     -- PLACEHOLDER
    billing_period      VARCHAR(20) DEFAULT 'monthly',
    start_date          DATE DEFAULT CURRENT_DATE,
    end_date            DATE,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON public.tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_plan ON public.tenant_subscriptions(plan_id);

-- ── 3. Seed Plans (placeholder pricing) ──
INSERT INTO public.subscription_plans (code, name, description, tier, price, billing_period) VALUES
('BASIC',        'Basic Hospitality',     'Core hospitality operations (single property)', 'basic',        2499.00,  'monthly'),
('PROFESSIONAL', 'Professional Hospitality', 'Multi-property hospitality with revenue AI',   'professional', 7999.00,  'monthly'),
('ENTERPRISE',   'Enterprise Suite',      'All verticals, commercial/industrial/land + AI agents', 'enterprise', 19999.00, 'monthly')
ON CONFLICT (code) DO NOTHING;

-- ── 4. Backfill subscriptions for existing tenants ──
INSERT INTO public.tenant_subscriptions (tenant_id, tier, status, subscribed_verticals, price, billing_period)
SELECT
    t.id,
    'professional',
    'active',
    COALESCE(
        NULLIF(t.subscribed_verticals, '[]'::jsonb),
        COALESCE(t.config->'subscribed_verticals', '["hospitality_hotels"]'::jsonb)
    ),
    NULL,
    'monthly'
FROM public.tenants t
WHERE NOT EXISTS (SELECT 1 FROM public.tenant_subscriptions ts WHERE ts.tenant_id = t.id);

-- Backfill verticals for subscriptions created before config existed (VISWA legacy)
-- Prefer the richer config->subscribed_verticals list when it has more entries.
UPDATE public.tenant_subscriptions ts
SET subscribed_verticals = COALESCE(
        CASE WHEN jsonb_array_length(t.config->'subscribed_verticals') > jsonb_array_length(ts.subscribed_verticals)
             THEN t.config->'subscribed_verticals'
             ELSE ts.subscribed_verticals END,
        ts.subscribed_verticals
    ),
    updated_at = now()
FROM public.tenants t
WHERE t.id = ts.tenant_id
  AND jsonb_typeof(t.config->'subscribed_verticals') = 'array'
  AND jsonb_array_length(t.config->'subscribed_verticals') > jsonb_array_length(ts.subscribed_verticals);

-- ── 5. Helper: subscription lookup by schema ──
CREATE OR REPLACE FUNCTION public.get_tenant_subscription(
    p_schema_name VARCHAR
) RETURNS TABLE (
    tenant_id UUID,
    tenant_code VARCHAR,
    tenant_name VARCHAR,
    plan_id UUID,
    plan_name VARCHAR,
    tier VARCHAR,
    status VARCHAR,
    subscribed_verticals JSONB,
    price NUMERIC,
    billing_period VARCHAR,
    start_date DATE,
    end_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.code,
        t.name,
        ts.plan_id,
        sp.name,
        ts.tier,
        ts.status,
        ts.subscribed_verticals,
        ts.price,
        ts.billing_period,
        ts.start_date,
        ts.end_date
    FROM public.tenant_subscriptions ts
    JOIN public.tenants t ON t.id = ts.tenant_id
    LEFT JOIN public.subscription_plans sp ON sp.id = ts.plan_id
    WHERE t.schema_name = p_schema_name
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- END OF SUBSCRIPTION PROVISIONING SCHEMA
-- ============================================================
