export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();

    if (body._action === "file") {
      const rows = await sql`
        UPDATE tax_filings SET status = 'filed', filing_date = now(), filed_by = ${body.filed_by}, updated_at = now()
        WHERE id = ${id} RETURNING *`;
      return NextResponse.json({ data: rows[0] });
    }
    if (body._action === "pay") {
      const rows = await sql`
        UPDATE tax_filings SET total_paid = total_paid + ${body.amount}, status = CASE WHEN total_paid + ${body.amount} >= total_liability THEN 'paid' ELSE 'filed' END, updated_at = now()
        WHERE id = ${id} RETURNING *`;
      return NextResponse.json({ data: rows[0] });
    }

    const rows = await sql`
      UPDATE tax_filings SET total_liability = COALESCE(${body.total_liability}, total_liability), remarks = COALESCE(${body.remarks}, remarks), updated_at = now()
      WHERE id = ${id} RETURNING *`;
    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error("[finance/tax-filings PUT]", error);
    return NextResponse.json({ error: "Failed to update tax filing" }, { status: 500 });
  }
}
