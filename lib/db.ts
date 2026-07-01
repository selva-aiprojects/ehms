import { neon } from "@neondatabase/serverless";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { headers } from "next/headers";

const databaseUrl = process.env.DATABASE_URL || "";

type SqlFn = NeonQueryFunction<false, false>;

interface WrappedSql {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<Record<string, unknown>[]>;
  query: SqlFn["query"];
  unsafe: (rawSQL: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;
  transaction: SqlFn["transaction"];
}

const connections = new Map<string, WrappedSql>();

let _publicSql: WrappedSql | null = null;
let _dynamicDb: WrappedSql | null = null;

async function resolveSchema(explicitSchema?: string): Promise<string> {
  if (explicitSchema) return explicitSchema;
  try {
    const headerList = await headers();
    const headerSchema = headerList.get("x-tenant-schema");
    if (headerSchema) return headerSchema;
  } catch (e) {
    // ignore context errors outside request scopes (e.g. build time, scripts)
  }
  return process.env.DEFAULT_TENANT_SCHEMA || "viswa";
}

function makeWrappedSql(schema: string): WrappedSql {
  const sql = neon(databaseUrl) as SqlFn;
  const setPathSQL = `SET search_path TO ${schema}, public`;

  const wrapped = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const results = await sql.transaction([
      sql.query(setPathSQL),
      sql(strings, ...values),
    ]);
    return results[1] as Record<string, unknown>[];
  }) as WrappedSql;

  wrapped.query = ((text: string, params?: unknown[], opts?: Record<string, unknown>) => {
    return sql.transaction([
      sql.query(setPathSQL),
      sql.query(text, params, opts),
    ]).then((results: unknown[]) => results[1]);
  }) as WrappedSql["query"];

  wrapped.unsafe = async (rawSQL: string, params?: unknown[]) => {
    const result = await sql.query(rawSQL, params);
    return result as unknown as Record<string, unknown>[];
  };

  wrapped.transaction = ((queriesOrFn: unknown, opts?: unknown) => {
    return sql.transaction(queriesOrFn as never, opts as never);
  }) as WrappedSql["transaction"];

  return wrapped;
}

function makeDynamicWrappedSql(): WrappedSql {
  const sql = neon(databaseUrl) as SqlFn;

  const wrapped = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const schema = await resolveSchema();
    const setPathSQL = `SET search_path TO ${schema}, public`;
    const results = await sql.transaction([
      sql.query(setPathSQL),
      sql(strings, ...values),
    ]);
    return results[1] as Record<string, unknown>[];
  }) as WrappedSql;

  wrapped.query = (async (text: string, params?: unknown[], opts?: Record<string, unknown>) => {
    const schema = await resolveSchema();
    const setPathSQL = `SET search_path TO ${schema}, public`;
    return sql.transaction([
      sql.query(setPathSQL),
      sql.query(text, params, opts),
    ]).then((results: unknown[]) => results[1]);
  }) as WrappedSql["query"];

  wrapped.unsafe = async (rawSQL: string, params?: unknown[]) => {
    const result = await sql.query(rawSQL, params);
    return result as unknown as Record<string, unknown>[];
  };

  wrapped.transaction = ((queriesOrFn: unknown, opts?: unknown) => {
    return sql.transaction(queriesOrFn as never, opts as never);
  }) as WrappedSql["transaction"];

  return wrapped;
}

export function getDb(schema?: string): WrappedSql {
  if (schema) {
    if (!connections.has(schema)) {
      connections.set(schema, makeWrappedSql(schema));
    }
    return connections.get(schema)!;
  }

  if (!_dynamicDb) {
    _dynamicDb = makeDynamicWrappedSql();
  }
  return _dynamicDb;
}

export function getPublicDb(): WrappedSql {
  if (!_publicSql) {
    _publicSql = makeWrappedSql("public");
  }
  return _publicSql;
}
