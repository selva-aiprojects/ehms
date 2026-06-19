const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql`SELECT 1 as test`.then(r => console.log('Connected:', JSON.stringify(r))).catch(e => console.error('Error:', e.message));
