import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get("property_id");
    if (!propertyId) return NextResponse.json({ error: "property_id required" }, { status: 400 });
    const sql = getDb();

    const result = await sql`SELECT * FROM kiosk_config WHERE property_id = ${propertyId}`;
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
      "enabled", "welcome_message", "required_id_types", "require_selfie",
      "require_payment", "require_form_c", "digital_key_enabled",
      "branding_logo_url", "branding_color", "background_image_url",
      "auto_checkin_enabled", "auto_checkout_enabled",
    ];

    const setClauses: string[] = [];
    const values: any[] = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        setClauses.push(`${key} = $${setClauses.length + 1}`);
        values.push(typeof fields[key] === "object" ? JSON.stringify(fields[key]) : fields[key]);
      }
    }

    if (setClauses.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    setClauses.push("updated_at = now()");

    const cols = setClauses.map((s) => s.split(" =")[0]);
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    values.push(property_id);

    const result = await sql.unsafe(
      `INSERT INTO kiosk_config (property_id, ${cols.join(", ")})
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
