import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validateIndirectPropertyAccess } from "@/lib/property-scope";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { unit_id, status } = body;

    if (!unit_id || !status) {
      return NextResponse.json({ error: "unit_id and status are required" }, { status: 400 });
    }

    // Validate property access indirectly via unit → property_id
    const accessErr = await validateIndirectPropertyAccess(req, sql, "units", unit_id);
    if (accessErr) return accessErr;

    const validStatuses = ["vacant", "occupied", "dirty", "cleaning", "maintenance", "reserved", "inspection"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid room status" }, { status: 400 });
    }

    const rows = await sql`
      UPDATE units SET
        status = ${status}::room_status,
        updated_at = now()
      WHERE id = ${unit_id}
      RETURNING id, unit_label, status
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Room unit not found" }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0], message: `Room status updated to ${status}` });
  } catch (error: unknown) {
    console.error("[room-status PUT]", error);
    const msg = error instanceof Error ? error.message : "Failed to update room status";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
