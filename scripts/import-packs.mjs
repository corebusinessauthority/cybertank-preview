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
  const { sku, name, category, description, assets } = JSON.parse(raw);
  if (sku !== entry.name || !Array.isArray(assets)) throw new Error(`Invalid pack ${entry.name}`);
  packs.push({ sku, name, category, description, assets });
}
packs.sort((a, b) => a.name.localeCompare(b.name, 'en'));
await writeFile(path.join(root, 'packs.json'), `${JSON.stringify(packs, null, 2)}\n`);
console.log(`Imported ${packs.length} pack manifests.`);
