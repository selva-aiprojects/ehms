export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const entries = await sql`
      SELECT je.*, u.name as created_by_name
      FROM journal_entries je
      LEFT JOIN users u ON u.id = je.created_by
      WHERE je.id = ${id}`;
    if (!(entries as any[]).length) return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });

    const lines = await sql`
      SELECT jl.*, ca.account_code, ca.account_name
      FROM journal_lines jl
      LEFT JOIN chart_of_accounts ca ON ca.id = jl.account_id
      WHERE jl.journal_id = ${id} ORDER BY jl.id`;
    return NextResponse.json({ data: { ...entries[0], lines } });
  } catch (error) {
    console.error("[finance/journal-entries GET:id]", error);
    return NextResponse.json({ error: "Failed to fetch journal entry" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();

    if (body._action === "post") {
      const rows = await sql`UPDATE journal_entries SET is_posted = true, posted_at = now() WHERE id = ${id} RETURNING *`;
      return NextResponse.json({ data: rows[0] });
    }

    const rows = await sql`
      UPDATE journal_entries SET
        entry_date = COALESCE(${body.entry_date}::date, entry_date),
        description = COALESCE(${body.description}, description),
        journal_type = COALESCE(${body.journal_type}, journal_type),
        is_adjusting = COALESCE(${body.is_adjusting}, is_adjusting),
        updated_at = now()
      WHERE id = ${id} RETURNING *`;
    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error("[finance/journal-entries PUT]", error);
    return NextResponse.json({ error: "Failed to update journal entry" }, { status: 500 });
  }
}
