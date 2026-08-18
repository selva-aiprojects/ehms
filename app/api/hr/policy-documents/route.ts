import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const rows = await sql`
      SELECT
        pd.*,
        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name, 'email', u.email) AS uploaded_by_user
      FROM policy_documents pd
      LEFT JOIN users u ON u.id = pd.uploaded_by
      WHERE pd.is_active = true
        ${category ? sql`AND pd.category = ${category}` : sql``}
      ORDER BY pd.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/policy-documents GET]", error);
    return NextResponse.json({ error: "Failed to fetch policy documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO policy_documents (
        property_id, category, title, description, department,
        file_name, file_type, file_size, file_content,
        effective_date, version, uploaded_by
      ) VALUES (
        ${body.property_id}, ${body.category}, ${body.title}, ${body.description},
        ${body.department}, ${body.file_name}, ${body.file_type},
        ${body.file_size}, ${body.file_content},
        ${body.effective_date}, ${body.version}, ${body.uploaded_by}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/policy-documents POST]", error);
    return NextResponse.json({ error: "Failed to create policy document" }, { status: 500 });
  }
}
