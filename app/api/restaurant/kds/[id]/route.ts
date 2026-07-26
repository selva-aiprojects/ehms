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
    const { status, priority, notes } = body;
    const sql = getDb();

    const existing = (await sql`SELECT property_id, order_id FROM kds_tickets WHERE id = ${id}`) as any[];
    if (existing.length === 0) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    const accessErr = validateMutationPropertyAccess(req, existing[0].property_id);
    if (accessErr) return accessErr;

    let updateFields: Record<string, any> = {};
    if (priority) updateFields.priority = priority;
    if (notes !== undefined) updateFields.notes = notes;

    if (status === "in_progress") {
      updateFields.status = "in_progress";
      updateFields.acknowledged_at = new Date().toISOString();
    } else if (status === "ready") {
      updateFields.status = "ready";
      updateFields.ready_at = new Date().toISOString();
    } else if (status === "served") {
      updateFields.status = "served";
      updateFields.served_at = new Date().toISOString();
    } else if (status) {
      updateFields.status = status;
    }

    const rows = await sql`
      UPDATE kds_tickets SET
        status = COALESCE(${updateFields.status || null}, status),
        priority = COALESCE(${updateFields.priority || null}, priority),
        notes = ${updateFields.notes !== undefined ? updateFields.notes : null},
        acknowledged_at = COALESCE(${updateFields.acknowledged_at || null}, acknowledged_at),
        ready_at = COALESCE(${updateFields.ready_at || null}, ready_at),
        served_at = COALESCE(${updateFields.served_at || null}, served_at),
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;

    if (updateFields.status === "served") {
      await sql`UPDATE f_and_b_orders SET status = 'delivered' WHERE id = ${existing[0].order_id}`;
    }

    return NextResponse.json({ data: (rows as any[])[0] });
  } catch (error: any) {
    console.error("[kds PATCH]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
