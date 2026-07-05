/**
 * run-seed-v7.mjs — Apply guest requests + vendor bills patch and verify dashboard counts
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");

function getEnvVar(name) {
  const content = readFileSync(ENV_PATH, "utf8");
  const match = content.match(new RegExp(`^${name}=(.+)$`, "m"));
  return match[1].trim();
}

const { Pool } = pg;
const pool = new Pool({ connectionString: getEnvVar("DATABASE_URL"), ssl: { rejectUnauthorized: false }, max: 1 });

async function main() {
  const client = await pool.connect();
  try {
    await client.query("SET search_path TO viswa, public");

    // Step 1: Guest requests (status must be 'pending' per CHECK constraint)
    const gr = await client.query(`
      INSERT INTO guest_requests (property_id, booking_id, request_type, description, status, created_at)
      SELECT
        b.property_id, b.id,
        CASE (EXTRACT(day FROM b.check_in)::int % 5)
          WHEN 0 THEN 'room_service'
          WHEN 1 THEN 'housekeeping'
          WHEN 2 THEN 'maintenance'
          WHEN 3 THEN 'complaint'
          ELSE 'other'
        END,
        CASE (EXTRACT(day FROM b.check_in)::int % 5)
          WHEN 0 THEN 'Room service: 2x coffee, 1x sandwich'
          WHEN 1 THEN 'Extra bath towels and pillow needed'
          WHEN 2 THEN 'AC not cooling properly in the room'
          WHEN 3 THEN 'Noise disturbance from neighbouring room'
          ELSE 'Late checkout requested until 2 PM'
        END,
        'pending',
        CURRENT_TIMESTAMP - (random() * interval '3 hours')
      FROM bookings b
      WHERE b.status = 'checked_in'
        AND NOT EXISTS (SELECT 1 FROM guest_requests gr WHERE gr.booking_id = b.id)
      LIMIT 10
    `);
    console.log(`✅ Inserted ${gr.rowCount} guest requests`);

    // Step 2: Vendor bills (using DO block to avoid constraint issues)
    await client.query(`
      DO $$
      DECLARE
        ovh_id UUID; vid_hvac UUID; vid_pest UUID; vid_laundry UUID; fn_uid UUID;
      BEGIN
        SELECT id INTO ovh_id FROM properties WHERE code = 'OVH';
        SELECT id INTO vid_hvac FROM vendors WHERE company_name ILIKE '%hvac%' LIMIT 1;
        SELECT id INTO vid_pest FROM vendors WHERE company_name ILIKE '%pest%' LIMIT 1;
        SELECT id INTO vid_laundry FROM vendors WHERE company_name ILIKE '%laundry%' LIMIT 1;
        SELECT id INTO fn_uid FROM users WHERE email = 'finance@ehms.demo';
        IF NOT EXISTS (SELECT 1 FROM vendor_bills WHERE bill_number = 'INV-LIVE-HVAC-001') THEN
          INSERT INTO vendor_bills (property_id, vendor_id, bill_number, bill_date, due_date, category, subtotal, tax_total, grand_total, paid_total, status, notes, created_by, created_at)
          VALUES (ovh_id, vid_hvac, 'INV-LIVE-HVAC-001', CURRENT_DATE-5, CURRENT_DATE-1, 'service', 65000, 11700, 76700, 0, 'approved', 'HVAC quarterly maintenance overdue', fn_uid, CURRENT_DATE-5);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM vendor_bills WHERE bill_number = 'INV-LIVE-PEST-001') THEN
          INSERT INTO vendor_bills (property_id, vendor_id, bill_number, bill_date, due_date, category, subtotal, tax_total, grand_total, paid_total, status, notes, created_by, created_at)
          VALUES (ovh_id, vid_pest, 'INV-LIVE-PEST-001', CURRENT_DATE-2, CURRENT_DATE+5, 'service', 18000, 3240, 21240, 0, 'pending', 'Monthly pest control service', fn_uid, CURRENT_DATE-2);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM vendor_bills WHERE bill_number = 'INV-LIVE-LND-001') THEN
          INSERT INTO vendor_bills (property_id, vendor_id, bill_number, bill_date, due_date, category, subtotal, tax_total, grand_total, paid_total, status, notes, created_by, created_at)
          VALUES (ovh_id, vid_laundry, 'INV-LIVE-LND-001', CURRENT_DATE, CURRENT_DATE+15, 'service', 42000, 7560, 49560, 0, 'pending', 'Weekly laundry service', fn_uid, CURRENT_DATE);
        END IF;
      END $$;
    `);
    console.log("✅ Vendor bills seeded");

    // Verify final counts
    const result = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM payments WHERE status='completed') AS payments,
        (SELECT COUNT(*) FROM guest_feedbacks) AS feedbacks,
        (SELECT COUNT(*) FROM maintenance_tickets WHERE status IN ('open','in_progress')) AS open_maint,
        (SELECT COUNT(*) FROM housekeeping_tasks WHERE status = 'open') AS open_hk,
        (SELECT COUNT(*) FROM guest_requests WHERE status IN ('pending','in_progress')) AS open_requests,
        (SELECT COUNT(*) FROM vendor_bills WHERE status IN ('pending','overdue','approved') AND balance_due > 0) AS pending_bills,
        (SELECT ROUND(COALESCE(SUM(paid_amount),0)::numeric / 100000, 1) FROM bookings WHERE paid_amount > 0 AND status IN ('checked_out','checked_in')) AS booking_revenue_lk,
        (SELECT ROUND(COALESCE(SUM(amount),0)::numeric / 100000, 1) FROM payments WHERE status='completed') AS payment_revenue_lk
    `);
    const row = result.rows[0];
    console.log("\n📊 Dashboard-Ready Data Verification:");
    console.log(`  ✅ Payments (completed):         ${row.payments}`);
    console.log(`  ✅ Guest Feedbacks:              ${row.feedbacks}`);
    console.log(`  ✅ Open Maintenance Tickets:     ${row.open_maint}`);
    console.log(`  ✅ Open HK Tasks:                ${row.open_hk}`);
    console.log(`  ✅ Pending Guest Requests:       ${row.open_requests}`);
    console.log(`  ✅ Pending Vendor Bills:         ${row.pending_bills}`);
    console.log(`  ✅ Revenue from bookings (₹L):   ${row.booking_revenue_lk}L`);
    console.log(`  ✅ Revenue from payments (₹L):   ${row.payment_revenue_lk}L`);
    console.log("\n🎉 Dashboard should now show real data! Start the dev server to verify.");
  } catch (e) {
    console.error("ERROR:", e.message);
    console.error(e.stack);
  } finally {
    client.release();
    pool.end();
  }
}
main();
