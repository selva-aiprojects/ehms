import fs from "fs";

const files = [
  'app/dashboard/inventory/items/page.tsx',
  'app/dashboard/inventory/page.tsx',
  'app/dashboard/maintenance/parts/page.tsx'
];

for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  console.log(`\n=== ${f} ===`);
  lines.forEach((l, idx) => {
    if (l.includes('$${') || l.match(/\$\d/) || l.includes('($)')) {
      console.log(`${idx + 1}: ${l.trim()}`);
    }
  });
}
