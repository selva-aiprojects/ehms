import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const envContent = readFileSync(ENV_PATH, "utf-8");
envContent.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
});

const sql = neon(process.env.DATABASE_URL);

async function updateName() {
  console.log("=== CHECKING & UPDATING PROPERTY NAMES ===");
  
  // 1. Check current properties in viswa
  const propsBefore = await sql.transaction([
    sql.query("SET search_path TO viswa, public"),
    sql.query("SELECT id, name, vertical_type FROM properties")
  ]);
  console.log("Current properties in viswa schema:", propsBefore[1]);

  // 2. Check current tenant workspaces in public.tenants
  const tenantsBefore = await sql.query("SELECT code, name, config FROM tenants WHERE code = 'VISWA'");
  console.log("Current tenant config in public.tenants:", JSON.stringify(tenantsBefore[0]?.config, null, 2));

  // 3. Update viswa.properties
  const updateProp = await sql.transaction([
    sql.query("SET search_path TO viswa, public"),
    sql.query(`
      UPDATE properties 
      SET name = 'Viswa Residency by Azalea', updated_at = now() 
      WHERE id = 'dbef5ad0-5ac3-42a9-b5da-94175977c78e' OR name ILIKE '%VISWA RESIDENCY%'
      RETURNING id, name
    `)
  ]);
  console.log("Updated properties in viswa schema:", updateProp[1]);

  // 4. Update public.tenants config.workspaces
  if (tenantsBefore[0] && tenantsBefore[0].config) {
    const config = tenantsBefore[0].config;
    if (Array.isArray(config.workspaces)) {
      config.workspaces = config.workspaces.map(w => {
        if (w.name && w.name.toUpperCase().includes("RESIDENCY")) {
          return { ...w, name: "Viswa Residency by Azalea" };
        }
        return w;
      });

      await sql.query("UPDATE tenants SET config = $1::jsonb, updated_at = now() WHERE code = 'VISWA'", [JSON.stringify(config)]);
      console.log("Updated public.tenants config.workspaces successfully!");
    }
  }

  // 5. Verify both
  const propsAfter = await sql.transaction([
    sql.query("SET search_path TO viswa, public"),
    sql.query("SELECT id, name, vertical_type FROM properties")
  ]);
  console.log("\nVerified properties in viswa schema:", propsAfter[1]);

  const tenantsAfter = await sql.query("SELECT code, name, config FROM tenants WHERE code = 'VISWA'");
  console.log("Verified tenant config in public.tenants:", JSON.stringify(tenantsAfter[0]?.config?.workspaces, null, 2));
}

updateName().catch(err => {
  console.error("Update failed:", err);
  process.exit(1);
});
