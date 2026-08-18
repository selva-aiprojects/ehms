import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
const enums = await sql`
  SELECT t.typname, e.enumlabel
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'viswa' AND t.typname IN ('bill_status', 'payment_status', 'payroll_status', 'asset_status', 'task_type')
  ORDER BY t.typname, e.enumsortorder;
`;
console.log("More Enums:", enums);
