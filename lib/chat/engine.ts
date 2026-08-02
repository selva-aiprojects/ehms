/**
 * lib/chat/engine.ts
 * Orchestrates a single chat turn:
 *   1. Classify the message into an intent (deterministic keyword scorer).
 *   2. Enforce role + vertical + property guards.
 *   3. For high/critical write intents, require a typed confirmation token
 *      before any mutation is applied.
 *   4. Run the handler and audit every executed turn.
 */

import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";
import { resolveIntent } from "./catalog";
import { buildChatContext } from "./context";
import { checkAccess, checkPropertyScope } from "./guards";
import { writeAudit } from "./audit";
import { runHandler } from "./handlers";
import type { ChatContext, ChatIntent, ChatTurnResult } from "./types";

export interface ChatTurnOptions {
  /** Raw user message. */
  message: string;
  /** Signed confirmation token returned by a prior "confirmationRequired" turn. */
  confirmToken?: string;
}

const CONFIRM_REQUIRED = new Set(["high", "critical"]);

/**
 * A confirmation token is a signed HMAC over the intent id + the scoped
 * property. It is only meaningful for high/critical write intents and expires
 * with the server secret rotation (session-bound). For the MVP catalog (all
 * low/medium) no token is produced.
 */
function signConfirmToken(ctx: ChatContext, intent: ChatIntent): string {
  const data = `${ctx.userId}|${ctx.propertyId || ""}|${intent.id}`;
  const secret = process.env.JWT_SECRET || "dev-secret";
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  const raw = Buffer.from(data, "utf8").toString("base64url");
  return `${raw}.${sig}`;
}

function verifyConfirmToken(ctx: ChatContext, intent: ChatIntent, token?: string): boolean {
  if (!token) return false;
  try {
    const secret = process.env.JWT_SECRET || "dev-secret";
    const [raw, sig] = token.split(".");
    if (!raw || !sig) return false;
    const expected = createHmac("sha256", secret).update(Buffer.from(raw, "base64url").toString("utf8")).digest();
    const given = Buffer.from(sig, "base64url");
    if (given.length !== expected.length) return false;
    return timingSafeEqual(given, expected);
  } catch {
    return false;
  }
}

async function capabilities(ctx: ChatContext): Promise<ChatTurnResult> {
  const sql = getDb();
  const intent = { id: "util.capabilities" } as ChatIntent;
  return runHandler(ctx, intent, {}, sql);
}

export async function runChatTurn(
  req: NextRequest,
  opts: ChatTurnOptions
): Promise<ChatTurnResult> {
  const ctx = buildChatContext(req);
  if (!ctx) {
    return {
      intentId: "util.capabilities",
      intentName: "Unauthenticated",
      module: "Copilot",
      action: "read",
      risk: "low",
      content: "Session expired. Please sign in again.",
      warnings: [],
      suggestions: [],
      confirmationRequired: false,
      error: "Unauthenticated",
    };
  }

  const trimmed = (opts.message || "").trim();
  if (!trimmed) return capabilities(ctx);

  const match = resolveIntent(trimmed, ctx);
  if (!match) return capabilities(ctx);

  const { intent, slots } = match;

  const access = checkAccess(intent, ctx);
  if (!access.allowed) {
    return {
      intentId: intent.id,
      intentName: intent.name,
      module: intent.module,
      action: intent.action,
      risk: intent.risk,
      content: access.reason || "Not allowed.",
      warnings: [],
      suggestions: [],
      confirmationRequired: false,
      denied: true,
      deniedReason: access.reason,
    };
  }

  const propertyGuard = checkPropertyScope(ctx, ctx.propertyId || undefined);
  if (!propertyGuard.allowed) {
    return {
      intentId: intent.id,
      intentName: intent.name,
      module: intent.module,
      action: intent.action,
      risk: intent.risk,
      content: propertyGuard.reason || "Not allowed for this property.",
      warnings: [],
      suggestions: [],
      confirmationRequired: false,
      denied: true,
      deniedReason: propertyGuard.reason,
    };
  }

  // High/critical writes require a confirmation token before execution.
  if (intent.action === "write" && CONFIRM_REQUIRED.has(intent.risk)) {
    if (!verifyConfirmToken(ctx, intent, opts.confirmToken)) {
      return {
        intentId: intent.id,
        intentName: intent.name,
        module: intent.module,
        action: intent.action,
        risk: intent.risk,
        content: `Please confirm you want to ${intent.description.toLowerCase()}? Reply "yes" to continue.`,
        warnings: [],
        suggestions: [],
        confirmationRequired: true,
        confirmToken: signConfirmToken(ctx, intent),
      };
    }
  }

  const sql = getDb();
  const result = await runHandler(ctx, intent, slots, sql);

  if (!result.error && !result.denied) {
    const d = result.data as Record<string, unknown> | undefined;
    const resultId = d ? (d.bookingId || d.ticketId || d.requestId) as string | undefined : undefined;
    await writeAudit(sql, ctx, intent, {
      slots,
      result_id: resultId,
    });
  }

  return result;
}
