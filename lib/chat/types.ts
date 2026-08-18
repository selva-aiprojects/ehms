/**
 * lib/chat/types.ts
 * Shared types for the HostSphere AI Co-Pilot chat engine.
 */

export type ChatAction = "read" | "write";
export type ChatRisk = "low" | "medium" | "high" | "critical";
export type ChatVertical = "all" | "hotels" | "apartments" | "rental" | "workplace";

export interface ChatIntent {
  id: string;
  name: string;
  module: string;
  description: string;
  /** "read" = query only, "write" = mutates tenant data */
  action: ChatAction;
  risk: ChatRisk;
  /** Journeys where this intent is available. "all" = available in every journey. */
  verticals: ChatVertical[];
  /** Roles allowed to use this intent. Mirrors lib/role-access.ts ROLE_ACCESS. */
  roles: string[];
  /** Keyword tokens used by the deterministic classifier. */
  keywords: string[];
  examples: string[];
}

/** Server-side context resolved from the proxy-injected JWT headers. */
export interface ChatContext {
  userId: string;
  email: string;
  role: string;
  tenantCode: string;
  tenantSchema: string;
  tenantVerticals: ChatVertical[];
  /** Empty array = unrestricted (super_admin / executive / platform_super_admin). */
  assignedPropertyIds: string[];
  isPlatformAdmin: boolean;
  /** Active vertical journey (validated against tenantVerticals). */
  journey: ChatVertical;
  /** Explicitly selected property (validated against assignment). */
  propertyId: string | null;
}

/** Entities extracted from the raw message by the classifier. */
export interface ExtractedSlots {
  phone?: string;
  bookingRef?: string;
  roomNo?: string;
  amount?: number;
  date?: string;
  nights?: number;
  category?: string;
  taskId?: string;
  freeText?: string;
}

export interface IntentMatch {
  intent: ChatIntent;
  confidence: number;
  slots: ExtractedSlots;
}

export interface ChatTurnResult {
  intentId: string;
  intentName: string;
  module: string;
  action: ChatAction;
  risk: ChatRisk;
  content?: string;
  data?: unknown;
  warnings: string[];
  suggestions: string[];
  /** Set when a high/critical write intent requires a typed confirmation. */
  confirmationRequired: boolean;
  confirmToken?: string;
  error?: string;
  denied?: boolean;
  deniedReason?: string;
}

export const UNRESTRICTED_ROLES = new Set(["super_admin", "executive", "platform_super_admin"]);
