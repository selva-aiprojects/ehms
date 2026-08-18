import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();
    const body = await req.json();

    const { status, matched_payment_id } = body;

    const result = await sql`
      UPDATE bank_reconciliation
      SET status = COALESCE(${status}, status),
          matched_payment_id = ${matched_payment_id || null},
          reconciled_at = CASE WHEN ${status} = 'matched' THEN NOW() ELSE reconciled_at END
      WHERE id = ${id}
      RETURNING *
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json({ error: "Reconciliation record not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result[0] });
  } catch (error: any) {
    console.error("[reconciliation PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed to update reconciliation" }, { status: 500 });
  }
}
