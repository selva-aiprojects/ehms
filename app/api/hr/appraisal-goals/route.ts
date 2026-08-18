import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const cycleId = searchParams.get("cycle_id");
    const employeeId = searchParams.get("employee_id");

    const rows = await sql`
      SELECT *
      FROM appraisal_goals
      WHERE 1=1
        ${cycleId ? sql`AND cycle_id = ${cycleId}` : sql``}
        ${employeeId ? sql`AND employee_id = ${employeeId}` : sql``}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/appraisal-goals GET]", error);
    return NextResponse.json({ error: "Failed to fetch appraisal goals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO appraisal_goals (
        cycle_id, employee_id, goal, weightage, target_date
      ) VALUES (
        ${body.cycle_id}, ${body.employee_id}, ${body.goal},
        ${body.weightage}, ${body.target_date}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/appraisal-goals POST]", error);
    return NextResponse.json({ error: "Failed to create appraisal goal" }, { status: 500 });
  }
}
