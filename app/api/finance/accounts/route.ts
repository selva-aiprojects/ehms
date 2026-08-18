export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const type = searchParams.get("account_type");
    const active = searchParams.get("active");

    let query = sql`SELECT * FROM chart_of_accounts WHERE 1=1`;
    if (propertyId) query = sql`${query} AND property_id = ${propertyId}`;
    else if (scope.assignedPropertyIds.length > 0) query = sql`${query} AND property_id = ANY(${scope.assignedPropertyIds})`;
    if (type) query = sql`${query} AND account_type = ${type}`;
    if (active !== "false") query = sql`${query} AND is_active = true`;
    query = sql`${query} ORDER BY account_code`;

    const rows = await query;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[finance/accounts GET]", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const rows = await sql`
      INSERT INTO chart_of_accounts (property_id, account_code, account_name, account_type, sub_type, parent_id, description, is_system, opening_balance)
      VALUES (${body.property_id}, ${body.account_code}, ${body.account_name}, ${body.account_type}, ${body.sub_type || null}, ${body.parent_id || null}, ${body.description || null}, ${body.is_system || false}, ${body.opening_balance || 0})
      RETURNING *`;
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[finance/accounts POST]", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
