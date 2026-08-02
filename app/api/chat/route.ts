import { NextRequest, NextResponse } from "next/server";
import { runChatTurn } from "@/lib/chat/engine";

export const runtime = "nodejs";

/**
 * POST /api/chat
 * AI Co-Pilot chat endpoint.
 *
 * Body:
 *   { message: string, confirmToken?: string, property_id?: string, journey?: string }
 *
 * Returns a ChatTurnResult. Writes are scoped to the caller's tenant schema
 * (via proxy-injected x-tenant-schema) and property assignment. Auth is
 * enforced by the engine from the ehms_token cookie + JWT headers.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const message = typeof body?.message === "string" ? body.message : "";

    const result = await runChatTurn(req, {
      message,
      confirmToken: typeof body?.confirmToken === "string" ? body.confirmToken : undefined,
    });

    if (result.error === "Unauthenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[copilot:chat]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to process chat message", detail: message },
      { status: 500 }
    );
  }
}
