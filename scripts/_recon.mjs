import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const cols = await sql.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_subscriptions'`
  );
  console.log("cols:", cols.map(c => c.column_name).join(", "));
  const rows = await sql.query(`
    SELECT ts.tenant_id, t.code, ts.plan_id, sp.name AS plan_name, ts.tier, ts.status,
           ts.subscribed_verticals, ts.price, ts.billing_period, ts.start_date, ts.end_date
    FROM public.tenant_subscriptions ts
    LEFT JOIN public.tenants t ON t.id = ts.tenant_id
    LEFT JOIN public.subscription_plans sp ON sp.id = ts.plan_id
  `);
  console.log("rows:", JSON.stringify(rows, null, 1));
  process.exit(0);
}

main().catch((e) => { console.error("ERR", e.message); process.exit(1); });
