/* One-time migration: replace hardcoded Tailwind palette color classes with
   centralized design tokens (var(--color-*)) across app/ and components/.
   Run with: node scripts/tokenize-colors.mjs  (from project root) */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const NEUTRAL = ["slate", "gray", "zinc", "neutral", "stone"];
const DANGER = ["red", "rose"];
const WARNING = ["amber", "orange", "yellow"];
const SUCCESS = ["green", "emerald", "teal", "lime"];
const INFO = ["blue", "sky", "cyan"];
const BRAND = ["indigo", "violet", "purple", "fuchsia", "pink"];

function familyOf(c) {
  if (NEUTRAL.includes(c)) return "neutral";
  if (DANGER.includes(c)) return "danger";
  if (WARNING.includes(c)) return "warning";
  if (SUCCESS.includes(c)) return "success";
  if (INFO.includes(c)) return "info";
  if (BRAND.includes(c)) return "brand";
  return null;
}

const TOK = {
  neutral: { bg: "var(--color-light)", text: "var(--color-text)", muted: "var(--color-text-muted)", faint: "var(--color-text-faint)", border: "var(--color-border)", strong: "var(--color-border-strong)", white: "var(--color-white)" },
};

const SOFT = { danger: "color-danger", warning: "color-warning", success: "color-success", info: "color-info", brand: "color-navy" };
const SOLID = { danger: "color-danger", warning: "color-warning", success: "color-success", info: "color-info", brand: "color-navy" };
const DARK = { danger: "color-danger-dark", warning: "color-warning-dark", success: "color-success-dark", info: "color-info-dark", brand: "color-dark-navy" };

function rgbaOf(tokName, a) {
  const rgbVar = tokName.startsWith("color-") ? `--${tokName}-rgb` : tokName;
  return `rgba(var(${rgbVar}),${a})`;
}

function replaceToken(prop, family, shade) {
  const f = familyOf(family);
  const tok = (name) => `var(--${name})`;
  const shadeN = parseInt(shade, 10);
  const isSoft = shadeN <= 100;

  // ── background ──
  if (prop === "bg") {
    if (f === "neutral") {
      if (shadeN <= 100) return tok("color-light");
      if (shadeN === 200) return tok("color-border");
      return tok("color-border-strong");
    }
    if (isSoft) return rgbaOf(SOFT[f], 0.1);
    return tok(SOLID[f]);
  }

  // ── gradient stops ──
  if (prop === "from" || prop === "via" || prop === "to") {
    if (f === "neutral") return tok("color-dark-navy");
    if (shadeN >= 800) return tok(DARK[f]);
    return tok(SOLID[f]);
  }

  // ── text ──
  if (prop === "text" || prop === "placeholder" || prop === "fill" || prop === "stroke") {
    if (f === "neutral") {
      if (shadeN <= 200) return tok("color-white");
      if (shadeN <= 400) return tok("color-text-faint");
      if (shadeN <= 600) return tok("color-text-muted");
      return tok("color-text");
    }
    if (shadeN >= 800) return tok(DARK[f]);
    return tok(SOLID[f]);
  }

  // ── border / divide / ring / outline ──
  if (prop === "border" || prop === "divide" || prop === "ring" || prop === "outline") {
    if (f === "neutral") {
      if (shadeN <= 200) return tok("color-border");
      return tok("color-border-strong");
    }
    if (shadeN <= 400) return rgbaOf(SOFT[f], 0.3);
    return tok(SOLID[f]);
  }

  return null;
}

const PROP_RE = /(?:^|[\s:"'`])(bg|text|border|divide|ring|outline|fill|stroke|from|via|to|placeholder|accent|caret)-(slate|gray|zinc|neutral|stone|red|rose|amber|orange|yellow|green|emerald|teal|lime|blue|sky|cyan|indigo|violet|purple|fuchsia|pink)-([0-9]{2,3})(?=\/|[^a-z0-9-]|$)/g;

function processFile(file) {
  let src = fs.readFileSync(file, "utf8");
  const replaced = [];
  src = src.replace(PROP_RE, (match, prop, family, shade, offset, full) => {
    const rep = replaceToken(prop, family, shade);
    if (rep === null) return match;
    const cls = `${prop}-[${rep}]`;
    replaced.push(match + " -> " + cls);
    return match.replace(new RegExp(`${prop}-${family}-${shade}`), cls);
  });
  if (replaced.length === 0) return { file, count: 0, samples: [] };
  fs.writeFileSync(file, src);
  return { file: path.relative(ROOT, file), count: replaced.length, samples: replaced.slice(0, 3) };
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

const files = walk(path.join(ROOT, "app")).concat(walk(path.join(ROOT, "components")));
let total = 0;
for (const f of files) {
  const r = processFile(f);
  total += r.count;
  if (r.count > 0) console.log(`${r.count}\t${r.file}`);
}
console.log(`\nTOTAL replacements: ${total}`);
