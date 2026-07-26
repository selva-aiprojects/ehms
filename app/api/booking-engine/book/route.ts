export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// POST — create a booking via the public booking engine
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { property_code, unit_type, check_in, check_out, guest_name, guest_email, guest_phone, adults, children, promo_code, special_requests } = body;

    if (!property_code || !check_in || !check_out || !guest_name || !guest_email) {
      return NextResponse.json({ error: "property_code, check_in, check_out, guest_name, and guest_email are required" }, { status: 400 });
    }

    const { getPublicDb } = await import("@/lib/db");
    const publicSql = getPublicDb();
    const tenants = await publicSql`SELECT schema_name FROM tenants WHERE code = ${property_code.toUpperCase()} AND is_active = true LIMIT 1` as any[];
    if (tenants.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const { getDb: getTenantDb } = await import("@/lib/db");
    const tenantSql = getTenantDb(tenants[0].schema_name);

    // Find property
    const properties = await tenantSql`SELECT id FROM properties WHERE code = ${property_code.toUpperCase()} AND is_active = true LIMIT 1` as any[];
    if (properties.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    const propertyId = properties[0].id;

    // Find an available unit of the requested type
    const units = await tenantSql`
      SELECT u.id, u.base_rate
      FROM units u
      JOIN floors f ON f.id = u.floor_id
      JOIN buildings b ON b.id = f.building_id
      WHERE b.property_id = ${propertyId}
        AND u.unit_type = ${unit_type || 'room'}
        AND u.is_active = true
        AND u.status NOT IN ('maintenance', 'reserved')
        AND u.id NOT IN (
          SELECT b2.unit_id FROM bookings b2
          WHERE b2.unit_id = u.id
            AND b2.status IN ('confirmed', 'checked_in', 'pending')
            AND b2.check_in < ${check_out}::date + interval '1 day'
            AND b2.check_out > ${check_in}::date
        )
      ORDER BY u.base_rate ASC
      LIMIT 1
    ` as any[];

    if (units.length === 0) {
      return NextResponse.json({ error: "No rooms available for the selected dates" }, { status: 404 });
    }

    const unit = units[0];
    const nights = Math.max(1, Math.ceil((new Date(check_out).getTime() - new Date(check_in).getTime()) / 86400000));
    let totalAmount = Number(unit.base_rate) * nights;

    // Apply promo
    if (promo_code) {
      const promos = await tenantSql`
        SELECT * FROM promo_codes
        WHERE property_id = ${propertyId} AND code = ${promo_code.toUpperCase()}
          AND is_active = true AND CURRENT_DATE BETWEEN valid_from AND valid_to
        LIMIT 1
      ` as any[];
      if (promos.length > 0) {
        const p = promos[0];
        if (p.discount_type === "percentage") totalAmount -= totalAmount * (Number(p.discount_value) / 100);
        else totalAmount -= Number(p.discount_value);
        totalAmount = Math.max(0, totalAmount);
        await tenantSql`UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ${p.id}`;
      }
    }

    // Create or find guest
    const guests = await tenantSql`SELECT id FROM guest_profiles WHERE email = ${guest_email} LIMIT 1` as any[];
    let guestId: string;
    if (guests.length > 0) {
      guestId = guests[0].id;
      await tenantSql`UPDATE guest_profiles SET first_name = ${guest_name.split(" ")[0]}, last_name = ${guest_name.split(" ").slice(1).join(" ") || ""}, phone = COALESCE(${guest_phone || null}, phone) WHERE id = ${guestId}`;
    } else {
      const nameParts = guest_name.split(" ");
      const newGuest = await tenantSql`
        INSERT INTO guest_profiles (first_name, last_name, email, phone)
        VALUES (${nameParts[0]}, ${nameParts.slice(1).join(" ") || ""}, ${guest_email}, ${guest_phone || null})
        RETURNING id
      ` as any[];
      guestId = newGuest[0].id;
    }

    // Create booking
    const booking = await tenantSql`
      INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, special_requests)
      VALUES (${propertyId}, ${unit.id}, ${guestId}, 'nightly', 'confirmed', 'direct', ${check_in}, ${check_out}, ${adults || 1}, ${children || 0}, ${totalAmount}, ${special_requests || null})
      RETURNING *
    ` as any[];

    // Mark unit reserved
    await tenantSql`UPDATE units SET status = 'reserved' WHERE id = ${unit.id}`;

    // Create invoice
    try {
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      await tenantSql`
        INSERT INTO invoices (booking_id, property_id, guest_id, invoice_number, invoice_date, due_date, status, subtotal, tax_total, grand_total, paid_total)
        VALUES (${booking[0].id}, ${propertyId}, ${guestId}, ${invoiceNumber}, CURRENT_DATE, ${check_out}, 'draft', ${totalAmount}, 0, ${totalAmount}, 0)
      `;
    } catch (e) {
      console.error("[booking-engine] invoice create failed:", e);
    }

    // Add to guest timeline
    try {
      await tenantSql`
        INSERT INTO guest_timeline (guest_id, event_type, event_data)
        VALUES (${guestId}, 'direct_booking', ${JSON.stringify({ booking_id: booking[0].id, source: 'booking_engine', amount: totalAmount })}::jsonb)
      `;
    } catch (e) {
      // non-critical
    }

    return NextResponse.json({
      data: {
        booking_id: booking[0].id,
        status: "confirmed",
        room: unit.id,
        total_amount: totalAmount,
        nights,
        check_in,
        check_out,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[booking-engine/book POST]", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
