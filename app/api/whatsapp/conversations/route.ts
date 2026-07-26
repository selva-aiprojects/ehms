import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get("property_id");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const sql = getDb();

    let rows;
    if (propertyId && status && search) {
      rows = await sql`
        SELECT wc.*, gp.first_name || ' ' || gp.last_name AS guest_name, r.confirmation_no,
          (SELECT COUNT(*) FROM whatsapp_messages wm WHERE wm.conversation_id = wc.id AND wm.direction = 'inbound' AND wm.status != 'read') AS unread_count
        FROM whatsapp_conversations wc
        LEFT JOIN guest_profiles gp ON gp.id = wc.guest_id
        LEFT JOIN reservations r ON r.id = wc.reservation_id
        WHERE wc.property_id = ${propertyId} AND wc.status = ${status}
          AND (wc.phone_number ILIKE ${`%${search}%`} OR wc.contact_name ILIKE ${`%${search}%`} OR gp.first_name || ' ' || gp.last_name ILIKE ${`%${search}%`})
        ORDER BY wc.last_message_at DESC NULLS LAST LIMIT 100
      `;
    } else if (propertyId) {
      rows = await sql`
        SELECT wc.*, gp.first_name || ' ' || gp.last_name AS guest_name, r.confirmation_no,
          (SELECT COUNT(*) FROM whatsapp_messages wm WHERE wm.conversation_id = wc.id AND wm.direction = 'inbound' AND wm.status != 'read') AS unread_count
        FROM whatsapp_conversations wc
        LEFT JOIN guest_profiles gp ON gp.id = wc.guest_id
        LEFT JOIN reservations r ON r.id = wc.reservation_id
        WHERE wc.property_id = ${propertyId}
        ORDER BY wc.last_message_at DESC NULLS LAST LIMIT 100
      `;
    } else {
      rows = await sql`
        SELECT wc.*, gp.first_name || ' ' || gp.last_name AS guest_name, r.confirmation_no,
          (SELECT COUNT(*) FROM whatsapp_messages wm WHERE wm.conversation_id = wc.id AND wm.direction = 'inbound' AND wm.status != 'read') AS unread_count
        FROM whatsapp_conversations wc
        LEFT JOIN guest_profiles gp ON gp.id = wc.guest_id
        LEFT JOIN reservations r ON r.id = wc.reservation_id
        ORDER BY wc.last_message_at DESC NULLS LAST LIMIT 100
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
    const { property_id, phone_number, contact_name, guest_id, reservation_id } = body;
    const sql = getDb();

    if (!property_id || !phone_number) {
      return NextResponse.json({ error: "property_id and phone_number required" }, { status: 400 });
    }

    const existing = await sql`SELECT id FROM whatsapp_conversations WHERE property_id = ${property_id} AND phone_number = ${phone_number}`;
    if (existing.length > 0) {
      return NextResponse.json({ id: existing[0].id, status: "existing" });
    }

    const result = await sql`
      INSERT INTO whatsapp_conversations (property_id, phone_number, contact_name, guest_id, reservation_id)
      VALUES (${property_id}, ${phone_number}, ${contact_name || null}, ${guest_id || null}, ${reservation_id || null}) RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
