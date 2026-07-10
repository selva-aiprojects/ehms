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

async function fixAishwaryam() {
  console.log("1. Copying roles from viswa to aishwaryam...");
  await sql.query(`
    INSERT INTO aishwaryam.roles
    SELECT * FROM viswa.roles
    ON CONFLICT DO NOTHING
  `);
  
  const roles = await sql.query(`SELECT id, name FROM aishwaryam.roles`);
  console.log(`✅ Roles in aishwaryam now: ${roles.length}`);

  console.log("2. Finding Balaji.superadmin user...");
  const users = await sql.query(`SELECT id, email FROM aishwaryam.users WHERE email ILIKE '%balaji%' LIMIT 1`);
  if (users.length === 0) {
    console.log("❌ User Balaji not found!");
    return;
  }
  const user = users[0];
  console.log(`Found user: ${user.email} (${user.id})`);

  const superAdminRole = roles.find(r => r.name === 'super_admin');
  if (!superAdminRole) {
    console.log("❌ super_admin role not found!");
    return;
  }

  console.log("3. Assigning super_admin role...");
  const existing = await sql.query(`SELECT * FROM aishwaryam.user_roles WHERE user_id = $1`, [user.id]);
  if (existing.length === 0) {
    await sql.query(`
      INSERT INTO aishwaryam.user_roles (user_id, role_id)
      VALUES ($1, $2)
    `, [user.id, superAdminRole.id]);
  }
  console.log("✅ Role assigned successfully!");

  console.log("4. Updating password to Demo@1234...");
  const newHash = await bcrypt.hash("Demo@1234", 10);
  await sql.query(`
    UPDATE aishwaryam.users SET password_hash = $1 WHERE id = $2
  `, [newHash, user.id]);
  console.log("✅ Password updated to Demo@1234!");

  console.log("\n=== VERIFICATION ===");
  const verified = await sql.query(`
    SELECT u.email, u.first_name, u.is_active, r.name as role_name
    FROM aishwaryam.users u
    JOIN aishwaryam.user_roles ur ON ur.user_id = u.id
    JOIN aishwaryam.roles r ON r.id = ur.role_id
    WHERE u.id = $1
  `, [user.id]);
  console.log("Verified user with role:", verified);
}

fixAishwaryam();
