export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const fromDate = searchParams.get("from_date");
    const toDate = searchParams.get("to_date");
    const status = searchParams.get("status");
    const type = searchParams.get("journal_type");

    let query = sql`
      SELECT je.*, u.name as created_by_name
      FROM journal_entries je
      LEFT JOIN users u ON u.id = je.created_by
      WHERE 1=1`;
    if (propertyId) query = sql`${query} AND je.property_id = ${propertyId}`;
    if (fromDate) query = sql`${query} AND je.entry_date >= ${fromDate}::date`;
    if (toDate) query = sql`${query} AND je.entry_date <= ${toDate}::date`;
    if (type) query = sql`${query} AND je.journal_type = ${type}`;
    query = sql`${query} ORDER BY je.entry_date DESC, je.posted_at DESC LIMIT 100`;

    const rows = await query;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[finance/journal-entries GET]", error);
    return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { lines, ...entry } = body;

    const entries = await sql`
      INSERT INTO journal_entries (property_id, entry_date, reference_type, reference_id, description, created_by, journal_type, is_adjusting, is_posted)
      VALUES (${entry.property_id}, ${entry.entry_date}, ${entry.reference_type || null}, ${entry.reference_id || null}, ${entry.description || null}, ${entry.created_by}, ${entry.journal_type || 'general'}, ${entry.is_adjusting || false}, ${entry.is_posted ?? true})
      RETURNING *`;

    const journalId = entries[0].id;

    if (lines && lines.length > 0) {
      for (const line of lines) {
        await sql`
          INSERT INTO journal_lines (journal_id, account_id, debit, credit, description)
          VALUES (${journalId}, ${line.account_id}, ${line.debit || 0}, ${line.credit || 0}, ${line.description || null})`;
      }

      const lineRows = await sql`SELECT * FROM journal_lines WHERE journal_id = ${journalId}`;
      return NextResponse.json({ data: { ...entries[0], lines: lineRows } }, { status: 201 });
    }

    return NextResponse.json({ data: entries[0] }, { status: 201 });
  } catch (error) {
    console.error("[finance/journal-entries POST]", error);
    return NextResponse.json({ error: "Failed to create journal entry" }, { status: 500 });
  }
}
