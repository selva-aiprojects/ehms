import { neon } from "@neondatabase/serverless";
import type { NeonQueryFunction } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || "";

type SqlFn = NeonQueryFunction<false, false>;

interface WrappedSql {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<Record<string, unknown>[]>;
  query: SqlFn["query"];
  unsafe: SqlFn["unsafe"];
  transaction: SqlFn["transaction"];
}

const connections = new Map<string, WrappedSql>();

let _publicSql: WrappedSql | null = null;

function makeWrappedSql(schema: string): WrappedSql {
  const sql = neon(databaseUrl) as SqlFn;

  const wrapped = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const results = await sql.transaction([
      sql`SET search_path TO ${schema}, public`,
      sql(strings, ...values),
    ]);
    return results[1] as Record<string, unknown>[];
  }) as WrappedSql;

  wrapped.query = ((text: string, params?: unknown[], opts?: Record<string, unknown>) => {
    return sql.transaction([
      sql`SET search_path TO ${schema}, public`,
      sql.query(text, params, opts),
    ]).then((results: unknown[]) => results[1]);
  }) as WrappedSql["query"];

  wrapped.unsafe = ((rawSQL: string) => sql.unsafe(rawSQL)) as WrappedSql["unsafe"];

  wrapped.transaction = ((queriesOrFn: unknown, opts?: unknown) => {
    return sql.transaction(queriesOrFn as never, opts as never);
  }) as WrappedSql["transaction"];

  return wrapped;
}

export function getDb(schema?: string): WrappedSql {
  const targetSchema = schema || process.env.DEFAULT_TENANT_SCHEMA || "viswa";
  if (!connections.has(targetSchema)) {
    connections.set(targetSchema, makeWrappedSql(targetSchema));
  }
  return connections.get(targetSchema)!;
}

export function getPublicDb(): WrappedSql {
  if (!_publicSql) {
    _publicSql = makeWrappedSql("public");
  }
  return _publicSql;
}
