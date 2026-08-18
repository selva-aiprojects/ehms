import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { property_id, conversation_id, phone_number, message_type, text_body, template_name, template_vars, media_url } = body;
    const sql = getDb();

    if (!property_id || !phone_number) {
      return NextResponse.json({ error: "property_id and phone_number required" }, { status: 400 });
    }

    const configResult = await sql`SELECT * FROM whatsapp_config WHERE property_id = ${property_id} AND enabled = true`;
    if (configResult.length === 0) {
      return NextResponse.json({ error: "WhatsApp not configured for this property" }, { status: 400 });
    }

    let convId = conversation_id;
    if (!convId) {
      const existing = await sql`SELECT id FROM whatsapp_conversations WHERE property_id = ${property_id} AND phone_number = ${phone_number}`;
      if (existing.length > 0) {
        convId = existing[0].id;
      } else {
        const newConv = await sql`INSERT INTO whatsapp_conversations (property_id, phone_number) VALUES (${property_id}, ${phone_number}) RETURNING id`;
        convId = newConv[0].id;
      }
    }

    const msgResult = await sql`
      INSERT INTO whatsapp_messages (conversation_id, property_id, direction, message_type, text_body, template_name, template_vars, media_url, status)
      VALUES (${convId}, ${property_id}, 'outbound', ${message_type || "text"}, ${text_body || null},
              ${template_name || null}, ${template_vars ? JSON.stringify(template_vars) : null}::jsonb, ${media_url || null}, 'sent') RETURNING *
    `;

    await sql`UPDATE whatsapp_conversations SET last_message_at = now(), last_message_preview = ${text_body?.slice(0, 100) || template_name || "Media"}, updated_at = now() WHERE id = ${convId}`;

    return NextResponse.json({
      message: msgResult[0],
      provider: configResult[0].provider,
      note: "Message logged. Configure provider credentials to send via WhatsApp Business API.",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
