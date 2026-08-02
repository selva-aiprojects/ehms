import { NextRequest, NextResponse } from "next/server";
import { availableIntents } from "@/lib/chat/catalog";
import { buildChatContext } from "@/lib/chat/context";

export const runtime = "nodejs";

/**
 * GET /api/chat/chips
 * Returns quick-reply chips for the current role + journey (first example
 * sentence of each allowed intent, trimmed to ~40 chars).
 */
export async function GET(req: NextRequest) {
  const ctx = buildChatContext(req);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const chips = availableIntents(ctx)
    .filter((i) => i.examples.length > 0)
    .slice(0, 12)
    .map((i) => ({ intentId: i.id, label: i.examples[0].slice(0, 42) }));
  return NextResponse.json({ chips });
}
