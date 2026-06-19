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

    // Build update using conditional SQL fragments (no .unsafe() needed)
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

    // Sync unit status
    const booking = rows[0] as Record<string, unknown>;
    const unitId = booking.unit_id as string | null;
    if (unitId && newStatus) {
      const unitStatus =
        newStatus === "checked_in" ? "occupied" :
        newStatus === "checked_out" ? "dirty" :
        newStatus === "cancelled" ? "vacant" : null;
      if (unitStatus) {
        await sql`UPDATE units SET status = ${unitStatus} WHERE id = ${unitId}`;
      }
    }

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
