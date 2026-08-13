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
    const { endpoint } = body || {};

    if (!endpoint) {
      return NextResponse.json({ error: "endpoint required" }, { status: 400 });
    }

    const sql = getDb();
    await sql`
      DELETE FROM push_subscriptions
      WHERE endpoint = ${endpoint} AND user_id = ${userId}::uuid
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[push unsubscribe]", error);
    const message = error instanceof Error ? error.message : "Failed to remove subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
