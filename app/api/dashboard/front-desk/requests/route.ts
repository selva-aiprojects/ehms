import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;
    const rows = await sql`
      SELECT 
        gr.id, gr.request_type, gr.description, gr.status, gr.assigned_to_dept, gr.created_at,
        b.id as booking_id, u.unit_label
      FROM guest_requests gr
      JOIN bookings b ON b.id = gr.booking_id
      LEFT JOIN units u ON u.id = b.unit_id
      WHERE 1=1
      ${scope.assignedPropertyIds.length > 0 ? sql`AND gr.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY gr.created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[requests GET]", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { propertyId, bookingId, requestType, description, assignedToDept } = body;

    if (!propertyId || !bookingId || !requestType || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const accessErr = validateMutationPropertyAccess(req, propertyId);
    if (accessErr) return accessErr;

    const sql = getDb();
    
    // Create the guest request
    const result = await sql`
      INSERT INTO guest_requests (property_id, booking_id, request_type, description, assigned_to_dept, status)
      VALUES (${propertyId}, ${bookingId}, ${requestType}, ${description}, ${assignedToDept || null}, 'pending')
      RETURNING *
    `;
    const newRequest = (result as any[])[0];

    // Automatically route to housekeeping or maintenance if applicable
    if (assignedToDept === 'housekeeping') {
      const rows = await sql`SELECT unit_id FROM bookings WHERE id = ${bookingId}`;
      const unit_id = (rows as any[])[0]?.unit_id;
      if (unit_id) {
        await sql`
          INSERT INTO housekeeping_tasks (property_id, unit_id, task_type, priority, description)
          VALUES (${propertyId}, ${unit_id}, 'cleaning', 'high', ${'Guest Request: ' + description})
        `;
      }
    } else if (assignedToDept === 'maintenance') {
      const rows = await sql`SELECT unit_id FROM bookings WHERE id = ${bookingId}`;
      const unit_id = (rows as any[])[0]?.unit_id;
      if (unit_id) {
        await sql`
          INSERT INTO maintenance_tickets (property_id, unit_id, ticket_number, ticket_type, title, priority, description, status)
          VALUES (
            ${propertyId}, ${unit_id},
            'MT-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MI'),
            'corrective', ${'Guest Request: ' + description},
            'high', ${description}, 'open'
          )
        `;
      }
    }

    return NextResponse.json({ data: newRequest });
  } catch (error: any) {
    console.error("[requests POST]", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
