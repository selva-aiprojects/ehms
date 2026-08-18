import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get("property_id");
    const sql = getDb();

    let rows;
    if (propertyId) {
      rows = await sql`SELECT * FROM whatsapp_templates WHERE property_id = ${propertyId} ORDER BY created_at DESC`;
    } else {
      rows = await sql`SELECT * FROM whatsapp_templates ORDER BY created_at DESC`;
    }
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { property_id, name, category, language, body_text, header_type, header_text, footer_text, variables, buttons } = body;
    const sql = getDb();

    if (!property_id || !name || !body_text) {
      return NextResponse.json({ error: "property_id, name, body_text required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO whatsapp_templates (property_id, name, category, language, body_text, header_type, header_text, footer_text, variables, buttons)
      VALUES (${property_id}, ${name}, ${category || "utility"}, ${language || "en"}, ${body_text},
              ${header_type || "none"}, ${header_text || null}, ${footer_text || null},
              ${JSON.stringify(variables || [])}::jsonb, ${JSON.stringify(buttons || [])}::jsonb)
      RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
