import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
const packs = JSON.parse(await readFile(path.join(root, 'packs.json'), 'utf8'));
const skus = new Set();
for (const pack of packs) {
  if (!/^[a-z0-9-]+$/.test(pack.sku) || skus.has(pack.sku)) throw new Error(`Invalid or duplicate SKU: ${pack.sku}`);
  skus.add(pack.sku);
}
for (const sku of skus) {
  for (const [directory, extension, minimum] of [['videos', 'mp4', 1000], ['posters', 'jpg', 500]]) {
    const file = path.join(root, directory, `${sku}.${extension}`);
    let size = 0;
    try { size = (await stat(file)).size; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (size < minimum) throw new Error(`Missing or incomplete ${directory} media: ${sku}`);
  }
}

await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, 'packs'), { recursive: true });
for (const name of ['index.html', 'style.css', 'site.js', 'packs.json'])
  await copyFile(path.join(root, name), path.join(out, name));
await writeFile(path.join(out, '.nojekyll'), '');

for (const pack of packs) {
  const directory = path.join(out, 'packs', pack.sku);
  await mkdir(directory, { recursive: true });
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#080a10">
  <meta name="description" content="Watch the ${escapeHtml(pack.name)} edition of CyberPets in motion.">
  <title>${escapeHtml(pack.name)} · CyberPets preview</title>
  <link rel="stylesheet" href="../../style.css?v=68">
  <script type="module" src="../../site.js?v=68"></script>
</head>
<body data-page="detail" data-root="../../" data-sku="${pack.sku}">
  <header class="site-header">
    <a class="wordmark" href="../../" aria-label="CyberPets home"><svg class="wordmark-icon" viewBox="0 0 100 100" aria-hidden="true"><path class="wordmark-spikes" d="M50 5 55 16 65 8 66 21 78 16 76 29 90 28 84 40 97 45 86 52 95 62 82 64 86 78 73 75 69 89 58 81 50 96 43 82 31 90 29 76 15 79 19 65 5 61 14 51 3 44 16 39 10 26 24 28 23 15 35 20 40 7 48 17Z"/><circle class="wordmark-core" cx="50" cy="50" r="31"/><path class="wordmark-eye" d="M27 51Q50 31 73 51Q50 70 27 51Z"/><circle class="wordmark-iris" cx="50" cy="51" r="10"/><circle class="wordmark-pupil" cx="50" cy="51" r="4"/></svg>CYBER<span>PETS</span></a>
  </header>
  <main class="detail-layout">
    <a class="back-link" href="../../">← All editions</a>
    <div class="detail-grid">
      <section aria-labelledby="pack-name">
        <div class="detail-heading"><p class="eyebrow">Edition preview</p><h1 id="pack-name"></h1></div>
        <div class="video-shell"><div id="pack-media"></div></div>
        <div class="detail-caption"><span>Footage from the desktop edition</span><span>Looping preview · No download</span></div>
        <div class="included"><h2>Included in this edition</h2><div class="included-grid" id="pack-contents"></div></div>
      </section>
      <aside class="detail-side"><div id="pack-art"></div><p class="detail-description" id="pack-description"></p><p class="detail-note" id="pack-note"></p><a class="detail-action" href="../../">Explore another edition</a></aside>
    </div>
  </main>
  <footer class="site-footer"><span>CYBERPETS</span><span>Visual previews · No downloads on this site</span></footer>
</body>
</html>`;
  await writeFile(path.join(directory, 'index.html'), html);
  // GitHub Pages can also be configured to serve main/(root). Keep these
  // generated entry points in the repository so either Pages source works.
  const sourceDirectory = path.join(root, 'packs', pack.sku);
  await mkdir(sourceDirectory, { recursive: true });
  await writeFile(path.join(sourceDirectory, 'index.html'), html);
}

for (const [directory, extension] of [['videos', 'mp4'], ['posters', 'jpg']]) {
  await mkdir(path.join(out, directory), { recursive: true });
  for (const sku of skus)
    await copyFile(path.join(root, directory, `${sku}.${extension}`), path.join(out, directory, `${sku}.${extension}`));
}
console.log(`Built ${packs.length} pack routes, videos, and native posters in ${out}`);

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
