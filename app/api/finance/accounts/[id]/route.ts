export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const rows = await sql`SELECT * FROM chart_of_accounts WHERE id = ${id}`;
    if (!(rows as any[]).length) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    return NextResponse.json({ data: (rows as any[])[0] });
  } catch (error) {
    console.error("[finance/accounts GET:id]", error);
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();
    const rows = await sql`
      UPDATE chart_of_accounts SET
        account_code = COALESCE(${body.account_code}, account_code),
        account_name = COALESCE(${body.account_name}, account_name),
        account_type = COALESCE(${body.account_type}, account_type),
        sub_type = ${body.sub_type ?? null},
        is_active = COALESCE(${body.is_active}, is_active),
        parent_id = ${body.parent_id ?? null},
        description = ${body.description ?? null},
        opening_balance = COALESCE(${body.opening_balance}, opening_balance)
      WHERE id = ${id} RETURNING *`;
    if (!(rows as any[]).length) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    return NextResponse.json({ data: (rows as any[])[0] });
  } catch (error) {
    console.error("[finance/accounts PUT]", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
