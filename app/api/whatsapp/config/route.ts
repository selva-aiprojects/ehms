import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get("property_id");
    if (!propertyId) return NextResponse.json({ error: "property_id required" }, { status: 400 });
    const sql = getDb();

    const result = await sql`
      SELECT id, property_id, enabled, provider, phone_number_id, whatsapp_business_id,
             webhook_verify_token, display_name, about_text, profile_photo_url,
             template_namespace, template_language,
             auto_welcome, auto_checkin_reminder, auto_checkout_reminder, auto_feedback_request, auto_promo_enabled,
             created_at, updated_at
      FROM whatsapp_config WHERE property_id = ${propertyId}
    `;
    return NextResponse.json(result[0] || { enabled: false });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { property_id, ...fields } = body;
    const sql = getDb();

    if (!property_id) return NextResponse.json({ error: "property_id required" }, { status: 400 });

    const allowed = [
      "enabled", "provider", "phone_number_id", "whatsapp_business_id",
      "access_token", "webhook_verify_token", "app_secret",
      "template_namespace", "template_language",
      "display_name", "about_text", "profile_photo_url",
      "auto_welcome", "auto_checkin_reminder", "auto_checkout_reminder", "auto_feedback_request", "auto_promo_enabled",
    ];

    const setClauses: string[] = [];
    const values: any[] = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        setClauses.push(`${key} = $${setClauses.length + 1}`);
        values.push(fields[key]);
      }
    }

    if (setClauses.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    setClauses.push("updated_at = now()");

    const cols = setClauses.map((s) => s.split(" =")[0]);
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    values.push(property_id);

    const result = await sql.unsafe(
      `INSERT INTO whatsapp_config (property_id, ${cols.join(", ")})
       VALUES ($${values.length}, ${placeholders.join(", ")})
       ON CONFLICT (property_id) DO UPDATE SET ${setClauses.join(", ")}
       RETURNING *`,
      values
    );

    return NextResponse.json(result[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
