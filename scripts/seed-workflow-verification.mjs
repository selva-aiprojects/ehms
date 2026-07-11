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
  console.log("🌱 [Seed & Enrich] Preparing 100% complete workflow verification data across all 13 Gaps...");

  const hotelId = '52471369-f921-437e-9d6f-2aadc93fa595'; // Oceanview Hotel (OVH)
  const csaId = '2579f5fb-bbfa-42c0-b19b-61fec874ea48';   // Cityscape Serviced Apts (CSA)
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  try {
    await sql.transaction([
      sql.query('SET search_path TO viswa, public'),

      // ==========================================
      // 1. RATE PLANS MASTER (G1 & G10)
      // ==========================================
      sql.query(`
        INSERT INTO viswa.rate_plans (id, property_id, unit_type, name, base_rate, currency, is_dynamic, rules, is_active, created_at)
        VALUES 
          (gen_random_uuid(), '${hotelId}', 'room', 'Monsoon Peak Special', 4500.00, 'INR', true, '{"min_stay": 1, "weekend_multiplier": 1.25}'::jsonb, true, now()),
          (gen_random_uuid(), '${hotelId}', 'suite', 'Presidential Suite Package', 12500.00, 'INR', false, '{"includes_breakfast": true, "spa_access": true}'::jsonb, true, now()),
          (gen_random_uuid(), '${csaId}', 'apartment', 'Corporate Long-Stay 30+ Days', 3200.00, 'INR', true, '{"discount_pct": 20, "min_days": 30}'::jsonb, true, now()),
          (gen_random_uuid(), '${csaId}', 'room', 'Weekend Staycation Deal', 4800.00, 'INR', false, '{"includes_breakfast": true}'::jsonb, true, now())
        ON CONFLICT DO NOTHING
      `)
    ]);
    console.log("✅ [G1/G10 Rate Plans] Seeded rich seasonal & corporate rate plans across properties.");

    // ==========================================
    // 2. ROOMS MATRIX & REVENUE AUTOMATION (G4, G5, G7, G9)
    // ==========================================
    const hotelUnits = await sql`
      SELECT u.id, u.unit_label, u.base_rate FROM viswa.units u
      JOIN viswa.floors f ON u.floor_id = f.id
      JOIN viswa.buildings b ON f.building_id = b.id
      WHERE b.property_id = ${hotelId}
      ORDER BY u.unit_label LIMIT 5
    `;

    const guests = [
      { name: 'Rahul Sharma', email: 'rahul.sharma@example.com', phone: '+91-9876543210' },
      { name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91-9876543211' },
      { name: 'Vikram Mehta', email: 'vikram.mehta@example.com', phone: '+91-9876543212' },
      { name: 'Ananya Iyer', email: 'ananya.iyer@example.com', phone: '+91-9876543213' }
    ];

    let countDraftInvoices = 0;
    for (let i = 0; i < Math.min(hotelUnits.length - 1, guests.length); i++) {
      const unit = hotelUnits[i];
      const guest = guests[i];

      // 1. Ensure unit is marked 'occupied'
      await sql`UPDATE viswa.units SET status = 'occupied' WHERE id = ${unit.id}`;

      // 2. Insert or get guest profile (id, first_name, last_name, email, phone)
      const names = guest.name.split(' ');
      const guestRes = await sql`
        INSERT INTO viswa.guest_profiles (first_name, last_name, email, phone, id_type, id_number, created_at)
        VALUES (${names[0]}, ${names[1] || ''}, ${guest.email}, ${guest.phone}, 'Aadhaar', '1234-5678-901' || ${i}, now())
        RETURNING id
      `;
      const guestId = guestRes[0]?.id;

      // 3. Create active 'checked_in' booking
      const checkinDate = new Date(Date.now() - 86400000).toISOString().split("T")[0]; // yesterday
      const checkoutDate = new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]; // 2 days from now
      const bookingRes = await sql`
        INSERT INTO viswa.bookings (
          property_id, unit_id, guest_id, status, check_in, check_out,
          source, booking_model, total_amount, paid_amount, created_at
        )
        VALUES (
          ${hotelId}, ${unit.id}, ${guestId}, 'checked_in', ${checkinDate}, ${checkoutDate},
          'Direct / Walk-In', 'nightly', ${Number(unit.base_rate || 4000) * 3}, 0, now()
        )
        RETURNING id
      `;
      const bookingId = bookingRes[0]?.id;

      // 4. Create Draft Invoice (G7 / G9 requirement)
      const invNumber = `INV-OVH-${Date.now().toString().slice(-6)}-${i}`;
      const baseRate = Number(unit.base_rate || 4000);
      const taxAmt = Math.round(baseRate * 0.12);
      const totalAmt = baseRate + taxAmt;

      const invRes = await sql`
        INSERT INTO viswa.invoices (
          invoice_number, property_id, guest_id, booking_id, status,
          due_date, subtotal, tax_total, grand_total, created_at
        )
        VALUES (
          ${invNumber}, ${hotelId}, ${guestId}, ${bookingId}, 'draft',
          ${checkoutDate}, ${baseRate}, ${taxAmt}, ${totalAmt}, now()
        )
        RETURNING id
      `;
      const invoiceId = invRes[0]?.id;

      // 5. Add initial invoice lines (so Folio Charges tab shows existing charges immediately)
      await sql`
        INSERT INTO viswa.invoice_lines (invoice_id, description, quantity, unit_price, tax_rate)
        VALUES 
          (${invoiceId}, ${'Room Charge (' + unit.unit_label + ' - Night 1)'}, 1, ${baseRate}, 12.00),
          (${invoiceId}, 'In-Room Dining - Breakfast & Coffee', 1, 450.00, 5.00)
      `;

      // Update invoice totals with the extra dining item
      const updatedSubtotal = baseRate + 450;
      const updatedTax = Math.round(updatedSubtotal * 0.12);
      const updatedTotal = updatedSubtotal + updatedTax;
      await sql`
        UPDATE viswa.invoices SET subtotal = ${updatedSubtotal}, tax_total = ${updatedTax}, grand_total = ${updatedTotal}
        WHERE id = ${invoiceId}
      `;
      countDraftInvoices++;
    }
    console.log(`✅ [G7/G9 Folio & Draft Invoices] Created ${countDraftInvoices} live checked-in bookings with pre-populated Draft Invoices ready for Folio add-on and Checkout.`);

    // ==========================================
    // 3. MAINTENANCE ROOM RECOVERY (G6)
    // ==========================================
    const maintUnit = hotelUnits[hotelUnits.length - 1]; // last unit e.g. Room 105
    if (maintUnit) {
      await sql`UPDATE viswa.units SET status = 'maintenance' WHERE id = ${maintUnit.id}`;
      await sql`
        INSERT INTO viswa.maintenance_tickets (
          property_id, unit_id, ticket_number, ticket_type, title, description, category,
          priority, status, reported_by, assigned_to, created_at
        )
        VALUES (
          ${hotelId}, ${maintUnit.id}, ${'TICK-REC-' + Math.floor(1000 + Math.random() * 9000)}, 'corrective',
          ${'Room ' + maintUnit.unit_label + ' - AC Cooling Fault & Thermostat Calibration'},
          'Guest reported intermittent cooling. Technician needs to replace thermostat sensor and top up coolant.',
          'HVAC', 'high', 'in_progress', 'cfbdf60b-377c-47c9-87cc-8c5b409736c7', '1adec32e-164e-4b72-9e24-7579dd388366', now()
        )
      `;
      console.log(`✅ [G6 Maintenance Recovery] Marked Room ${maintUnit.unit_label} as 'Under Maintenance' with an active ticket ready for one-click Resolve recovery.`);
    }

    // ==========================================
    // 4. HR SHIFTS & LIVE STAFF AVAILABILITY (G11, G12, G13)
    // ==========================================
    // 1. Ensure at least 3 master shifts exist
    await sql`
      INSERT INTO viswa.shift_rotations (id, property_id, name, start_time, end_time, created_at)
      VALUES 
        (gen_random_uuid(), ${hotelId}, 'Morning Shift (Active)', '06:00:00', '18:00:00', now()),
        (gen_random_uuid(), ${hotelId}, 'Evening Shift', '14:00:00', '22:00:00', now()),
        (gen_random_uuid(), ${hotelId}, 'Night Shift', '22:00:00', '06:00:00', now())
      ON CONFLICT DO NOTHING
    `;

    const shifts = await sql`SELECT id, name FROM viswa.shift_rotations WHERE property_id = ${hotelId} OR property_id IS NULL LIMIT 3`;
    const morningShiftId = shifts[0]?.id;

    // 2. Get active employees
    const employees = await sql`SELECT id, employee_code, designation FROM viswa.employees LIMIT 8`;
    if (employees.length > 0 && morningShiftId) {
      // Assign shifts to employees (G12 requirement)
      for (const emp of employees) {
        await sql`UPDATE viswa.employees SET shift_id = ${morningShiftId}, is_active = true WHERE id = ${emp.id}`;
      }

      // 3. Mark first 3 employees as 'Clocked In' today (G13 - teal badge)
      for (let i = 0; i < Math.min(3, employees.length); i++) {
        const empId = employees[i].id;
        await sql`
          INSERT INTO viswa.timesheets (employee_id, date, clock_in, status, created_at)
          VALUES (${empId}, ${today}, ${today + 'T08:00:00Z'}, 'present', now())
          ON CONFLICT DO NOTHING
        `;
      }

      // 4. Mark 4th employee as 'On Leave Today' (G13 - red badge)
      if (employees[3]) {
        await sql`
          INSERT INTO viswa.leave_types (id, name, code, days_per_year, is_active, created_at)
          VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Annual Leave', 'AL', 15, true, now())
          ON CONFLICT DO NOTHING
        `;
        const ltRes = await sql`SELECT id FROM viswa.leave_types LIMIT 1`;
        const leaveTypeId = ltRes[0]?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

        await sql`
          INSERT INTO viswa.leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approved_at, created_at)
          VALUES (${employees[3].id}, ${leaveTypeId}, ${today}, ${today}, 1, 'Annual Family Function', 'approved', now(), now())
          ON CONFLICT DO NOTHING
        `;
      }
      console.log(`✅ [G12/G13 HR & Shifts] Assigned staff duty schedules and seeded live availability statuses (Clocked In, On Shift, On Leave).`);
    }

    console.log("\n🎉 ALL SEEDING COMPLETE! Your local environment is 100% ready for verification.");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
