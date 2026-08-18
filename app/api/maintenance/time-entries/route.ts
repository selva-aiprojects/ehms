import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticket_id");
    const technicianId = searchParams.get("technician_id");

    const rows = await sql`
      SELECT
        mte.*,
        json_build_object('id', mt.id, 'title', mt.title) AS ticket,
        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name) AS technician
      FROM maintenance_time_entries mte
      LEFT JOIN maintenance_tickets mt ON mt.id = mte.ticket_id
      LEFT JOIN users u ON u.id = mte.technician_id
      WHERE 1=1
      ${ticketId ? sql`AND mte.ticket_id = ${ticketId}` : sql``}
      ${technicianId ? sql`AND mte.technician_id = ${technicianId}` : sql``}
      ORDER BY mte.start_time DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[time-entries GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch time entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO maintenance_time_entries (ticket_id, technician_id, start_time, end_time, notes)
      VALUES (
        ${body.ticket_id},
        ${body.technician_id},
        ${body.start_time},
        ${body.end_time || null},
        ${body.notes || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[time-entries POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create time entry" }, { status: 500 });
  }
}
