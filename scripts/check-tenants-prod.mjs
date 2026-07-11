import fs from 'fs';
import pg from 'pg';

const prodEnv = fs.readFileSync('.env.vercel.prod', 'utf8');
const prodUrlMatch = prodEnv.match(/DATABASE_URL="?([^\r\n"]+)"?/);
const prodUrl = prodUrlMatch ? prodUrlMatch[1].trim() : '';

const pool = new pg.Pool({ connectionString: prodUrl });
const client = await pool.connect();

const tenants = await client.query("SELECT id, name, code, schema_name, is_active FROM public.tenants");
console.log("Tenants in public.tenants:");
console.table(tenants.rows);

for (const t of tenants.rows) {
  try {
    await client.query(`SET search_path TO ${t.schema_name}, public`);
    const props = await client.query("SELECT id, code, name, vertical_type FROM properties");
    console.log(`\nProperties in schema '${t.schema_name}' (${t.code}):`);
    console.table(props.rows);
  } catch (e) {
    console.log(`Could not query schema '${t.schema_name}':`, e.message);
  }
}

await client.release();
await pool.end();
