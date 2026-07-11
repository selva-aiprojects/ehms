import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateIndirectPropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticket_id");

    const rows = await sql`
      SELECT
        ma.*,
        json_build_object('id', mt.id, 'title', mt.title) AS ticket,
        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name) AS user
      FROM maintenance_approvals ma
      LEFT JOIN maintenance_tickets mt ON mt.id = ma.ticket_id
      LEFT JOIN users u ON u.id = ma.performed_by
      WHERE 1=1
      ${ticketId ? sql`AND ma.ticket_id = ${ticketId}` : sql``}
      ${!ticketId && scope.assignedPropertyIds.length > 0 ? sql`AND mt.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY ma.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[approvals GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch approvals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    // Validate property access indirectly via ticket → property_id
    const accessErr = await validateIndirectPropertyAccess(req, sql, "maintenance_tickets", body.ticket_id);
    if (accessErr) return accessErr;

    const rows = await sql`
      INSERT INTO maintenance_approvals (ticket_id, action, performed_by, comment)
      VALUES (
        ${body.ticket_id},
        ${body.action},
        ${body.performed_by || null},
        ${body.comment || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[approvals POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create approval" }, { status: 500 });
  }
}
