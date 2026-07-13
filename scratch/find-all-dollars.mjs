import fs from "fs";
import path from "path";

function scanDir(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      scanDir(full, results);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, idx) => {
        if (l.includes('$${') || l.includes('($)') || l.includes('DollarSign') || l.includes('$"') || l.includes("$'") || l.includes("'$") || l.includes('"$')) {
          results.push(`${full}:${idx + 1}: ${l.trim()}`);
        }
      });
    }
  }
  return results;
}

const found = scanDir('app/dashboard').concat(scanDir('components'));
console.log(`Found ${found.length} matches:`);
found.forEach(r => console.log(r));
