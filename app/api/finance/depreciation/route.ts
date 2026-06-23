export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get("asset_id");
    const posted = searchParams.get("is_posted");

    let query = sql`
      SELECT ds.*, fa.asset_code, fa.asset_name
      FROM depreciation_schedule ds
      JOIN fixed_assets fa ON fa.id = ds.asset_id
      WHERE 1=1`;
    if (assetId) query = sql`${query} AND ds.asset_id = ${assetId}`;
    if (posted === "true") query = sql`${query} AND ds.is_posted = true`;
    else if (posted === "false") query = sql`${query} AND ds.is_posted = false`;
    query = sql`${query} ORDER BY ds.period_date DESC`;

    return NextResponse.json({ data: await query });
  } catch (error) {
    console.error("[finance/depreciation GET]", error);
    return NextResponse.json({ error: "Failed to fetch depreciation schedule" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO depreciation_schedule (asset_id, period_date, amount)
      VALUES (${body.asset_id}, ${body.period_date}, ${body.amount})
      ON CONFLICT (asset_id, period_date)
      DO UPDATE SET amount = EXCLUDED.amount
      RETURNING *`;

    await sql`UPDATE fixed_assets SET accumulated_dep = (SELECT COALESCE(SUM(amount), 0) FROM depreciation_schedule WHERE asset_id = ${body.asset_id} AND is_posted = true) WHERE id = ${body.asset_id}`;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[finance/depreciation POST]", error);
    return NextResponse.json({ error: "Failed to record depreciation" }, { status: 500 });
  }
}
