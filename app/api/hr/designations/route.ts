import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("department_id");

    let rows;
    if (departmentId) {
      rows = await sql`
        SELECT des.*, d.name AS department_name
        FROM designations des
        LEFT JOIN departments d ON d.id = des.department_id
        WHERE des.department_id = ${departmentId}
        ORDER BY des.level ASC, des.name ASC
      `;
    } else {
      rows = await sql`
        SELECT des.*, d.name AS department_name
        FROM designations des
        LEFT JOIN departments d ON d.id = des.department_id
        ORDER BY des.level ASC, des.name ASC
      `;
    }

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/designations GET]", error);
    return NextResponse.json({ error: "Failed to fetch designations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { name, code, department_id, level } = body;

    if (!name) {
      return NextResponse.json({ error: "Designation name is required" }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO designations (name, code, department_id, level)
      VALUES (${name}, ${code || null}, ${department_id || null}, ${level || 1})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/designations POST]", error);
    return NextResponse.json({ error: "Failed to create designation" }, { status: 500 });
  }
}
