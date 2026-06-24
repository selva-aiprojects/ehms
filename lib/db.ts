import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || "";

const connections = new Map<string, ReturnType<typeof neon>>();

let _publicDb: ReturnType<typeof neon> | null = null;

export function getDb(schema?: string) {
  const targetSchema = schema || process.env.DEFAULT_TENANT_SCHEMA || "viswa";
  if (!connections.has(targetSchema)) {
    const url = new URL(databaseUrl);
    url.searchParams.set("options", `--search_path=${targetSchema},public`);
    connections.set(targetSchema, neon(url.toString()));
  }
  return connections.get(targetSchema)!;
}

export function getPublicDb() {
  if (!_publicDb) {
    const url = new URL(databaseUrl);
    url.searchParams.set("options", "--search_path=public");
    _publicDb = neon(url.toString());
  }
  return _publicDb;
}
