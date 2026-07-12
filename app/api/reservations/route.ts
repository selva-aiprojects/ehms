export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const propertyId = searchParams.get("property_id");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;
    const date = searchParams.get("date");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
    const offset = (page - 1) * limit;

    const rows = await sql`
      SELECT
        b.*,
        json_build_object('id', g.id, 'first_name', g.first_name, 'last_name', g.last_name, 'email', g.email, 'phone', g.phone) AS guest,
        json_build_object('id', u.id, 'unit_label', u.unit_label, 'unit_type', u.unit_type, 'status', u.status) AS unit,
        json_build_object('id', p.id, 'name', p.name, 'vertical_type', p.vertical_type) AS property,
        COUNT(*) OVER()::int AS total_count
      FROM bookings b
      LEFT JOIN guest_profiles g ON g.id = b.guest_id
      LEFT JOIN units u ON u.id = b.unit_id
      LEFT JOIN properties p ON p.id = b.property_id
      WHERE 1=1
        ${status ? sql`AND b.status = ${status}` : sql``}
        ${propertyId ? sql`AND b.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND b.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
        ${date ? sql`AND b.check_in::date = ${date}::date` : sql``}
      ORDER BY b.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const results = rows as any[];
    const count = results.length > 0 ? (results[0] as Record<string, unknown>).total_count as number : 0;
    const data = results.map(r => { const { total_count, ...rest } = r as Record<string, unknown>; return rest; });

    return NextResponse.json({ data, count, page, limit });
  } catch (error) {
    console.error("[reservations GET]", error);
    return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    // 1. Create the booking
    const rows = await sql`
      INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, special_requests)
      VALUES (
        ${body.property_id}, ${body.unit_id}, ${body.guest_id},
        ${body.booking_model || "nightly"}, 'confirmed', ${body.source || "direct"},
        ${body.check_in}, ${body.check_out},
        ${body.adults || 1}, ${body.children || 0},
        ${body.total_amount}, ${body.special_requests || null}
      )
      RETURNING *
    `;

    const booking = rows[0] as Record<string, unknown>;

    // 2. Mark unit as reserved (Scoped to vertical: block children if apartment, block parent if room)
    if (body.unit_id) {
      try {
        const unitDetails = await sql`
          SELECT p.vertical_type, u.unit_type, u.parent_unit_id
          FROM units u
          JOIN floors f ON f.id = u.floor_id
          JOIN buildings b ON b.id = f.building_id
          JOIN properties p ON p.id = b.property_id
          WHERE u.id = ${body.unit_id}
          LIMIT 1
        ` as any[];

        if (unitDetails.length > 0) {
          const detail = unitDetails[0];
          const isApartmentVertical = detail.vertical_type === "service_apartment" || detail.vertical_type === "rental_apartment";

          if (isApartmentVertical) {
            if (detail.unit_type === "apartment") {
              // Block the apartment and all its child rooms
              await sql`UPDATE units SET status = 'reserved' WHERE id = ${body.unit_id} OR parent_unit_id = ${body.unit_id}`;
            } else if (detail.parent_unit_id) {
              // Block the individual room and its parent apartment
              await sql`UPDATE units SET status = 'reserved' WHERE id = ${body.unit_id} OR id = ${detail.parent_unit_id}`;
            } else {
              await sql`UPDATE units SET status = 'reserved' WHERE id = ${body.unit_id}`;
            }
          } else {
            // Standard vertical (e.g. Hotel)
            await sql`UPDATE units SET status = 'reserved' WHERE id = ${body.unit_id}`;
          }
        } else {
          await sql`UPDATE units SET status = 'reserved' WHERE id = ${body.unit_id}`;
        }
      } catch (err) {
        console.error("Failed to update hierarchy reservation status:", err);
        await sql`UPDATE units SET status = 'reserved' WHERE id = ${body.unit_id}`;
      }
    }

    // ── G7 FIX: Auto-create a draft Invoice for this booking ──────────────
    try {
      const totalAmount = Number(body.total_amount || 0);
      const checkIn = body.check_in ? new Date(body.check_in) : new Date();
      const checkOut = body.check_out ? new Date(body.check_out) : new Date();
      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

      const invRows = await sql`
        INSERT INTO invoices (booking_id, property_id, guest_id, invoice_number, invoice_date, due_date, status, subtotal, tax_total, grand_total, paid_total)
        VALUES (
          ${booking.id as string},
          ${body.property_id},
          ${body.guest_id || null},
          ${invoiceNumber},
          CURRENT_DATE,
          ${checkOut.toISOString().split("T")[0]},
          'draft',
          ${totalAmount},
          0,
          ${totalAmount},
          0
        )
        RETURNING id
      `;

      const invoiceId = (invRows[0] as Record<string, unknown>).id as string;

      await sql`
        INSERT INTO invoice_lines (invoice_id, description, quantity, unit_price, tax_rate)
        VALUES (
          ${invoiceId},
          ${"Room charges — " + nights + " night(s)"},
          ${nights},
          ${totalAmount / nights},
          0
        )
      `;
    } catch (invErr) {
      console.error("[reservations POST] invoice auto-create failed:", invErr);
    }
    // ─────────────────────────────────────────────────────────────────────

    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create reservation";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
