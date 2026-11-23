import { readFile, writeFile } from 'node:fs/promises';

const file = new URL('../packs.json', import.meta.url);
const packs = JSON.parse(await readFile(file, 'utf8'));
const existing = new Set(packs.map(pack => pack.sku));
const colors = ['amber', 'blue', 'lime', 'rose', 'violet'];
const styles = [
  ['neon', 'Neon Glass Tank', 'A luminous animated tank with a neon-tinted moving wall atmosphere.'],
  ['pulse', 'Pulse Glass Tank', 'A dark animated tank with a slow pulse moving across its walls.'],
  ['aurora', 'Aurora Glass Tank', 'An animated tank with a soft aurora-like wall treatment.'],
];

for (const [style, label, description] of styles) {
  for (const color of colors) {
    const sku = `${style}-${color}-tank`;
    if (existing.has(sku)) continue;
    packs.push({
      sku,
      name: `${color[0].toUpperCase()}${color.slice(1)} ${label}`,
      category: 'tank',
      description: `${description} This ${color} edition is sold as a standalone tank.` ,
      assets: [`tank.${style}.${color}`],
    });
  }
}

for (const color of colors) {
  const sku = `cyber-tank-${color}`;
  if (existing.has(sku)) continue;
  packs.push({
    sku,
    name: `Cyber Tank — ${color[0].toUpperCase()}${color.slice(1)}`,
    category: 'tank',
      description: `The Cyber Tank in an ${color} color treatment, with its animated digital-wall atmosphere.`,
    assets: [`tank.cyber.${color}`],
  });
}

await writeFile(file, `${JSON.stringify(packs, null, 2)}\n`);
console.log(`Added ${packs.length - existing.size} animated tank variants; catalog now has ${packs.length} editions.`);
