import { neon } from "../node_modules/@neondatabase/serverless/index.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Manually parse .env.local
const envPath = join(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length) process.env[k.trim()] = v.join("=").trim();
}

const sql = neon(process.env.DATABASE_URL);

async function fixBroadcasts() {
  console.log("Checking current broadcasts...");
  const all = await sql`SELECT id, title, created_at FROM public.platform_broadcasts ORDER BY title, created_at`;
  console.log(`Total broadcasts: ${all.length}`);
  all.forEach(b => console.log(`  - ${b.title} (${b.created_at})`));

  // Delete duplicates, keep oldest per title
  const deleted = await sql`
    DELETE FROM public.platform_broadcasts
    WHERE id NOT IN (
      SELECT DISTINCT ON (title) id
      FROM public.platform_broadcasts
      ORDER BY title, created_at ASC
    )
    RETURNING title
  `;
  console.log(`\nDeleted ${deleted.length} duplicate broadcasts:`);
  deleted.forEach(b => console.log(`  - ${b.title}`));

  // Add unique constraint
  try {
    await sql`ALTER TABLE public.platform_broadcasts ADD CONSTRAINT uq_broadcast_title UNIQUE (title)`;
    console.log("\nUnique constraint on title added.");
  } catch (e) {
    if (e.message && e.message.includes("already exists")) {
      console.log("\nUnique constraint already exists.");
    } else {
      throw e;
    }
  }

  const remaining = await sql`SELECT title FROM public.platform_broadcasts ORDER BY created_at`;
  console.log(`\nRemaining broadcasts (${remaining.length}):`);
  remaining.forEach(b => console.log(`  ✓ ${b.title}`));
}

fixBroadcasts().catch(console.error);
