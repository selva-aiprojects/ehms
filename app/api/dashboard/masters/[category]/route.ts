import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const ALLOWED_MASTERS: Record<string, string> = {
  "room-categories": "room_categories",
  "facilities": "facilities",
  "services": "services",
  "channel-partners": "channel_partners",
  "promotions": "promotions",
  "material-types": "material_types",
  "materials": "materials",
  "designations": "designations",
  "employee-bands": "employee_bands",
  "salary-structures": "salary_structures",
  "vendors": "vendors",
  "departments": "departments"
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ category: string }> }) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category } = await params;
    const tableName = ALLOWED_MASTERS[category];

    if (!tableName) {
      return NextResponse.json({ error: "Invalid master category" }, { status: 400 });
    }

    const sql = getDb();
    
    // Dynamic table name requires safe building. We know tableName is safe from our map.
    const result = await sql(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
    
    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error(`[Masters GET]`, error);
    return NextResponse.json({ error: "Failed to fetch master data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ category: string }> }) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category } = await params;
    const tableName = ALLOWED_MASTERS[category];

    if (!tableName) {
      return NextResponse.json({ error: "Invalid master category" }, { status: 400 });
    }

    const body = await req.json();
    const sql = getDb();
    
    // Filter out id, created_at, updated_at
    const { id, created_at, updated_at, ...data } = body;
    
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    if (keys.length === 0) {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    const columns = keys.map(k => `"${k}"`).join(", ");
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    
    // Safe dynamic insert using pg parameterized queries
    const result = await sql(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`, values);

    return NextResponse.json({ data: result[0] });
  } catch (error: any) {
    console.error(`[Masters POST]`, error);
    return NextResponse.json({ error: "Failed to create master record" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ category: string }> }) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category } = await params;
    const tableName = ALLOWED_MASTERS[category];

    if (!tableName) {
      return NextResponse.json({ error: "Invalid master category" }, { status: 400 });
    }

    const body = await req.json();
    const sql = getDb();
    
    const { id, created_at, updated_at, ...data } = body;
    
    if (!id) {
      return NextResponse.json({ error: "Missing record ID" }, { status: 400 });
    }

    const keys = Object.keys(data);
    const values = Object.values(data);
    
    if (keys.length === 0) {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
    values.push(id); // push id for the WHERE clause
    
    const result = await sql(`UPDATE ${tableName} SET ${setClause}, updated_at = now() WHERE id = $${values.length} RETURNING *`, values);

    if (result.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result[0] });
  } catch (error: any) {
    console.error(`[Masters PUT]`, error);
    return NextResponse.json({ error: "Failed to update master record" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ category: string }> }) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category } = await params;
    const tableName = ALLOWED_MASTERS[category];

    if (!tableName) {
      return NextResponse.json({ error: "Invalid master category" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing record ID" }, { status: 400 });
    }

    const sql = getDb();
    const result = await sql(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);

    if (result.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[Masters DELETE]`, error);
    return NextResponse.json({ error: "Failed to delete master record" }, { status: 500 });
  }
}
