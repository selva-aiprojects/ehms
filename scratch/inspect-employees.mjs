import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

const columns = await sql`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_schema = 'viswa' AND table_name = 'employees'
  ORDER BY ordinal_position
`;
console.log("COLUMNS:");
console.log(columns);

const emps = await sql`SELECT * FROM viswa.employees LIMIT 10`;
console.log("\nROWS:");
console.log(emps);
