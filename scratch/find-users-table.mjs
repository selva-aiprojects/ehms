import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

const tables = await sql`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'viswa' AND table_name LIKE '%user%'
`;
console.log("TABLES WITH 'user':", tables);

const userCols = await sql`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_schema = 'viswa' AND table_name = 'users'
  ORDER BY ordinal_position
`;
console.log("\nCOLUMNS of 'users':", userCols);

const users = await sql`SELECT * FROM viswa.users LIMIT 10`;
console.log("\nUSERS ROWS:");
console.log(users);
