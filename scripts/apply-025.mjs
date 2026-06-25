import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const envContent = readFileSync(ENV_PATH, "utf-8");
const DB_URL = envContent.split("\n").find(l => l.startsWith("DATABASE_URL="))?.slice("DATABASE_URL=".length);
if (!DB_URL) { console.error("No DATABASE_URL"); process.exit(1); }

const sql = neon(DB_URL);
await sql`SET search_path TO viswa, public`;

const result = await sql`
UPDATE properties SET config = jsonb_set(COALESCE(config, '{}'), '{features}',
  '{
    "rooms_map":     {"enabled": true,  "label": "Rooms Map"},
    "rate_card":     {"enabled": true,  "label": "Rate Card"},
    "restaurant":    {"enabled": false, "label": "Restaurant"},
    "bar":           {"enabled": false, "label": "Bar"},
    "laundry":       {"enabled": true,  "label": "Laundry"},
    "maintenance":   {"enabled": true,  "label": "Maintenance"},
    "gym":           {"enabled": false, "label": "Gym"},
    "yoga":          {"enabled": false, "label": "Yoga"},
    "swimming_pool": {"enabled": false, "label": "Swimming Pool"},
    "spa":           {"enabled": false, "label": "Spa"}
  }'::jsonb
)
WHERE config IS NULL OR config = '{}' OR NOT (config ? 'features')
RETURNING id, name
`;
console.log(`Updated ${result.length} properties:`);
for (const r of result) console.log(`  ${r.name} (${r.id})`);
process.exit(0);
