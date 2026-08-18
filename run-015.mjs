import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    const file = join(__dirname, 'database/015-guest-feedback.sql');
    const content = readFileSync(file, 'utf-8');
    
    // Split by semicolons
    const noComments = content.replace(/--.*$/gm, "").trim();
    const stmts = noComments.split(";").map(s => s.trim()).filter(s => s.length > 0);
    
    console.log("Running", stmts.length, "statements...");
    for (const stmt of stmts) {
      await sql.query(stmt);
      console.log("Success");
    }
  } catch (err) {
    console.error("Failed:", err);
  }
}

run();
