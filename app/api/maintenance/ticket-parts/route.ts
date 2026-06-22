import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticket_id");

    const rows = await sql`
      SELECT
        mtp.*,
        json_build_object('id', mt.id, 'title', mt.title) AS ticket,
        json_build_object('id', pi.id, 'part_name', pi.part_name) AS part
      FROM maintenance_ticket_parts mtp
      LEFT JOIN maintenance_tickets mt ON mt.id = mtp.ticket_id
      LEFT JOIN parts_inventory pi ON pi.id = mtp.part_id
      WHERE 1=1
      ${ticketId ? sql`AND mtp.ticket_id = ${ticketId}` : sql``}
      ORDER BY mtp.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[ticket-parts GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch ticket parts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO maintenance_ticket_parts (ticket_id, part_id, part_name, quantity, unit_price)
      VALUES (
        ${body.ticket_id},
        ${body.part_id || null},
        ${body.part_name || null},
        ${body.quantity},
        ${body.unit_price || 0}
      )
      RETURNING *
    `;

    if (body.part_id) {
      await sql`
        UPDATE parts_inventory
        SET quantity_in_stock = quantity_in_stock - ${body.quantity}
        WHERE id = ${body.part_id}
      `;
    }

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[ticket-parts POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create ticket part" }, { status: 500 });
  }
}
