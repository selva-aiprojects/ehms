import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

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
    console.log("=== Querying Tenants ===");
    const tenants = await sql`SELECT * FROM public.tenants`;
    console.log("Tenants found:", tenants);

    const vivaTenant = tenants.find(t => t.name.toLowerCase().includes("viva") || t.code.toLowerCase().includes("viva"));
    if (!vivaTenant) {
      console.log("No tenant containing 'viva' found.");
      return;
    }

    console.log(`\nFound tenant:`, vivaTenant);
    const schema = vivaTenant.schema_name;
    
    console.log(`\n=== Users in schema "${schema}" ===`);
    // Query users and their roles
    const users = await sql.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, u.password_hash, r.name as role_name
      FROM viva.users u
      LEFT JOIN viva.user_roles ur ON u.id = ur.user_id
      LEFT JOIN viva.roles r ON ur.role_id = r.id
    `);
    
    console.log("Users and roles:");
    const bcrypt = await import("bcryptjs").then(m => m.default || m);
    for (const u of users) {
      console.log(`- ${u.email} (${u.first_name} ${u.last_name}) | Role: ${u.role_name} | Active: ${u.is_active}`);
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
        "Balaji@1234",
        "Hari@1234",
        "Hari@123"
      ];
      let matched = null;
      for (const p of passwordsToTest) {
        if (await bcrypt.compare(p, u.password_hash)) {
          matched = p;
          break;
        }
      }
      if (matched) {
        console.log(`  Password matched: "${matched}"`);
      } else {
        console.log(`  No common password matched. Hash: ${u.password_hash}`);
      }
    }
  } catch (err) {
    console.error("Error executing query:", err);
  }
}

run();
