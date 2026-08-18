import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function test() {
  try {
    const rows = await sql`
      WITH active_bookings_raw AS (
        SELECT 
          b.unit_id,
          b.id as booking_id,
          b.status as booking_status,
          b.check_in,
          b.check_out,
          b.total_amount,
          g.first_name,
          g.last_name,
          pa.slot_number as parking_slot,
          (SELECT COUNT(*) FROM guest_requests gr WHERE gr.booking_id = b.id AND gr.status IN ('pending', 'in_progress')) as pending_requests_count,
          ROW_NUMBER() OVER(PARTITION BY b.unit_id ORDER BY CASE WHEN b.status = 'checked_in' THEN 1 WHEN b.status = 'confirmed' THEN 2 ELSE 3 END, b.check_in ASC) as rn
        FROM bookings b
        LEFT JOIN guest_profiles g ON g.id = b.guest_id
        LEFT JOIN parking_allocations pa ON pa.booking_id = b.id AND pa.status = 'active'
        WHERE b.status IN ('confirmed', 'checked_in', 'pending')
        AND (b.check_in::date <= CURRENT_DATE AND b.check_out::date >= CURRENT_DATE)
      ),
      active_bookings AS (
        SELECT * FROM active_bookings_raw WHERE rn = 1
      )
      SELECT 
        u.id,
        u.unit_label,
        u.unit_type,
        u.status,
        f.floor_number,
        ab.booking_id,
        ab.first_name || ' ' || ab.last_name as guest_name,
        ab.check_in,
        ab.check_out,
        ab.total_amount as rate,
        false as vip,
        ab.parking_slot,
        ab.pending_requests_count
      FROM units u
      JOIN floors f ON u.floor_id = f.id
      JOIN buildings bl ON f.building_id = bl.id
      JOIN properties p ON bl.property_id = p.id
      LEFT JOIN active_bookings ab ON ab.unit_id = u.id
      WHERE p.vertical_type = 'hotel'
      ORDER BY f.floor_number, u.unit_label
    `;
    const counts = {};
    const duplicates = [];
    for (const row of rows) {
      counts[row.id] = (counts[row.id] || 0) + 1;
      if (counts[row.id] === 2) duplicates.push(row.id);
    }
    const c = rows.filter(r => r.id === '3b9003b4-d970-409c-99fa-633b2e511c01');
    console.log("Success:", rows.length, "rows returned");
    console.log("Count of 3b90...:", c.length);
    console.log("Duplicates:", duplicates);
  } catch (err) {
    console.error("SQL Error:", err);
  }
}

test();
