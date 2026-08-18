import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employee_id");
    const status = searchParams.get("status");

    const rows = await sql`
      SELECT
        p.*,
        json_build_object('id', e.id, 'employee_code', e.employee_code, 'user_id', e.user_id) AS employee,
        json_build_object('id', fb.id, 'name', fb.name) AS from_band,
        json_build_object('id', tb.id, 'name', tb.name) AS to_band,
        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name) AS approved_by_user
      FROM employee_promotions p
      LEFT JOIN employees e ON e.id = p.employee_id
      LEFT JOIN employee_bands fb ON fb.id = p.from_band_id
      LEFT JOIN employee_bands tb ON tb.id = p.to_band_id
      LEFT JOIN users u ON u.id = p.approved_by
      WHERE 1=1
        ${employeeId ? sql`AND p.employee_id = ${employeeId}` : sql``}
        ${status ? sql`AND p.status = ${status}` : sql``}
      ORDER BY p.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/promotions GET]", error);
    return NextResponse.json({ error: "Failed to fetch promotions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO employee_promotions (
        employee_id, from_designation, to_designation, from_band_id, to_band_id,
        from_ctc, to_ctc, effective_date, reason, approved_by, status
      ) VALUES (
        ${body.employee_id}, ${body.from_designation}, ${body.to_designation},
        ${body.from_band_id}, ${body.to_band_id}, ${body.from_ctc},
        ${body.to_ctc}, ${body.effective_date}, ${body.reason},
        ${body.approved_by}, ${body.status}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/promotions POST]", error);
    return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 });
  }
}
