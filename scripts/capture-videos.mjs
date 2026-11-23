import { mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [productRoot, binary, ...options] = process.argv.slice(2);
if (!productRoot || !binary) {
  console.error('Usage: node scripts/capture-videos.mjs /path/to/AquariumNFT /path/to/LivingAquarium-full [--force] [--only=SKU]');
  process.exit(2);
}
const force = options.includes('--force');
const only = options.find(option => option.startsWith('--only='))?.slice(7);
const packs = JSON.parse(await readFile(path.join(root, 'packs.json'), 'utf8'));
const allAssets = [...new Set(packs.flatMap(pack => pack.assets))].sort();
const videoDirectory = path.join(root, 'videos');
await mkdir(videoDirectory, { recursive: true });
const expectedRawBytes = 960 * 540 * 3 * 144;

for (const [index, pack] of packs.entries()) {
  if (only && pack.sku !== only) continue;
  const video = path.join(videoDirectory, `${pack.sku}.mp4`);
  try { if (!force && (await stat(video)).size > 1000) { console.log(`[${index + 1}/${packs.length}] ${pack.sku}: already captured`); continue; } }
  catch (error) { if (error.code !== 'ENOENT') throw error; }

  const temporary = await mkdtemp(path.join(os.tmpdir(), 'cybertank-record-'));
  const raw = path.join(temporary, 'frames.rgb');
  try {
    await mkdir(path.join(temporary, 'bin'));
    await mkdir(path.join(temporary, 'config'));
    await symlink(binary, path.join(temporary, 'bin', 'LivingAquarium-full'));
    for (const directory of ['textures', 'assets', 'audio'])
      await symlink(path.join(productRoot, directory), path.join(temporary, directory));

    // Add-ons have no tank entitlement. The Matrix here is only a demo stage;
    // the public manifest/description remains the source of what's included.
    const enabled = new Set(pack.assets);
    if (![...enabled].some(id => id.startsWith('tank.'))) enabled.add('tank.matrix');
    const tank = enabled.has('tank.matrix') ? 0 : 1;
    const config = [
      'ACUARIO-SETTINGS-1', `tank ${tank}`, 'visible 1 1 1 1 1 1 1 1 1',
      'background 0 0 0', 'volume 0',
      ...allAssets.map(id => `asset ${id} ${enabled.has(id) ? 1 : 0}`),
      '',
    ].join('\n');
    await writeFile(path.join(temporary, 'config', 'settings.txt'), config);

    const captureEnv = { ...process.env, SDL_AUDIODRIVER: 'dummy', CYBERTANK_CAPTURE_FILE: raw, CYBERTANK_CAPTURE_SKU: pack.sku };
    delete captureEnv.WAYLAND_DISPLAY;
    const capture = spawnSync(path.join(temporary, 'bin', 'LivingAquarium-full'), [], {
      env: captureEnv,
      encoding: 'utf8', maxBuffer: 4 * 1024 * 1024,
    });
    if (capture.status !== 0) throw new Error(`C++ capture failed (${capture.status}): ${capture.stderr}`);
    if (options.includes('--debug')) console.log(capture.stderr);
    const bytes = (await stat(raw)).size;
    if (bytes !== expectedRawBytes) throw new Error(`Incomplete framebuffer: ${bytes} of ${expectedRawBytes} bytes`);

    const encode = spawnSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pixel_format', 'rgb24',
      '-video_size', '960x540', '-framerate', '24', '-i', raw,
      '-vf', 'vflip', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '25',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', video,
    ], { encoding: 'utf8' });
    if (encode.status !== 0) throw new Error(`Encoding failed: ${encode.stderr}`);
    console.log(`[${index + 1}/${packs.length}] ${pack.sku}: ${(await stat(video)).size} bytes`);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
