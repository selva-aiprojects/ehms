import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
const [_, res] = await sql.transaction([
  sql.query(`SET search_path TO viswa, public`),
  sql.query(`SELECT id, name, code, vertical_type FROM properties`)
]);
console.log("properties:", res);
