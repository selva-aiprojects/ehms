import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const rows = await sql`
      SELECT b.*,
        row_to_json(g.*) AS guest,
        row_to_json(u.*) AS unit,
        row_to_json(p.*) AS property
      FROM bookings b
      LEFT JOIN guest_profiles g ON g.id = b.guest_id
      LEFT JOIN units u ON u.id = b.unit_id
      LEFT JOIN properties p ON p.id = b.property_id
      WHERE b.id = ${id}
      LIMIT 1
    `;
    if (!rows[0]) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();

    const newStatus: string | null = body.status || null;
    const checkedInAt = newStatus === "checked_in" ? new Date().toISOString() : null;
    const checkedOutAt = newStatus === "checked_out" ? new Date().toISOString() : null;
    const specialReqs = body.special_requests !== undefined ? body.special_requests : null;
    const paidAmount = body.paid_amount !== undefined ? body.paid_amount : null;

    const rows = await sql`
      UPDATE bookings SET
        status           = COALESCE(${newStatus}, status),
        checked_in_at    = CASE WHEN ${newStatus} = 'checked_in'  THEN ${checkedInAt}  ELSE checked_in_at  END,
        checked_out_at   = CASE WHEN ${newStatus} = 'checked_out' THEN ${checkedOutAt} ELSE checked_out_at END,
        special_requests = CASE WHEN ${specialReqs}::text IS NOT NULL THEN ${specialReqs} ELSE special_requests END,
        paid_amount      = CASE WHEN ${paidAmount}::numeric IS NOT NULL THEN ${paidAmount} ELSE paid_amount END
      WHERE id = ${id}
      RETURNING *
    `;

    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const booking = rows[0] as Record<string, unknown>;
    const unitId = booking.unit_id as string | null;
    const propertyId = booking.property_id as string | null;

    // Sync unit status
    if (unitId && newStatus) {
      const unitStatus =
        newStatus === "checked_in" ? "occupied" :
        newStatus === "checked_out" ? "dirty" :
        newStatus === "cancelled" ? "vacant" : null;
      if (unitStatus) {
        await sql`UPDATE units SET status = ${unitStatus} WHERE id = ${unitId}`;
      }
    }

    // ── G4 + G5 FIX: On CHECK-OUT — auto-create HK task + finalize Invoice ──
    if (newStatus === "checked_out" && unitId) {

      // G4: Auto-create Housekeeping Task for the vacated room
      try {
        await sql`
          INSERT INTO housekeeping_tasks (unit_id, property_id, task_type, priority, status, scheduled_at, notes)
          VALUES (
            ${unitId},
            ${propertyId},
            'checkout_clean',
            'high',
            'open',
            NOW(),
            ${"Auto-generated on checkout for booking #" + id}
          )
        `;
      } catch (hkErr) {
        console.error("[reservations PUT] housekeeping auto-task failed:", hkErr);
      }

      // G5: Finalize / ensure Invoice exists and mark it 'sent'
      try {
        // Check if invoice already exists for this booking
        const existingInv = await sql`SELECT id, grand_total FROM invoices WHERE booking_id = ${id} LIMIT 1`;

        if (existingInv[0]) {
          // Invoice exists (created at booking) — mark it as 'sent' (ready for payment)
          const inv = existingInv[0] as Record<string, unknown>;
          await sql`
            UPDATE invoices SET
              status = 'sent',
              amount_paid = COALESCE(${paidAmount}::numeric, amount_paid),
              balance_due = ${paidAmount
                ? Math.max(0, Number(inv.grand_total) - Number(paidAmount))
                : null}::numeric
            WHERE id = ${inv.id as string}
          `;
        } else {
          // No invoice found — create one now from booking total
          const totalAmount = Number(booking.total_amount || 0);
          const checkIn = booking.check_in ? new Date(booking.check_in as string) : new Date();
          const checkOut = new Date();
          const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));
          const invoiceNumber = `INV-CO-${Date.now().toString(36).toUpperCase()}`;

          const invRows = await sql`
            INSERT INTO invoices (booking_id, property_id, guest_id, invoice_number, status, subtotal, tax_total, grand_total, balance_due, due_date)
            VALUES (
              ${id},
              ${propertyId},
              ${booking.guest_id as string},
              ${invoiceNumber},
              'sent',
              ${totalAmount},
              0,
              ${totalAmount},
              ${totalAmount},
              NOW()
            )
            RETURNING id
          `;

          const invoiceId = (invRows[0] as Record<string, unknown>).id as string;

          await sql`
            INSERT INTO invoice_lines (invoice_id, description, quantity, unit_price, amount, line_type)
            VALUES (
              ${invoiceId},
              ${"Room charges — " + nights + " night(s) (checkout)"},
              ${nights},
              ${totalAmount / nights},
              ${totalAmount},
              'room_charge'
            )
          `;
        }
      } catch (invErr) {
        console.error("[reservations PUT] invoice finalize failed:", invErr);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json({ data: booking });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const rows = await sql`SELECT unit_id FROM bookings WHERE id = ${id}`;
    await sql`UPDATE bookings SET status = 'cancelled' WHERE id = ${id}`;
    const unitId = rows[0] ? (rows[0] as Record<string, unknown>).unit_id as string : null;
    if (unitId) await sql`UPDATE units SET status = 'vacant' WHERE id = ${unitId}`;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
