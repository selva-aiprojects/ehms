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

/**
 * Flatten a Neon tagged-template query into a raw {text, values} suitable for sql.query().
 * Recursively inlines nested NeonQueryPromise objects (which Neon's transaction handler
 * does NOT flatten, causing "syntax error at or near $1" when nested templates are used).
 */
function flattenTaggedTemplate(strings: TemplateStringsArray, values: unknown[]): { text: string; params: unknown[] } {
  let text = '';
  const params: unknown[] = [];

  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      const val = values[i] as Record<string, unknown> | undefined;
      if (val && typeof val === 'object' && val.queryData) {
        // NeonQueryPromise from a nested tagged template — recursively flatten
        const nested = val.queryData as { strings: TemplateStringsArray; values: unknown[] };
        const inner = flattenTaggedTemplate(nested.strings, nested.values);
        text += inner.text;
        params.push(...inner.params);
      } else {
        params.push(val);
        text += `$${params.length}`;
      }
    }
  }

  return { text, params };
}

function makeThenableQuery(
  strings: TemplateStringsArray,
  values: unknown[],
  executeFn: (text: string, params: unknown[]) => Promise<Record<string, unknown>[]>
) {
  const obj = {
    queryData: { strings, values },
    then(onFulfilled?: (value: Record<string, unknown>[]) => any, onRejected?: (reason: any) => any) {
      const { text, params } = flattenTaggedTemplate(strings, values);
      return executeFn(text, params).then(onFulfilled, onRejected);
    },
    catch(onRejected?: (reason: any) => any) {
      return obj.then(undefined, onRejected);
    },
    finally(onFinally?: () => void) {
      return obj.then(
        (v: any) => { onFinally?.(); return v; },
        (e: any) => { onFinally?.(); throw e; }
      );
    }
  };
  return obj as unknown as Promise<Record<string, unknown>[]>;
}

function makeWrappedSql(schema: string): WrappedSql {
  const sql = neon(databaseUrl) as SqlFn;
  const setPathSQL = `SET search_path TO ${schema}, public`;

  const wrapped = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    return makeThenableQuery(strings, values, async (text, params) => {
      const results = await sql.transaction([
        sql.query(setPathSQL),
        sql.query(text, params),
      ]);
      return results[1] as Record<string, unknown>[];
    });
  }) as unknown as WrappedSql;

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

  const wrapped = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    return makeThenableQuery(strings, values, async (text, params) => {
      const schema = await resolveSchema();
      const setPathSQL = `SET search_path TO ${schema}, public`;
      const results = await sql.transaction([
        sql.query(setPathSQL),
        sql.query(text, params),
      ]);
      return results[1] as Record<string, unknown>[];
    });
  }) as unknown as WrappedSql;

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
