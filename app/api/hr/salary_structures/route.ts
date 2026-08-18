import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const bandId = searchParams.get("band_id");

    let rows;
    if (bandId) {
      rows = await sql`
        SELECT s.*, b.name AS band_name, b.code AS band_code
        FROM salary_structures s
        LEFT JOIN employee_bands b ON b.id = s.band_id
        WHERE s.band_id = ${bandId}
        ORDER BY s.created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT s.*, b.name AS band_name, b.code AS band_code
        FROM salary_structures s
        LEFT JOIN employee_bands b ON b.id = s.band_id
        ORDER BY s.created_at DESC
      `;
    }

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/salary_structures GET]", error);
    return NextResponse.json({ error: "Failed to fetch salary structures" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { name, band_id, base_percentage, hra_percentage, pf_applicable } = body;

    if (!name) {
      return NextResponse.json({ error: "Structure name is required" }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO salary_structures (name, band_id, base_percentage, hra_percentage, pf_applicable)
      VALUES (${name}, ${band_id || null}, ${base_percentage ?? 50}, ${hra_percentage ?? 20}, ${pf_applicable ?? true})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/salary_structures POST]", error);
    return NextResponse.json({ error: "Failed to create salary structure" }, { status: 500 });
  }
}
