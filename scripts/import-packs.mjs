import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = process.argv[2];
if (!source) {
  console.error('Usage: node scripts/import-packs.mjs /path/to/AquariumNFT/packs');
  process.exit(2);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entries = await readdir(source, { withFileTypes: true });
const packs = [];
for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const raw = await readFile(path.join(source, entry.name, 'pack.json'), 'utf8');
  const { sku, name, category, description, assets, preview, for_sale } = JSON.parse(raw);
  if (sku !== entry.name || !Array.isArray(assets)) throw new Error(`Invalid pack ${entry.name}`);
  if (for_sale === false) continue;
  packs.push({ sku, name, category, description, assets, preview });
}
function tier(pack) {
  if (pack.sku.startsWith('trio-')) return 3;
  if (pack.category === 'bundle') return 0;
  return pack.category === 'addon' ? 1 : 2;
}
packs.sort((a, b) => tier(a) - tier(b) || a.name.localeCompare(b.name, 'en'));
await writeFile(path.join(root, 'packs.json'), `${JSON.stringify(packs, null, 2)}\n`);
console.log(`Imported ${packs.length} pack manifests.`);
