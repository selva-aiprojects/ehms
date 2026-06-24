import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || "";

let _sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!_sql) {
    // Set search_path to tenant schema (viswa) with public fallback for extensions
    // This enables schema-per-tenant isolation transparently — all existing
    // API routes continue to work without schema-qualified table names.
    const url = new URL(databaseUrl);
    url.searchParams.set(
      "options",
      "--search_path=viswa,public"
    );
    _sql = neon(url.toString());
  }
  return _sql;
}
