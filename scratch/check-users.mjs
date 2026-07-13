import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
for (const t of ['users', 'roles', 'user_roles']) {
  const count = await sql`SELECT count(*) as c FROM viswa.${sql.unsafe(t)}`;
  console.log(`${t} count:`, count[0].c);
}
