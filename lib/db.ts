import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || "";

let _sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!_sql) {
    _sql = neon(databaseUrl);
  }
  return _sql;
}
