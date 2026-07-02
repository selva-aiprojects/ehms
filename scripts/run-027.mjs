import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join, resolve, dirname } from "path";
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

function splitStatements(content) {
  const noComments = content.replace(/--.*$/gm, "").trim();
  const statements = [];
  let current = "";
  let inDollar = false;
  let dollarTag = "";
  let inSingleQuote = false;

  for (let i = 0; i < noComments.length; i++) {
    const ch = noComments[i];
    const next = noComments[i + 1] || "";

    if (ch === "'" && (i === 0 || noComments[i - 1] !== "\\")) {
      if (!inDollar) inSingleQuote = !inSingleQuote;
    }

    if (!inSingleQuote && !inDollar && ch === "$" && next === "$") {
      inDollar = true;
      dollarTag = "$$";
      current += ch + next;
      i++;
      continue;
    }

    if (!inSingleQuote && !inDollar && ch === "$") {
      let j = i + 1;
      while (j < noComments.length && /[a-zA-Z0-9_]/.test(noComments[j])) j++;
      if (j < noComments.length && noComments[j] === "$") {
        inDollar = true;
        dollarTag = noComments.slice(i, j + 1);
        current += dollarTag;
        i = j;
        continue;
      }
    }

    if (inDollar && noComments.startsWith(dollarTag, i)) {
      const endLen = dollarTag.length;
      current += dollarTag;
      i += endLen - 1;
      inDollar = false;
      dollarTag = "";
      continue;
    }

    if (!inDollar && !inSingleQuote && ch === ";") {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = "";
      continue;
    }

    current += ch;
  }

  const remaining = current.trim();
  if (remaining) statements.push(remaining);
  return statements;
}

async function run() {
  console.log("▶ Applying 027_platform_broadcasts.sql to public schema...");
  const sqlPath = join(__dirname, "../database/027_platform_broadcasts.sql");
  const content = readFileSync(sqlPath, "utf-8");
  const statements = splitStatements(content);

  for (const stmt of statements) {
    await sql.query(`SET search_path TO public`);
    await sql.query(`${stmt};`);
  }
  console.log("✅ 027_platform_broadcasts.sql applied successfully!");
}

run().catch(console.error);
