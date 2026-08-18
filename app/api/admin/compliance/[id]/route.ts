import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();
    const body = await req.json();

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const fields = ["certificate_type", "reference_number", "issued_date", "expiry_date", "status", "document_url", "property_id"];
    for (const f of fields) {
      if (body[f] !== undefined) {
        updates.push(`${f} = $${idx++}`);
        values.push(body[f]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    const result = await (sql as any)(
      `UPDATE compliance_records SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "Compliance record not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result[0] });
  } catch (error: any) {
    console.error("[admin/compliance PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed to update compliance record" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();

    const result = await sql`DELETE FROM compliance_records WHERE id = ${id} RETURNING id` as any[];
    if (result.length === 0) {
      return NextResponse.json({ error: "Compliance record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[admin/compliance DELETE]", error);
    return NextResponse.json({ error: error?.message || "Failed to delete compliance record" }, { status: 500 });
  }
}
