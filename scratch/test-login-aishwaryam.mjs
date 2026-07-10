import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const content = readFileSync(envPath, "utf-8");
let dbUrl = "";

for (const line of content.split("\n")) {
  const t = line.trim();
  if (t.startsWith("DATABASE_URL=")) {
    dbUrl = t.slice("DATABASE_URL=".length).replace(/['"]/g, "");
  }
}

const sql = neon(dbUrl);

async function testLogin() {
  console.log("--- 1. Testing Exact Query from Login Route ---");
  const emailInput = "Balaji.superadmin@ehms.com";
  const lowerEmail = emailInput.toLowerCase();
  
  const exactMatch = await sql.query(`
    SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name,
           r.id AS role_id, r.name AS role_name
    FROM aishwaryam.users u
    JOIN aishwaryam.user_roles ur ON ur.user_id = u.id
    JOIN aishwaryam.roles r ON r.id = ur.role_id
    WHERE u.email = $1 AND u.is_active = true
  `, [lowerEmail]);
  console.log(`Query with u.email = '${lowerEmail}': found ${exactMatch.length} rows`);

  const ilikeMatch = await sql.query(`
    SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name,
           r.id AS role_id, r.name AS role_name
    FROM aishwaryam.users u
    JOIN aishwaryam.user_roles ur ON ur.user_id = u.id
    JOIN aishwaryam.roles r ON r.id = ur.role_id
    WHERE LOWER(u.email) = $1 AND u.is_active = true
  `, [lowerEmail]);
  console.log(`Query with LOWER(u.email) = '${lowerEmail}': found ${ilikeMatch.length} rows`);

  if (ilikeMatch.length > 0) {
    const user = ilikeMatch[0];
    console.log("User details:", user);
    const pwdOk = await bcrypt.compare("Demo@1234", user.password_hash);
    console.log(`Password 'Demo@1234' matches hash? ${pwdOk}`);

    console.log("--- 2. Fixing Email Case in Database ---");
    await sql.query(`UPDATE aishwaryam.users SET email = LOWER(email) WHERE id = $1`, [user.id]);
    console.log("✅ Updated email to lowercase in database!");
  }
}

testLogin();
