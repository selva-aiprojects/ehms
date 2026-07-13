import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");

function getEnvVar(name) {
  const envContent = readFileSync(ENV_PATH, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith(name + "=")) {
      return trimmed.slice(name.length + 1).trim();
    }
  }
  return "";
}

const DB_URL = getEnvVar("DATABASE_URL");
const pool = new pg.Pool({ connectionString: DB_URL, max: 1 });

async function main() {
  const client = await pool.connect();
  try {
    const schema = "lavista";
    
    // Check users in lavista schema
    const usersRes = await client.query(
      `SELECT id, email, first_name, last_name FROM ${schema}.users`
    );
    console.log("Users in LeVista schema:", JSON.stringify(usersRes.rows, null, 2));

    if (usersRes.rows.length === 0) {
      console.log("❌ No users found in LeVista schema!");
      return;
    }

    const admin = usersRes.rows[0];
    const newPass = "Demo@1234";
    const passwordHash = await bcrypt.hash(newPass, 10);

    // Update password
    await client.query(
      `UPDATE ${schema}.users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, admin.id]
    );

    console.log(`\n✅ Successfully reset password for "${admin.first_name}" (${admin.email})`);
    console.log(`🔑 Login Credentials:`);
    console.log(`   - Email:    ${admin.email}`);
    console.log(`   - Password: ${newPass}`);
    console.log(`   - Tenant Code: LEVISTA`);
  } catch (err) {
    console.error("Error resetting Levista password:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
