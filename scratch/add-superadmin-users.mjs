/**
 * add-superadmin-users.mjs
 *
 * Adds two new super_admin users to the viswa schema:
 *   - raghu.superadmin@ehms.demo
 *   - viswa.superadmin@ehms.demo
 *
 * Password: Demo@1234
 */
import { neon } from "@neondatabase/serverless";
import fs from "fs";

const envText = fs.readFileSync(".env.local", "utf8");
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
if (!dbUrlMatch) {
  console.error("No DATABASE_URL found in .env.local");
  process.exit(1);
}
const sql = neon(dbUrlMatch[1]);

function randomUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const newUsers = [
  { email: "raghu.superadmin@ehms.demo", fn: "Raghu", ln: "Superadmin", role: "super_admin" },
  { email: "viswa.superadmin@ehms.demo", fn: "Viswa", ln: "Superadmin", role: "super_admin" },
];

async function run() {
  console.log("=== Adding new super_admin users to viswa schema ===\n");

  for (const u of newUsers) {
    // Check if user already exists
    const existing = await sql`
      SELECT id FROM viswa.users WHERE email = ${u.email}
    `;

    if (existing.length > 0) {
      console.log(`⚠️  User already exists, skipping: ${u.email}`);
      continue;
    }

    const uid = randomUUID();

    // Insert user
    await sql`
      INSERT INTO viswa.users (id, email, phone, password_hash, first_name, last_name, is_active)
      VALUES (
        ${uid},
        ${u.email},
        '+91-9000000000',
        crypt('Demo@1234', gen_salt('bf')),
        ${u.fn},
        ${u.ln},
        true
      )
    `;

    // Assign super_admin role with NULL property_id (global access)
    await sql`
      INSERT INTO viswa.user_roles (id, user_id, role_id, property_id)
      SELECT ${randomUUID()}, ${uid}, r.id, NULL
      FROM viswa.roles r WHERE r.name = 'super_admin'
    `;

    console.log(`✓ Created user: ${u.email} (${u.fn} ${u.ln}) → role: super_admin`);
  }

  // Verify
  console.log("\n=== Verifying super_admin users in viswa schema ===");
  const admins = await sql`
    SELECT u.email, u.first_name, u.last_name, u.is_active, r.name AS role
    FROM viswa.users u
    JOIN viswa.user_roles ur ON ur.user_id = u.id
    JOIN viswa.roles r ON r.id = ur.role_id
    WHERE r.name = 'super_admin'
    ORDER BY u.created_at
  `;

  console.log("\nAll super_admin accounts:");
  admins.forEach((a) =>
    console.log(
      `  • ${a.email} (${a.first_name} ${a.last_name}) — active: ${a.is_active}`
    )
  );

  console.log("\n✅ Done.");
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
