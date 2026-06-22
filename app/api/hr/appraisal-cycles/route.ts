import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const rows = await sql`
      SELECT
        ac.*,
        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name, 'email', u.email) AS created_by_user
      FROM appraisal_cycles ac
      LEFT JOIN users u ON u.id = ac.created_by
        ${status ? sql`WHERE ac.status = ${status}` : sql``}
      ORDER BY ac.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/appraisal-cycles GET]", error);
    return NextResponse.json({ error: "Failed to fetch appraisal cycles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO appraisal_cycles (
        name, cycle_type, period_start, period_end,
        rating_scale, status, property_id, created_by
      ) VALUES (
        ${body.name}, ${body.cycle_type}, ${body.period_start},
        ${body.period_end}, ${body.rating_scale}, ${body.status},
        ${body.property_id}, ${body.created_by}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/appraisal-cycles POST]", error);
    return NextResponse.json({ error: "Failed to create appraisal cycle" }, { status: 500 });
  }
}
