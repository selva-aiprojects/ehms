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

async function checkAishwaryam() {
  try {
    console.log("=== USERS IN SCHEMA: aishwaryam ===");
    const users = await sql`SELECT id, email, first_name, last_name, is_active, password_hash FROM aishwaryam.users`;
    console.log("Found users:", users.length);
    for (const u of users) {
      console.log(`\nUser: ${u.email} (${u.first_name} ${u.last_name}) | Active: ${u.is_active}`);
      const passwordsToTest = [
        "Demo@1234",
        "Balaji@123",
        "Aishwaryam@123",
        "admin@123",
        "password",
        "123456",
        "Ehms@1234",
        "Superadmin@123",
        "Welcome@123",
        "Balaji@1234"
      ];
      let matched = null;
      for (const p of passwordsToTest) {
        if (await bcrypt.compare(p, u.password_hash)) {
          matched = p;
          break;
        }
      }
      if (matched) {
        console.log(`✅ MATCHED PASSWORD: "${matched}"`);
      } else {
        console.log(`❌ None of the common passwords matched. Hash starts with: ${u.password_hash.slice(0, 15)}...`);
      }
    }
  } catch (err) {
    console.error("Error reading users from aishwaryam:", err);
  }
}

checkAishwaryam();
