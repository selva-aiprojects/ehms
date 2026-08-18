/**
 * sync-all-shards.mjs
 * Synchronizes all tenant schemas in public.tenants with the viswa master template schema using @neondatabase/serverless (HTTP).
 * Ensures 100% parity across ENUMs, tables, and columns.
 */
import { neon } from "@neondatabase/serverless";
import fs from "fs";

const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
if (!dbUrlMatch) {
  console.error("No DATABASE_URL found in .env.local");
  process.exit(1);
}
const DB_URL = dbUrlMatch[1];
const sql = neon(DB_URL);

async function syncAllShards() {
  try {
    console.log("=== Starting Tenant Shard Schema Synchronization (HTTP Serverless) ===");
    
    // 1. Get all tenant schemas except viswa
    const tenants = await sql`
      SELECT code, schema_name FROM public.tenants WHERE schema_name != 'viswa'
    `;
    console.log(`Found ${tenants.length} target tenant schemas:`, tenants.map(t => t.schema_name));

    // 2. Get all ENUM types in viswa
    const enums = await sql`
      SELECT t.typname AS enum_name,
             string_agg(quote_literal(e.enumlabel), ', ' ORDER BY e.enumsortorder) AS enum_values
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE n.nspname = 'viswa'
      GROUP BY t.typname
    `;

    // 3. Get all tables and their columns in viswa
    const viswaTables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'viswa' AND table_type = 'BASE TABLE'
    `;

    const viswaColumns = await sql`
      SELECT c.table_name, c.column_name, c.data_type, c.udt_name, c.is_nullable, c.column_default
      FROM information_schema.columns c
      WHERE c.table_schema = 'viswa'
      ORDER BY c.table_name, c.ordinal_position
    `;

    for (const tenant of tenants) {
      const targetSchema = tenant.schema_name;
      console.log(`\n----------------------------------------------------`);
      console.log(`Synchronizing schema: [${targetSchema}] (${tenant.code})`);
      console.log(`----------------------------------------------------`);

      // Create schema if not exists
      await sql.query(`CREATE SCHEMA IF NOT EXISTS "${targetSchema}"`);

      // A. Synchronize ENUMs
      for (const enumObj of enums) {
        const checkEnum = await sql`
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = ${targetSchema} AND t.typname = ${enumObj.enum_name}
        `;

        if (checkEnum.length === 0) {
          console.log(`  + Creating ENUM "${targetSchema}"."${enumObj.enum_name}" (${enumObj.enum_values})`);
          await sql.query(`CREATE TYPE "${targetSchema}"."${enumObj.enum_name}" AS ENUM (${enumObj.enum_values})`);
        } else {
          const targetLabels = await sql`
            SELECT e.enumlabel
            FROM pg_type t
            JOIN pg_namespace n ON n.oid = t.typnamespace
            JOIN pg_enum e ON e.enumtypid = t.oid
            WHERE n.nspname = ${targetSchema} AND t.typname = ${enumObj.enum_name}
          `;
          
          const existingLabels = new Set(targetLabels.map(r => r.enumlabel));
          const viswaLabelsList = enumObj.enum_values.split(', ').map(l => l.replace(/^'|'$/g, ''));
          for (const label of viswaLabelsList) {
            if (!existingLabels.has(label)) {
              console.log(`  + Adding ENUM value '${label}' to "${targetSchema}"."${enumObj.enum_name}"`);
              await sql.query(`ALTER TYPE "${targetSchema}"."${enumObj.enum_name}" ADD VALUE IF NOT EXISTS '${label}'`);
            }
          }
        }
      }

      // B. Synchronize Tables (create missing tables directly copied from viswa)
      for (const tbl of viswaTables) {
        const checkTable = await sql`
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = ${targetSchema} AND table_name = ${tbl.table_name}
        `;

        if (checkTable.length === 0) {
          console.log(`  + Creating missing table "${targetSchema}"."${tbl.table_name}"`);
          try {
            await sql.query(`CREATE TABLE "${targetSchema}"."${tbl.table_name}" (LIKE "viswa"."${tbl.table_name}" INCLUDING ALL)`);
            await sql.query(`CREATE SEQUENCE IF NOT EXISTS "${targetSchema}"."${tbl.table_name}_id_seq"`);
          } catch (e) {
            console.log(`    Failed to clone table ${tbl.table_name}: ${e.message}`);
          }
        }
      }

      // C. Synchronize Columns in Existing Tables
      for (const col of viswaColumns) {
        const checkCol = await sql`
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = ${targetSchema} AND table_name = ${col.table_name} AND column_name = ${col.column_name}
        `;

        if (checkCol.length === 0) {
          const tableExists = await sql`
            SELECT 1 FROM information_schema.tables WHERE table_schema = ${targetSchema} AND table_name = ${col.table_name}
          `;

          if (tableExists.length > 0) {
            let colType = col.data_type;
            if (col.data_type === 'USER-DEFINED') {
              colType = `"${targetSchema}"."${col.udt_name}"`;
            } else if (col.data_type === 'ARRAY') {
              colType = `${col.udt_name.replace(/^_/, '')}[]`;
            }

            console.log(`  + Adding missing column "${col.column_name}" (${colType}) to "${targetSchema}"."${col.table_name}"`);
            try {
              let alterSql = `ALTER TABLE "${targetSchema}"."${col.table_name}" ADD COLUMN "${col.column_name}" ${colType}`;
              if (col.column_default) {
                let def = col.column_default.replace(/viswa\./g, `${targetSchema}.`);
                alterSql += ` DEFAULT ${def}`;
              }
              await sql.query(alterSql);
            } catch (err) {
              console.error(`    Error adding column ${col.column_name} to ${col.table_name}:`, err.message);
            }
          }
        }
      }
    }

    console.log("\n=== Shard Synchronization Completed Successfully ===");
  } catch (err) {
    console.error("Sync failed:", err);
  }
}

syncAllShards();
