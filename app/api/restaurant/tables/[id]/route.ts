import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validateMutationPropertyAccess } from "@/lib/property-scope";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const { status, pos_x, pos_y, section_id, capacity, shape, booking_id, guest_count } = body;
    const sql = getDb();

    const existing = (await sql`SELECT property_id FROM restaurant_tables WHERE id = ${id}`) as any[];
    if (existing.length === 0) return NextResponse.json({ error: "Table not found" }, { status: 404 });
    const accessErr = validateMutationPropertyAccess(req, existing[0].property_id);
    if (accessErr) return accessErr;

    let newOccupiedAt: string | null = null;
    let clearBooking = false;
    if (status === "occupied") {
      newOccupiedAt = new Date().toISOString();
    } else if (status === "available") {
      clearBooking = true;
    }

    const rows = await sql`
      UPDATE restaurant_tables SET
        status = COALESCE(${status || null}, status),
        pos_x = COALESCE(${pos_x ?? null}, pos_x),
        pos_y = COALESCE(${pos_y ?? null}, pos_y),
        section_id = COALESCE(${section_id || null}, section_id),
        capacity = COALESCE(${capacity ?? null}, capacity),
        shape = COALESCE(${shape || null}, shape),
        guest_count = COALESCE(${guest_count ?? null}, guest_count),
        occupied_at = CASE WHEN ${clearBooking} THEN NULL WHEN ${status || ""} = 'occupied' THEN ${newOccupiedAt}::timestamptz ELSE occupied_at END,
        booking_id = CASE WHEN ${clearBooking} THEN NULL ELSE COALESCE(${booking_id || null}, booking_id) END,
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return NextResponse.json({ data: (rows as any[])[0] });
  } catch (error: any) {
    console.error("[restaurant tables PATCH]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
