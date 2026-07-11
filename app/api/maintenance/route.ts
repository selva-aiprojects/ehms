export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const rows = await sql`
      SELECT
        mt.*,
        json_build_object('id', u.id, 'unit_label', u.unit_label) AS unit,
        json_build_object('id', rep.id, 'first_name', rep.first_name, 'last_name', rep.last_name) AS reporter,
        CASE WHEN mt.assigned_to IS NOT NULL
          THEN json_build_object('id', asgn.id, 'first_name', asgn.first_name, 'last_name', asgn.last_name)
          ELSE NULL
        END AS assignee
      FROM maintenance_tickets mt
      LEFT JOIN units u ON u.id = mt.unit_id
      LEFT JOIN users rep ON rep.id = mt.reported_by
      LEFT JOIN users asgn ON asgn.id = mt.assigned_to
      WHERE 1=1
        ${propertyId ? sql`AND mt.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND mt.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
        ${status ? sql`AND mt.status = ${status}` : sql``}
        ${priority ? sql`AND mt.priority = ${priority}` : sql``}
      ORDER BY mt.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[maintenance GET]", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const ticketNum = body.ticket_number || `MT-${Date.now().toString(36).toUpperCase()}`;
    const rows = await sql`
      INSERT INTO maintenance_tickets (property_id, unit_id, title, description, priority, category, reported_by, status, ticket_type, ticket_number)
      VALUES (
        ${body.property_id}, ${body.unit_id || null},
        ${body.title}, ${body.description || null},
        ${body.priority || "medium"}, ${body.category || null},
        ${body.reported_by || null}, 'open', 'corrective',
        ${ticketNum}
      )
      RETURNING *
    `;

    if (body.unit_id) {
      await sql`UPDATE units SET status = 'maintenance' WHERE id = ${body.unit_id}`;
    }

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create ticket";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
