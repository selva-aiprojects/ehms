import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, keys } = body || {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Invalid subscription payload" },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Upsert the subscription (endpoint is unique per browser).
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, last_active_at)
      VALUES (
        ${userId}::uuid,
        ${endpoint},
        ${keys.p256dh},
        ${keys.auth},
        ${req.headers.get("user-agent") || null},
        NOW()
      )
      ON CONFLICT (endpoint)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_agent = EXCLUDED.user_agent,
        last_active_at = NOW()
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[push subscribe]", error);
    const message = error instanceof Error ? error.message : "Failed to save subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
