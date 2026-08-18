export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const rows = await sql`SELECT * FROM fixed_assets WHERE id = ${id}`;
    if (!(rows as any[]).length) return NextResponse.json({ error: "Fixed asset not found" }, { status: 404 });

    const depreciation = await sql`SELECT * FROM depreciation_schedule WHERE asset_id = ${id} ORDER BY period_date`;
    return NextResponse.json({ data: { ...rows[0], depreciation } });
  } catch (error) {
    console.error("[finance/fixed-assets GET:id]", error);
    return NextResponse.json({ error: "Failed to fetch fixed asset" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();

    if (body._action === "dispose") {
      const rows = await sql`UPDATE fixed_assets SET status = 'disposed', updated_at = now() WHERE id = ${id} RETURNING *`;
      return NextResponse.json({ data: rows[0] });
    }

    const rows = await sql`
      UPDATE fixed_assets SET
        asset_name = COALESCE(${body.asset_name}, asset_name),
        category = COALESCE(${body.category}, category),
        status = COALESCE(${body.status}, status),
        location = COALESCE(${body.location}, location),
        assigned_to = ${body.assigned_to ?? null},
        salvage_value = COALESCE(${body.salvage_value}, salvage_value),
        useful_life_yrs = COALESCE(${body.useful_life_yrs}, useful_life_yrs),
        notes = COALESCE(${body.notes}, notes),
        updated_at = now()
      WHERE id = ${id} RETURNING *`;
    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error("[finance/fixed-assets PUT]", error);
    return NextResponse.json({ error: "Failed to update fixed asset" }, { status: 500 });
  }
}
