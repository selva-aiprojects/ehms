import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get("property_id");
    const sql = getDb();

    let rows;
    if (propertyId) {
      rows = await sql`
        SELECT wc.*, wt.name AS template_name, wt.body_text AS template_body
        FROM whatsapp_campaigns wc LEFT JOIN whatsapp_templates wt ON wt.id = wc.template_id
        WHERE wc.property_id = ${propertyId} ORDER BY wc.created_at DESC LIMIT 50
      `;
    } else {
      rows = await sql`
        SELECT wc.*, wt.name AS template_name, wt.body_text AS template_body
        FROM whatsapp_campaigns wc LEFT JOIN whatsapp_templates wt ON wt.id = wc.template_id
        ORDER BY wc.created_at DESC LIMIT 50
      `;
    }
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { property_id, name, template_id, target_filter, scheduled_at, custom_variables } = body;
    const sql = getDb();

    if (!property_id || !name) {
      return NextResponse.json({ error: "property_id and name required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO whatsapp_campaigns (property_id, name, template_id, target_filter, scheduled_at, custom_variables, status)
      VALUES (${property_id}, ${name}, ${template_id || null}, ${JSON.stringify(target_filter || {})}::jsonb,
              ${scheduled_at || null}, ${JSON.stringify(custom_variables || {})}::jsonb, 'draft') RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
