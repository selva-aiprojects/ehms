import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");

function getEnvVar(name) {
  const envContent = readFileSync(ENV_PATH, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith(name + "=")) {
      return trimmed.slice(name.length + 1);
    }
  }
  return "";
}

const DB_URL = getEnvVar("DATABASE_URL");
const sql = neon(DB_URL);

async function fixBroadcasts() {
  await sql.query("SET search_path TO public");

  console.log("=== Checking current broadcasts ===");
  const all = await sql.query("SELECT id, title, created_at FROM public.platform_broadcasts ORDER BY title, created_at");
  console.log(`Total broadcasts: ${all.length}`);
  all.forEach(b => console.log(`  - "${b.title}"`));

  // Delete duplicates: keep only the oldest row per title
  const deleted = await sql.query(`
    DELETE FROM public.platform_broadcasts
    WHERE id NOT IN (
      SELECT DISTINCT ON (title) id
      FROM public.platform_broadcasts
      ORDER BY title, created_at ASC
    )
    RETURNING title
  `);
  console.log(`\nDeleted ${deleted.length} duplicate(s)`);
  deleted.forEach(b => console.log(`  removed: "${b.title}"`));

  // Try to add unique constraint on title
  try {
    await sql.query("ALTER TABLE public.platform_broadcasts ADD CONSTRAINT uq_broadcast_title UNIQUE (title)");
    console.log("\n✅ Unique constraint 'uq_broadcast_title' added on platform_broadcasts.title");
  } catch (e) {
    if (e.message && e.message.includes("already exists")) {
      console.log("\n✓ Unique constraint already exists — no change needed");
    } else {
      console.warn("⚠ Could not add constraint:", e.message);
    }
  }

  const remaining = await sql.query("SELECT title FROM public.platform_broadcasts ORDER BY created_at");
  console.log(`\nFinal broadcasts (${remaining.length}):`);
  remaining.forEach(b => console.log(`  ✓ ${b.title}`));
  console.log("\n✅ Done! Dashboard should no longer show duplicate notification banners.");
}

fixBroadcasts().catch(console.error);
