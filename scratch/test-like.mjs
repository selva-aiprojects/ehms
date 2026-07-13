import { neon } from "@neondatabase/serverless";
import fs from "fs";

const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

async function testLike() {
  await sql.query(`CREATE SCHEMA IF NOT EXISTS test_like_schema`);
  await sql.query(`CREATE TABLE IF NOT EXISTS test_like_schema.units (LIKE viswa.units INCLUDING ALL)`);
  
  const cols = await sql`
    SELECT column_name, data_type, udt_schema, udt_name, column_default
    FROM information_schema.columns
    WHERE table_schema = 'test_like_schema' AND table_name = 'units'
  `;
  console.log("Columns of test_like_schema.units created via LIKE viswa.units INCLUDING ALL:");
  console.log(JSON.stringify(cols, null, 2));

  await sql.query(`DROP SCHEMA test_like_schema CASCADE`);
}

testLike().catch(console.error);
