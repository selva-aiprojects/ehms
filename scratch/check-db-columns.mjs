import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

async function check() {
  const tenants = await sql`SELECT code, schema_name FROM public.tenants WHERE schema_name != 'viswa'`;
  
  for (const t of tenants) {
    const s = t.schema_name;
    // Missing tables
    const missingTables = await sql`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'viswa' AND table_type = 'BASE TABLE'
      EXCEPT
      SELECT table_name FROM information_schema.tables WHERE table_schema = ${s} AND table_type = 'BASE TABLE'
    `;
    if (missingTables.length > 0) {
      console.log(`Schema [${s}] missing tables:`, missingTables.map(r => r.table_name));
    }

    // Missing columns in existing tables
    const missingCols = await sql`
      SELECT c1.table_name, c1.column_name, c1.data_type, c1.udt_name
      FROM information_schema.columns c1
      WHERE c1.table_schema = 'viswa'
      AND EXISTS (
        SELECT 1 FROM information_schema.tables t WHERE t.table_schema = ${s} AND t.table_name = c1.table_name
      )
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns c2
        WHERE c2.table_schema = ${s} AND c2.table_name = c1.table_name AND c2.column_name = c1.column_name
      )
      ORDER BY c1.table_name, c1.column_name;
    `;
    if (missingCols.length > 0) {
      console.log(`Schema [${s}] missing columns (${missingCols.length}):`, missingCols);
    }
  }
}

check().catch(console.error);
