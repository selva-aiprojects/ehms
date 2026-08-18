import { NextRequest, NextResponse } from "next/server";
import { getPublicDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

function requirePlatformAdmin(req: NextRequest) {
  const token = req.cookies.get("ehms_token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload?.is_platform_admin) {
    return { error: "Only platform superadmins can manage subscriptions" };
  }
  return null;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
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

export async function GET() {
  const db = getPublicDb();
  try {
    // Plans
    const plans = (await db.query(
      `SELECT id, code, name, description, tier, price, billing_period, is_active, created_at
       FROM public.subscription_plans ORDER BY price NULLS LAST, tier`
    )) as unknown as Array<Record<string, unknown>>;

    // Tenants + subscriptions
    const subs = (await db.query(
      `SELECT ts.tenant_id, ts.plan_id, sp.name AS plan_name, sp.code AS plan_code,
              ts.tier, ts.status, ts.subscribed_verticals, ts.price, ts.billing_period,
              ts.start_date, ts.end_date,
              t.name AS tenant_name, t.code AS tenant_code, t.schema_name,
              t.is_active AS tenant_active, t.created_at AS tenant_created_at
       FROM public.tenant_subscriptions ts
       JOIN public.tenants t ON t.id = ts.tenant_id
       LEFT JOIN public.subscription_plans sp ON sp.id = ts.plan_id
       ORDER BY t.created_at ASC`
    )) as unknown as Array<Record<string, unknown>>;

    // MRR + ARPU
    const mrrResult = (await db.query(
      `WITH priced AS (
         SELECT COALESCE(ts.price, sp.price, 0) AS amount, ts.status,
                ts.billing_period, ts.subscribed_verticals
         FROM public.tenant_subscriptions ts
         LEFT JOIN public.subscription_plans sp ON sp.id = ts.plan_id
       )
       SELECT
         COALESCE(SUM(amount) FILTER (WHERE status IN ('active','trial')), 0) AS mrr,
         COUNT(*) FILTER (WHERE status IN ('active','trial')) AS active_count,
         COUNT(*) FILTER (WHERE status = 'trial') AS trial_count,
         COUNT(*) FILTER (WHERE status = 'paused') AS paused_count,
         COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count,
         SUM(CASE WHEN status IN ('active','trial') THEN 1 ELSE 0 END)
           FILTER (WHERE billing_period = 'yearly') * 12 AS yearly_mrr_equiv
       FROM priced`
    )) as unknown as Array<Record<string, unknown>>;
    const mrrRow = mrrResult[0] || {};
    const activeCount = Number(mrrRow.active_count || 0);
    const mrr = Number(mrrRow.mrr || 0);

    // Invoices (recent)
    const invoices = (await db.query(
      `SELECT pi.id, pi.invoice_number, pi.tenant_id, t.code AS tenant_code, t.name AS tenant_name,
              pi.period_start, pi.period_end, pi.plan_label, pi.tier, pi.amount,
              pi.tax_amount, pi.total_amount, pi.currency, pi.status, pi.issue_date,
              pi.due_date, pi.paid_at, pi.payment_mode, pi.notes,
              COALESCE(SUM(pp.amount), 0) AS paid_amount
       FROM public.platform_invoices pi
       JOIN public.tenants t ON t.id = pi.tenant_id
       LEFT JOIN public.platform_payments pp ON pp.invoice_id = pi.id
       GROUP BY pi.id, t.code, t.name
       ORDER BY pi.period_start DESC
       LIMIT 50`
    )) as unknown as Array<Record<string, unknown>>;

    // Payments (recent)
    const payments = (await db.query(
      `SELECT pp.id, pp.invoice_id, pi.invoice_number, pp.tenant_id, t.code AS tenant_code,
              t.name AS tenant_name, pp.amount, pp.currency, pp.payment_mode, pp.reference,
              pp.received_at, pp.notes
       FROM public.platform_payments pp
       JOIN public.tenants t ON t.id = pp.tenant_id
       JOIN public.platform_invoices pi ON pi.id = pp.invoice_id
       ORDER BY pp.received_at DESC
       LIMIT 50`
    )) as unknown as Array<Record<string, unknown>>;

    // Billing trend (last 12 months of invoice totals)
    const trend = (await db.query(
      `WITH months AS (
         SELECT generate_series(
           date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
           date_trunc('month', CURRENT_DATE),
           INTERVAL '1 month'
         )::date AS month
       )
       SELECT to_char(m.month, 'YYYY-MM') AS label,
              COALESCE(SUM(pi.total_amount), 0) AS invoiced,
              COALESCE(SUM(pi.total_amount) FILTER (WHERE pi.status = 'paid'), 0) AS collected
       FROM months m
       LEFT JOIN public.platform_invoices pi
         ON date_trunc('month', pi.period_start)::date = m.month
          AND pi.status IN ('paid', 'issued', 'overdue')
       GROUP BY m.month ORDER BY m.month`
    )) as unknown as Array<Record<string, unknown>>;

    // Outstanding totals
    const outstanding = (await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS outstanding
       FROM public.platform_invoices WHERE status IN ('issued', 'overdue')`
    )) as unknown as Array<Record<string, unknown>>;

    const totals = (await db.query(
      `SELECT COUNT(*) AS invoice_count,
              COALESCE(SUM(total_amount), 0) AS lifetime_total,
              COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) AS lifetime_collected
       FROM public.platform_invoices`
    )) as unknown as Array<Record<string, unknown>>;

    return NextResponse.json({
      plans,
      subscriptions: subs.map((s) => ({ ...s, subscribed_verticals: toStringArray(s.subscribed_verticals) })),
      metrics: {
        mrr,
        arpu: activeCount > 0 ? Math.round(mrr / activeCount) : 0,
        active_subscriptions: activeCount,
        trial_count: Number(mrrRow.trial_count || 0),
        paused_count: Number(mrrRow.paused_count || 0),
        cancelled_count: Number(mrrRow.cancelled_count || 0),
        outstanding: Number(outstanding[0]?.outstanding || 0),
        invoice_count: Number(totals[0]?.invoice_count || 0),
        lifetime_total: Number(totals[0]?.lifetime_total || 0),
        lifetime_collected: Number(totals[0]?.lifetime_collected || 0),
      },
      invoices,
      payments,
      trend,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load subscriptions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requirePlatformAdmin(req);
  if (auth) return NextResponse.json({ error: auth.error }, { status: 403 });

  const db = getPublicDb();
  try {
    const body = await req.json();
    const action = body.action as string;

    switch (action) {
      case "generate_invoice": {
        const { tenant_id } = body;
        if (!tenant_id) return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });

        const sub = (await db.query(
          `SELECT ts.tenant_id, ts.tier, COALESCE(ts.price, sp.price, 0) AS price,
                  sp.name AS plan_name, t.code AS tenant_code
           FROM public.tenant_subscriptions ts
           JOIN public.tenants t ON t.id = ts.tenant_id
           LEFT JOIN public.subscription_plans sp ON sp.id = ts.plan_id
           WHERE ts.tenant_id = $1 LIMIT 1`,
          [tenant_id]
        )) as unknown as Array<{ tenant_id: string; tier: string; price: number; plan_name: string | null; tenant_code: string }>;
        if (!sub[0]) return NextResponse.json({ error: "No subscription for tenant" }, { status: 404 });

        const s = sub[0];
        const month = new Date();
        month.setDate(1);
        month.setHours(0, 0, 0, 0);
        const periodStart = month.toISOString().slice(0, 10);
        const periodEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().slice(0, 10);

        const existing = (await db.query(
          `SELECT id FROM public.platform_invoices
           WHERE tenant_id = $1 AND period_start = $2 LIMIT 1`,
          [tenant_id, periodStart]
        )) as unknown as Array<{ id: string }>;
        if (existing[0]) return NextResponse.json({ error: "Invoice already exists for this period" }, { status: 409 });

        const seq = (await db.query(`SELECT nextval('public.platform_invoice_seq') AS seq`)) as unknown as Array<{ seq: number }>;
        const invoiceNumber = `INV-${s.tenant_code}-${periodStart.replace(/-/g, "").slice(0, 6)}-${seq[0].seq}`;
        const amount = Number(s.price) || 0;

        const inserted = (await db.query(
          `INSERT INTO public.platform_invoices
             (invoice_number, tenant_id, period_start, period_end, plan_label, tier,
              amount, tax_amount, total_amount, currency, status, issue_date, due_date, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'INR', 'issued', $10, $11, $12)
           RETURNING id, invoice_number, amount, tax_amount, total_amount`,
          [
            invoiceNumber, tenant_id, periodStart, periodEnd,
            s.plan_name || s.tier, s.tier, amount,
            Math.round(amount * 0.18 * 100) / 100, Math.round(amount * 1.18 * 100) / 100,
            periodStart, new Date(month.getFullYear(), month.getMonth(), 10).toISOString().slice(0, 10),
            "Manually generated by platform admin",
          ]
        )) as unknown as Array<Record<string, unknown>>;

        return NextResponse.json({ invoice: inserted[0] });
      }

      case "record_payment": {
        const { invoice_id, amount, payment_mode, reference } = body;
        if (!invoice_id || amount == null) {
          return NextResponse.json({ error: "invoice_id and amount are required" }, { status: 400 });
        }

        const inv = (await db.query(
          `SELECT id, tenant_id, total_amount FROM public.platform_invoices WHERE id = $1 LIMIT 1`,
          [invoice_id]
        )) as unknown as Array<{ id: string; tenant_id: string; total_amount: number }>;
        if (!inv[0]) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

        const paid = (await db.query(
          `SELECT COALESCE(SUM(amount), 0) AS total FROM public.platform_payments WHERE invoice_id = $1`,
          [invoice_id]
        )) as unknown as Array<{ total: number }>;

        const payAmount = Number(amount);
        const paidSoFar = Number(paid[0]?.total || 0);
        const total = Number(inv[0].total_amount || 0);

        const inserted = (await db.query(
          `INSERT INTO public.platform_payments
             (invoice_id, tenant_id, amount, currency, payment_mode, reference, received_at)
           VALUES ($1, $2, $3, 'INR', $4, $5, now())
           RETURNING id, amount, payment_mode, reference`,
          [invoice_id, inv[0].tenant_id, payAmount, payment_mode || "bank_transfer", reference || null]
        )) as unknown as Array<Record<string, unknown>>;

        if (paidSoFar + payAmount >= total) {
          await db.query(
            `UPDATE public.platform_invoices SET status = 'paid', paid_at = now(),
                    payment_mode = $2, updated_at = now()
             WHERE id = $1`,
            [invoice_id, payment_mode || "bank_transfer"]
          );
        } else {
          await db.query(
            `UPDATE public.platform_invoices SET status = 'issued', updated_at = now() WHERE id = $1`,
            [invoice_id]
          );
        }

        return NextResponse.json({ payment: inserted[0] });
      }

      case "update_subscription": {
        const { tenant_id, tier, status, price, billing_period, plan_id } = body;
        if (!tenant_id) return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });

        const sets: string[] = ["updated_at = now()"];
        const params: unknown[] = [tenant_id];
        let i = 2;
        if (tier !== undefined) { sets.push(`tier = $${i++}`); params.push(tier); }
        if (status !== undefined) { sets.push(`status = $${i++}`); params.push(status); }
        if (price !== undefined) { sets.push(`price = $${i++}`); params.push(price === null || price === "" ? null : Number(price)); }
        if (billing_period !== undefined) { sets.push(`billing_period = $${i++}`); params.push(billing_period); }
        if (plan_id !== undefined) { sets.push(`plan_id = $${i++}`); params.push(plan_id === "" ? null : plan_id); }

        await db.query(
          `UPDATE public.tenant_subscriptions SET ${sets.join(", ")} WHERE tenant_id = $1`,
          params
        );
        return NextResponse.json({ ok: true });
      }

      case "upsert_plan": {
        const { code, name, description, tier, price, billing_period, is_active } = body;
        if (!code || !name || !tier) {
          return NextResponse.json({ error: "code, name, and tier are required" }, { status: 400 });
        }
        const result = (await db.query(
          `INSERT INTO public.subscription_plans (code, name, description, tier, price, billing_period, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (code) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             tier = EXCLUDED.tier,
             price = EXCLUDED.price,
             billing_period = EXCLUDED.billing_period,
             is_active = EXCLUDED.is_active,
             updated_at = now()
           RETURNING id, code, name, tier, price, billing_period, is_active`,
          [
            code.toUpperCase(), name, description || null, tier,
            price != null ? Number(price) : null, billing_period || "monthly",
            is_active !== false,
          ]
        )) as unknown as Array<Record<string, unknown>>;
        return NextResponse.json({ plan: result[0] });
      }

      default:
        return NextResponse.json({ error: `Unknown action '${action}'` }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Subscription operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
