import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const envContent = readFileSync(".env.local", "utf-8");
let DB_URL = "";
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("DATABASE_URL=")) {
    DB_URL = trimmed.slice("DATABASE_URL=".length).trim();
    break;
  }
}

const sql = neon(DB_URL);

async function main() {
  try {
    const propId = (await sql`SELECT id FROM properties LIMIT 1`)[0].id;
    const unitId = (await sql`SELECT id FROM units WHERE status = 'vacant' LIMIT 1`)[0].id;
    const tenantId = (await sql`SELECT id FROM guest_profiles LIMIT 1`)[0].id;

    console.log("Found IDs:", { propId, unitId, tenantId });

    const ref = `LS-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    const status = "active";
    const start_date = "2026-07-01";
    const end_date = "2027-06-30";
    const rent_amount = 25000;
    const security_deposit = 50000;
    const notice_period_days = 30;

    const leaseRows = await sql`
      INSERT INTO lease_agreements (
        property_id,
        unit_id,
        tenant_id,
        agreement_ref,
        status,
        start_date,
        end_date,
        rent_amount,
        security_deposit,
        notice_period_days,
        signed_by_tenant,
        signed_by_owner
      ) VALUES (
        ${propId},
        ${unitId},
        ${tenantId},
        ${ref},
        ${status || "active"},
        ${start_date},
        ${end_date},
        ${rent_amount},
        ${security_deposit || null},
        ${notice_period_days || 30},
        true,
        true
      )
      RETURNING *
    `;
    console.log("Success:", leaseRows);
  } catch (err) {
    console.error("DB Error:", err.message);
  }
}

main();
