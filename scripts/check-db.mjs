import fs from 'fs';
import pg from 'pg';

const localEnv = fs.readFileSync('.env.local', 'utf8');
const prodEnv = fs.readFileSync('.env.vercel.prod', 'utf8');

const localUrlMatch = localEnv.match(/DATABASE_URL=(.+)/);
const prodUrlMatch = prodEnv.match(/DATABASE_URL="?([^\r\n"]+)"?/);

const localUrl = localUrlMatch ? localUrlMatch[1].trim() : '';
const prodUrl = prodUrlMatch ? prodUrlMatch[1].trim() : '';

console.log('Local URL matches Prod URL:', localUrl === prodUrl);
if (localUrl !== prodUrl) {
  console.log('Local URL:', localUrl.slice(0, 50) + '...');
  console.log('Prod URL :', prodUrl.slice(0, 50) + '...');
}

const pool = new pg.Pool({ connectionString: prodUrl || localUrl });
const client = await pool.connect();
await client.query("SET search_path TO viswa, public");

const props = await client.query("SELECT id, code, name, vertical_type FROM properties");
console.log("\nProperties in 'viswa' schema:");
console.table(props.rows);

const units = await client.query("SELECT p.name as prop, bl.code as bldg, f.floor_number as floor, count(u.id) as rooms FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings bl ON f.building_id = bl.id JOIN properties p ON bl.property_id = p.id GROUP BY p.name, bl.code, f.floor_number ORDER BY p.name, bl.code, f.floor_number");
console.log("\nUnits in 'viswa' schema:");
console.table(units.rows);

await client.release();
await pool.end();
