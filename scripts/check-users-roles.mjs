import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const content = readFileSync(ENV_PATH, "utf-8");
let dbUrl = "";

for (const line of content.split("\n")) {
  const t = line.trim();
  if (t.startsWith("DATABASE_URL=")) {
    dbUrl = t.slice("DATABASE_URL=".length).replace(/['"]/g, ""); // strip quotes if any
  }
}

if (!dbUrl) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

import bcrypt from "bcryptjs";

try {
  console.log("--- Login Query for superadmin@ehms.demo ---");
  const rows = await sql.query(`
    SELECT
      u.id, u.email, u.password_hash, u.first_name, u.last_name, u.avatar_url,
      r.id AS role_id, r.name AS role_name
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id
    JOIN roles r ON r.id = ur.role_id
    WHERE u.email = 'superadmin@ehms.demo' AND u.is_active = true
    ORDER BY r.name = 'super_admin' DESC
    LIMIT 1
  `);
  console.log(JSON.stringify(rows, null, 2));

  if (rows.length > 0) {
    const hash = rows[0].password_hash;
    const isMatched = await bcrypt.compare("Demo@1234", hash);
    console.log("Password match for 'Demo@1234':", isMatched);
  }
} catch (err) {
  console.error("Error executing query:", err);
}
