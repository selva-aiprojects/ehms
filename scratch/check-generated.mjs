import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
const genCols = await sql`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='viswa' AND is_generated='ALWAYS'`;
console.log("All generated columns in viswa schema:", genCols);
