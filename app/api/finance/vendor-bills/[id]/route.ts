export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const rows = await sql`
      SELECT vb.*, v.name as vendor_name, v.code as vendor_code
      FROM vendor_bills vb
      LEFT JOIN vendors v ON v.id = vb.vendor_id
      WHERE vb.id = ${id}`;
    if (!(rows as any[]).length) return NextResponse.json({ error: "Vendor bill not found" }, { status: 404 });

    const lines = await sql`SELECT * FROM bill_line_items WHERE bill_id = ${id} ORDER BY id`;
    const payments = await sql`SELECT * FROM bill_payments WHERE bill_id = ${id} ORDER BY payment_date DESC`;

    return NextResponse.json({ data: { ...rows[0], lines, payments } });
  } catch (error) {
    console.error("[finance/vendor-bills GET:id]", error);
    return NextResponse.json({ error: "Failed to fetch vendor bill" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();

    if (body._action === "approve") {
      const rows = await sql`UPDATE vendor_bills SET status = 'approved', updated_at = now() WHERE id = ${id} RETURNING *`;
      return NextResponse.json({ data: rows[0] });
    }
    if (body._action === "cancel") {
      const rows = await sql`UPDATE vendor_bills SET status = 'cancelled', updated_at = now() WHERE id = ${id} RETURNING *`;
      return NextResponse.json({ data: rows[0] });
    }

    const rows = await sql`
      UPDATE vendor_bills SET
        bill_number = COALESCE(${body.bill_number}, bill_number),
        bill_date = COALESCE(${body.bill_date}::date, bill_date),
        due_date = COALESCE(${body.due_date}::date, due_date),
        category = COALESCE(${body.category}, category),
        subtotal = COALESCE(${body.subtotal}, subtotal),
        tax_total = COALESCE(${body.tax_total}, tax_total),
        grand_total = COALESCE(${body.grand_total}, grand_total),
        notes = COALESCE(${body.notes}, notes),
        updated_at = now()
      WHERE id = ${id} RETURNING *`;
    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error("[finance/vendor-bills PUT]", error);
    return NextResponse.json({ error: "Failed to update vendor bill" }, { status: 500 });
  }
}
