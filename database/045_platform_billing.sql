-- ============================================================
-- Platform Billing & Invoicing (045)
--   Purpose: Add platform-side billing for tenant subscriptions.
--   Invoice generation, payments and MRR reporting live in the
--   public schema (platform level). Subscriptions remain in
--   tenant_subscriptions (created in 044).
-- ============================================================

-- ── 1. Platform Invoices ──
CREATE TABLE IF NOT EXISTS public.platform_invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number  VARCHAR(50) UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    plan_label      VARCHAR(255),
    tier            VARCHAR(50),
    amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency        VARCHAR(10) NOT NULL DEFAULT 'INR',
    status          VARCHAR(20) NOT NULL DEFAULT 'draft',  -- draft | issued | paid | overdue | void
    issue_date      DATE,
    due_date        DATE,
    paid_at         TIMESTAMPTZ,
    payment_mode    VARCHAR(30),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_invoices_tenant ON public.platform_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_platform_invoices_status ON public.platform_invoices(status);
CREATE INDEX IF NOT EXISTS idx_platform_invoices_period ON public.platform_invoices(period_start, period_end);

-- ── 2. Platform Payments (payment applied to an invoice) ──
CREATE TABLE IF NOT EXISTS public.platform_payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES public.platform_invoices(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    amount          NUMERIC(12,2) NOT NULL,
    currency        VARCHAR(10) NOT NULL DEFAULT 'INR',
    payment_mode    VARCHAR(30) NOT NULL DEFAULT 'bank_transfer',
    reference       VARCHAR(100),
    received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_payments_invoice ON public.platform_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_platform_payments_tenant ON public.platform_payments(tenant_id);

-- ── 3. Invoice number sequence ──
CREATE SEQUENCE IF NOT EXISTS public.platform_invoice_seq START 1000;

-- ── 4. Helper: backfill missing plan_id from tier ──
UPDATE public.tenant_subscriptions ts
SET plan_id = sp.id, updated_at = now()
FROM public.subscription_plans sp
WHERE ts.plan_id IS NULL
  AND sp.tier = ts.tier;

-- ── 5. Seed invoices for active tenants (last 6 months) ──
DO $$
DECLARE
    v_tenant RECORD;
    v_month DATE;
    v_inv_id UUID;
    v_inv_num VARCHAR;
    v_amount NUMERIC;
    v_tier VARCHAR;
    v_plan_label VARCHAR;
    v_seq INT;
BEGIN
    FOR v_tenant IN
        SELECT t.id AS tenant_id, t.code, ts.tier, sp.name AS plan_label,
               COALESCE(ts.price, sp.price, 0) AS price
        FROM public.tenants t
        JOIN public.tenant_subscriptions ts ON ts.tenant_id = t.id
        LEFT JOIN public.subscription_plans sp ON sp.id = ts.plan_id
        WHERE t.is_active = true
    LOOP
        v_month := date_trunc('month', CURRENT_DATE)::date;
        FOR i IN 1..6 LOOP
            v_month := v_month - INTERVAL '1 month';
            v_amount := v_tenant.price;
            v_tier := v_tenant.tier;
            v_plan_label := v_tenant.plan_label;

            IF NOT EXISTS (
                SELECT 1 FROM public.platform_invoices pi
                WHERE pi.tenant_id = v_tenant.tenant_id
                  AND pi.period_start = date_trunc('month', v_month)::date
            ) THEN
                SELECT nextval('public.platform_invoice_seq') INTO v_seq;
                v_inv_num := 'INV-' || v_tenant.code || '-' || to_char(v_month, 'YYYYMM') || '-' || v_seq;

                INSERT INTO public.platform_invoices
                    (invoice_number, tenant_id, period_start, period_end, plan_label, tier,
                     amount, tax_amount, total_amount, currency, status, issue_date, due_date, paid_at, payment_mode, notes)
                VALUES
                    (v_inv_num, v_tenant.tenant_id,
                     date_trunc('month', v_month)::date,
                     (date_trunc('month', v_month) + INTERVAL '1 month' - INTERVAL '1 day')::date,
                     v_plan_label, v_tier,
                     v_amount, ROUND(v_amount * 0.18, 2), ROUND(v_amount * 1.18, 2),
                     'INR', 'paid',
                     (date_trunc('month', v_month) + INTERVAL '1 day')::date,
                     (date_trunc('month', v_month) + INTERVAL '10 day')::date,
                     (date_trunc('month', v_month) + INTERVAL '8 day')::date::timestamptz,
                     'bank_transfer', 'Monthly subscription')
                RETURNING id INTO v_inv_id;

                INSERT INTO public.platform_payments
                    (invoice_id, tenant_id, amount, currency, payment_mode, reference, received_at, notes)
                VALUES
                    (v_inv_id, v_tenant.tenant_id, ROUND(v_amount * 1.18, 2), 'INR',
                     'bank_transfer', 'UTR-' || v_tenant.code || '-' || to_char(v_month, 'YYYYMM') || '-' || v_seq,
                     (date_trunc('month', v_month) + INTERVAL '8 day')::date::timestamptz,
                     'Auto-seeded payment for ' || v_plan_label);
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- ── 6. Seed current-month invoice as issued (pending payment) ──
DO $$
DECLARE
    v_tenant RECORD;
    v_inv_id UUID;
    v_seq INT;
    v_amount NUMERIC;
    v_tier VARCHAR;
    v_plan_label VARCHAR;
    v_month DATE := date_trunc('month', CURRENT_DATE)::date;
BEGIN
    FOR v_tenant IN
        SELECT t.id AS tenant_id, t.code, ts.tier, sp.name AS plan_label,
               COALESCE(ts.price, sp.price, 0) AS price
        FROM public.tenants t
        JOIN public.tenant_subscriptions ts ON ts.tenant_id = t.id
        LEFT JOIN public.subscription_plans sp ON sp.id = ts.plan_id
        WHERE t.is_active = true
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM public.platform_invoices pi
            WHERE pi.tenant_id = v_tenant.tenant_id
              AND pi.period_start = v_month
        ) THEN
            v_amount := v_tenant.price;
            v_tier := v_tenant.tier;
            v_plan_label := v_tenant.plan_label;
            SELECT nextval('public.platform_invoice_seq') INTO v_seq;

            INSERT INTO public.platform_invoices
                (invoice_number, tenant_id, period_start, period_end, plan_label, tier,
                 amount, tax_amount, total_amount, currency, status, issue_date, due_date, notes)
            VALUES
                (('INV-' || v_tenant.code || '-' || to_char(v_month, 'YYYYMM') || '-' || v_seq),
                 v_tenant.tenant_id, v_month,
                 (v_month + INTERVAL '1 month' - INTERVAL '1 day')::date,
                 v_plan_label, v_tier, v_amount, ROUND(v_amount * 0.18, 2), ROUND(v_amount * 1.18, 2),
                 'INR', 'issued', v_month::date + 1, v_month::date + 10,
                 'Current month subscription');
        END IF;
    END LOOP;
END $$;

-- ============================================================
-- END OF PLATFORM BILLING SCHEMA
-- ============================================================
