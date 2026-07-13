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

async function run() {
  try {
    console.log("=== Hashing New Password ===");
    const plainPassword = "Demo@1234";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainPassword, salt);
    console.log(`Generated hash for "${plainPassword}": ${hash}`);

    console.log("\n=== Updating Password in viva.users ===");
    const result = await sql.query(`
      UPDATE viva.users
      SET password_hash = $1
      WHERE email = 's.haribabu@gmail.com'
      RETURNING id, email, first_name
    `, [hash]);

    console.log("Update result:", result);
    
    // Verify
    const updatedUser = await sql.query("SELECT email, password_hash FROM viva.users WHERE email = 's.haribabu@gmail.com'");
    console.log("Verified database record:", updatedUser);
    const isMatch = await bcrypt.compare(plainPassword, updatedUser[0].password_hash);
    console.log(`Verification match: ${isMatch ? "SUCCESS" : "FAILED"}`);

  } catch (err) {
    console.error("Error updating password:", err);
  }
}

run();
