import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe") {
      return new NextResponse(challenge || "OK", { status: 200 });
    }
    return NextResponse.json({ error: "Invalid verification" }, { status: 403 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== "messages") continue;
        const value = change.value;
        const messages = value.messages || [];
        const contacts = value.contacts || [];

        for (const msg of messages) {
          const phone = msg.from;
          const contact = contacts.find((c: any) => c.wa_id === phone);
          const sql = getDb();

          const configResult = await sql`SELECT property_id FROM whatsapp_config WHERE phone_number_id = ${value.metadata?.phone_number_id} AND enabled = true`;
          if (configResult.length === 0) continue;
          const propertyId = configResult[0].property_id;

          let convResult = await sql`SELECT id FROM whatsapp_conversations WHERE property_id = ${propertyId} AND phone_number = ${phone}`;
          if (convResult.length === 0) {
            convResult = await sql`INSERT INTO whatsapp_conversations (property_id, phone_number, contact_name) VALUES (${propertyId}, ${phone}, ${contact?.profile?.name || null}) RETURNING id`;
          }
          const convId = convResult[0].id;

          let textBody = "";
          let messageType = "text";
          if (msg.type === "text") { textBody = msg.text?.body || ""; }
          else if (msg.type === "image") { messageType = "image"; textBody = msg.image?.caption || "[Image]"; }
          else if (msg.type === "interactive") { messageType = "interactive"; textBody = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || ""; }

          await sql`INSERT INTO whatsapp_messages (conversation_id, property_id, direction, message_type, text_body, wa_message_id, wa_timestamp, status) VALUES (${convId}, ${propertyId}, 'inbound', ${messageType}, ${textBody}, ${msg.id}, ${new Date(parseInt(msg.timestamp) * 1000).toISOString()}, 'read')`;

          await sql`UPDATE whatsapp_conversations SET last_message_at = ${new Date(parseInt(msg.timestamp) * 1000).toISOString()}, last_message_preview = ${textBody.slice(0, 100)}, updated_at = now() WHERE id = ${convId}`;

          const config = (await sql`SELECT auto_welcome FROM whatsapp_config WHERE property_id = ${propertyId}`)[0];
          if (config?.auto_welcome && textBody.toLowerCase() === "hi") {
            const welcomeTemplate = (await sql`SELECT body_text FROM whatsapp_templates WHERE property_id = ${propertyId} AND name = 'welcome' AND status = 'approved' LIMIT 1`)[0];
            if (welcomeTemplate) {
              const replyBody = (welcomeTemplate.body_text as string).replace(/\{\{1\}\}/, contact?.profile?.name || "Guest").replace(/\{\{2\}\}/, "our hotel");
              await sql`INSERT INTO whatsapp_messages (conversation_id, property_id, direction, message_type, text_body, status, is_ai_generated) VALUES (${convId}, ${propertyId}, 'outbound', 'text', ${replyBody}, 'sent', true)`;
            }
          }
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e: any) {
    console.error("WhatsApp webhook error:", e);
    return new NextResponse("OK", { status: 200 });
  }
}
