import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_: NextRequest) {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT d.*,
        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name) AS manager
      FROM departments d
      LEFT JOIN users u ON u.id = d.manager_id
      ORDER BY d.name ASC
    `;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/departments GET]", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO departments (name, code, property_id, manager_id)
      VALUES (
        ${body.name}, ${body.code}, ${body.property_id}, ${body.manager_id}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/departments POST]", error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
