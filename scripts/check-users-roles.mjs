import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const content = readFileSync(ENV_PATH, "utf-8");
let dbUrl = "";

for (const line of content.split("\n")) {
  const t = line.trim();
  if (t.startsWith("DATABASE_URL=")) {
    dbUrl = t.slice("DATABASE_URL=".length).replace(/['"]/g, "");
  }
}

if (!dbUrl) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

const DEMO_EMAILS = [
  "superadmin@ehms.demo",
  "admin@ehms.demo",
  "executive@ehms.demo",
  "frontdesk@ehms.demo",
  "housekeeping@ehms.demo",
  "maintenance@ehms.demo",
  "hr@ehms.demo",
  "finance@ehms.demo"
];

async function checkUsers() {
  try {
    console.log("=== Checking Viswa Group of Estates Demo Credentials (viswa schema) ===");
    
    for (const email of DEMO_EMAILS) {
      // Qualify tables with viswa. schema to avoid serverless search_path issues
      const rows = await sql`
        SELECT
          u.id, u.email, u.password_hash, u.first_name, u.last_name, u.is_active,
          r.name AS role_name
        FROM viswa.users u
        LEFT JOIN viswa.user_roles ur ON ur.user_id = u.id
        LEFT JOIN viswa.roles r ON r.id = ur.role_id
        WHERE u.email = ${email}
      `;

      if (rows.length === 0) {
        console.log(`❌ ${email}: NOT FOUND in database`);
      } else {
        const user = rows[0];
        const isMatched = await bcrypt.compare("Demo@1234", user.password_hash);
        console.log(`✅ ${user.email.padEnd(24)} | Role: ${(user.role_name || "NONE").padEnd(20)} | Active: ${user.is_active} | Pwd (Demo@1234): ${isMatched ? "MATCH" : "FAIL"}`);
      }
    }
  } catch (err) {
    console.error("Error executing query:", err);
  }
}

checkUsers();
