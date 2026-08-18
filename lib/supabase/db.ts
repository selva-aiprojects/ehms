/**
 * Type-cast helper for Supabase queries.
 * These type assertions are needed because TypeScript cannot statically
 * infer Supabase table shapes from our manual Database type without
 * running `supabase gen types`. Once connected to a real Supabase project
 * and types are regenerated, these casts can be removed.
 */

import { createClient as _createClient } from "@/lib/supabase/server";

/** Supabase client with `any` escape hatch for API routes */
export async function db() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await _createClient()) as any;
}
