/**
 * lib/chat/guards.ts
 * Three-layer authorization for chat intents:
 *   1. Role guard  — is the user's role allowed to run the intent?
 *   2. Journey guard — is the intent available in the active vertical?
 *   3. Property guard — is the requested property within the user's scope?
 */

import { roleAllowed, verticalAllowed } from "./catalog";
import type { ChatContext, ChatIntent } from "./types";
import { UNRESTRICTED_ROLES } from "./types";

export interface GuardResult {
  allowed: boolean;
  reason?: string;
}

/** Layer 1 + 2 — role and vertical journey. */
export function checkAccess(intent: ChatIntent, ctx: ChatContext): GuardResult {
  if (!roleAllowed(intent, ctx.role)) {
    return {
      allowed: false,
      reason: `Your role (${ctx.role}) is not authorized to ${intent.description.toLowerCase()}.`,
    };
  }
  if (!verticalAllowed(intent, ctx.journey)) {
    return {
      allowed: false,
      reason: `This command is not available in the "${ctx.journey}" workspace.`,
    };
  }
  return { allowed: true };
}

/**
 * Layer 3 — property scope for the explicit property_id param.
 * Unrestricted roles (super_admin / executive / platform_super_admin) and
 * roles with no property assignment may target any property.
 */
export function checkPropertyScope(ctx: ChatContext, propertyId?: string): GuardResult {
  if (!propertyId) return { allowed: true };
  if (UNRESTRICTED_ROLES.has(ctx.role) || ctx.isPlatformAdmin) return { allowed: true };
  if (ctx.assignedPropertyIds.length === 0) return { allowed: true };
  if (ctx.assignedPropertyIds.includes(propertyId)) return { allowed: true };
  return {
    allowed: false,
    reason: "You are not assigned to this property.",
  };
}
