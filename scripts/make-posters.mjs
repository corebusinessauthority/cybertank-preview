import { mkdir, readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Posters are actual frames from the native C++ clips, never illustrative
// substitutes. Center crops match the capture camera's subject tracking.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packs = JSON.parse(await readFile(path.join(root, 'packs.json'), 'utf8'));
await mkdir(path.join(root, 'posters'), { recursive: true });
for (const pack of packs) {
  const tank = pack.category === 'tank';
  const group = pack.category === 'bundle' || pack.sku.startsWith('spikeball-twins');
  const crop = tank || group ? 540 : pack.sku.startsWith('snake') ? 330 : 280;
  const time = tank ? '3' : '1.5';
  const output = path.join(root, 'posters', `${pack.sku}.jpg`);
  const command = [
    '-hide_banner', '-loglevel', 'error', '-ss', time,
    '-i', path.join(root, 'videos', `${pack.sku}.mp4`),
    '-frames:v', '1', '-vf', `crop=${crop}:${crop}:(iw-${crop})/2:(ih-${crop})/2,scale=480:480:flags=lanczos`,
    '-q:v', '3', '-y', output,
  ];
  const result = spawnSync('ffmpeg', command, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${pack.sku}: ${result.stderr}`);
  if ((await stat(output)).size < 500) throw new Error(`Empty poster: ${pack.sku}`);
}
console.log(`Created ${packs.length} posters from native preview videos.`);
