/**
 * lib/chat/audit.ts
 * Writes copilot actions into the shard's system_audit_events table so every
 * chat command — especially writes — is traceable per the audit requirements.
 */

import type { ChatContext, ChatIntent } from "./types";
import type { WrappedSql } from "@/lib/db";

export interface AuditRow {
  event_type: string;
  severity: string;
  title: string;
  description?: string;
  source: string;
  affected_user?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Persist an audit row. Uses a parameterised SQL.query call so it is safe with
 * the Neon driver's flattened tagged templates. Never throws — audit failure
 * must not break the user-facing chat turn.
 */
export async function writeAudit(
  sql: WrappedSql,
  ctx: ChatContext,
  intent: ChatIntent,
  details: Record<string, unknown>
): Promise<void> {
  if (!sql || !intent) return;
  try {
    await sql.query(
      `INSERT INTO system_audit_events (event_type, severity, title, description, source, affected_user, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        intent.action === "write" ? "data_change" : "info_request",
        intent.risk === "critical" || intent.risk === "high" ? "warning" : "info",
        `AI Co-Pilot: ${intent.name}`,
        `${intent.name} executed via chat for ${ctx.email}`,
        "copilot",
        ctx.userId || null,
        {
          intent_id: intent.id,
          role: ctx.role,
          journey: ctx.journey,
          tenant: ctx.tenantCode,
          property_id: ctx.propertyId || null,
          ...details,
        },
      ]
    );
  } catch (err) {
    console.error("[copilot:audit]", err);
  }
}
