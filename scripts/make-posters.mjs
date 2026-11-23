import { mkdir, readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Posters are actual frames from native C++ clips, never illustrative
// substitutes. Use a landscape display frame; the catalog never squeezes a
// square gameplay crop into a narrow card again.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packs = JSON.parse(await readFile(path.join(root, 'packs.json'), 'utf8'));
await mkdir(path.join(root, 'posters'), { recursive: true });
let created = 0;
for (const pack of packs) {
  if (pack.preview === 'components') continue;
  const tank = pack.category === 'tank';
  const twins = pack.sku.startsWith('spikeball-twins');
  const crop = tank ? null : twins ? [580, 363] : pack.sku.startsWith('snake') ? [400, 250] : [360, 225];
  const time = tank ? '3' : '1.5';
  const output = path.join(root, 'posters', `${pack.sku}.jpg`);
  const command = [
    '-hide_banner', '-loglevel', 'error', '-ss', time,
    '-i', path.join(root, 'videos', `${pack.sku}.mp4`),
    '-frames:v', '1', '-vf', crop
      ? `crop=${crop[0]}:${crop[1]}:(iw-${crop[0]})/2:(ih-${crop[1]})/2,scale=800:500:flags=lanczos`
      : 'scale=800:500:force_original_aspect_ratio=decrease:flags=lanczos,pad=800:500:(ow-iw)/2:(oh-ih)/2',
    '-q:v', '3', '-y', output,
  ];
  const result = spawnSync('ffmpeg', command, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${pack.sku}: ${result.stderr}`);
  if ((await stat(output)).size < 500) throw new Error(`Empty poster: ${pack.sku}`);
  created++;
}
console.log(`Created ${created} posters from native preview videos.`);
