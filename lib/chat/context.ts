/**
 * lib/chat/context.ts
 * Builds the server-side ChatContext for a request.
 *
 * The Next.js proxy injects verified JWT claims as headers on every request:
 *   x-user-id, x-user-role, x-user-email, x-tenant-schema, x-tenant-code,
 *   x-tenant-verticals, x-user-property-ids, x-is-platform-admin
 *
 * The chat API re-validates the token itself (it never trusts the headers
 * alone — it can read the ehms_token cookie and decode it). Property context
 * comes from the query param, which is then validated against the role's
 * assigned property ids.
 */

import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import type { ChatContext, ChatVertical } from "./types";

/** Normalize a role from the JWT to the IDs used in the intent catalog. */
export function normalizeRole(role: string): string {
  const r = (role || "").toLowerCase();
  if (r.includes("front") && r.includes("desk")) return "front_desk";
  if (r.includes("housekeeping")) return "housekeeping";
  if (r.includes("maintenance")) return "maintenance";
  if (r.includes("finance")) return "finance";
  if (r.includes("hr")) return "hr";
  if (r.includes("executive")) return "executive";
  if (r.includes("property") && r.includes("manager")) return "property_manager";
  if (r.includes("super") && r.includes("admin")) return "super_admin";
  return r || "unknown";
}

function parseVerticals(raw: string | undefined): ChatVertical[] {
  if (!raw) return [];
  const valid: ChatVertical[] = ["all", "hotels", "apartments", "rental", "workplace"];
  const out: ChatVertical[] = [];
  for (const v of raw.split(",").map((s) => s.trim().toLowerCase())) {
    if ((valid as string[]).includes(v) && !out.includes(v as ChatVertical)) out.push(v as ChatVertical);
  }
  return out;
}

function parseUuidList(raw: string | undefined): string[] {
  if (!raw) return [];
  const out: string[] = [];
  for (const p of raw.split(",")) {
    const id = p.trim();
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

/** True when the supplied journey is valid for the tenant and the current role. */
export function resolveJourney(
  journey: string | undefined,
  tenantVerticals: ChatVertical[],
  role: string
): ChatVertical {
  const j = (journey || "all").toLowerCase() as ChatVertical;
  const valid: ChatVertical[] = ["all", "hotels", "apartments", "rental", "workplace"];
  if (!(valid as string[]).includes(j)) return "all";
  if (j === "all" && role === "platform_super_admin") return "all";
  if (tenantVerticals.length === 0) return "all";
  if (tenantVerticals.includes("all") || tenantVerticals.includes(j)) return j;
  return "all";
}

/** Build a fully validated ChatContext. Returns null when the request is unauthenticated. */
export function buildChatContext(req: NextRequest): ChatContext | null {
  const cookieToken = req.cookies.get("ehms_token")?.value;
  const payload = cookieToken ? verifyToken(cookieToken) : null;
  const role = normalizeRole(payload?.role_name || req.headers.get("x-user-role") || "unknown");
  const isPlatformAdmin = payload?.is_platform_admin === true || req.headers.get("x-is-platform-admin") === "true";

  const tenantCode = payload?.tenant_code || req.headers.get("x-tenant-code") || "";
  const tenantSchema = payload?.tenant_schema || req.headers.get("x-tenant-schema") || "";
  const tenantVerticals = parseVerticals(
    payload?.tenant_verticals?.length ? payload.tenant_verticals.join(",") : req.headers.get("x-tenant-verticals") || ""
  );
  const assignedPropertyIds =
    payload?.assigned_property_ids && payload.assigned_property_ids.length > 0
      ? payload.assigned_property_ids
      : parseUuidList(req.headers.get("x-user-property-ids") || "");
  const journey = resolveJourney(
    req.headers.get("x-active-journey") || req.nextUrl.searchParams.get("journey") || undefined,
    tenantVerticals,
    role
  );

  const userId = payload?.user_id || req.headers.get("x-user-id") || "";
  const email = payload?.email || req.headers.get("x-user-email") || "";

  if (!userId && !email) return null;

  let propertyId: string | null = null;
  const requestedProperty = req.nextUrl.searchParams.get("property_id");
  if (requestedProperty) {
    const isUnrestricted = role === "super_admin" || role === "executive" || isPlatformAdmin;
    const allowed =
      isUnrestricted || assignedPropertyIds.length === 0 || assignedPropertyIds.includes(requestedProperty);
    if (allowed) propertyId = requestedProperty;
  }

  return {
    userId,
    email,
    role,
    tenantCode,
    tenantSchema,
    tenantVerticals,
    assignedPropertyIds,
    isPlatformAdmin,
    journey,
    propertyId,
  };
}

/** Whether the context is unrestricted across all properties. */
export function isPropertyUnrestricted(ctx: ChatContext): boolean {
  return (
    ctx.isPlatformAdmin ||
    ctx.role === "super_admin" ||
    ctx.role === "executive" ||
    ctx.assignedPropertyIds.length === 0
  );
}

/** The list of property ids the context may read from. */
export function scopedPropertyIds(ctx: ChatContext): string[] {
  if (ctx.propertyId) return [ctx.propertyId];
  if (isPropertyUnrestricted(ctx)) return [];
  return ctx.assignedPropertyIds;
}
