const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_1a7yYFjHvwZJ@ep-snowy-resonance-a1z2z1u9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
async function run() {
  const props = await sql`SELECT id, name, vertical_type FROM properties`;
  console.log('Properties:', props);
  const units = await sql`SELECT id, unit_label, property_id FROM units LIMIT 5`;
  console.log('Units:', units);
}
run().catch(console.error);
