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
      // Look for patterns like `$${` or `$` before a number or `$ ` inside JSX strings
      if (content.includes('$${') || content.match(/\$\d/) || content.includes('($)')) {
        results.push(full);
      }
    }
  }
  return results;
}

const files = scanDir('app/dashboard');
console.log(`Found ${files.length} files containing UI currency $ patterns:`);
for (const f of files) {
  console.log(' - ' + f);
}
