import { neon, neonConfig } from "@neondatabase/serverless";

// Enable connection caching to maintain persistent pipelines across queries
neonConfig.fetchConnectionCache = true;

const databaseUrl = process.env.DATABASE_URL || "";

let _sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!_sql) {
    _sql = neon(databaseUrl);
  }
  return _sql;
}
