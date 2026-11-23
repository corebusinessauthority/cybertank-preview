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
  const file = path.join(root, 'videos', `${sku}.mp4`);
  let size = 0;
  try { size = (await stat(file)).size; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (size < 1000) throw new Error(`Missing or incomplete preview video: ${sku}`);
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
  <link rel="stylesheet" href="../../style.css">
  <script type="module" src="../../site.js"></script>
</head>
<body data-page="detail" data-root="../../" data-sku="${pack.sku}">
  <header class="site-header">
    <a class="wordmark" href="../../" aria-label="CyberPets home"><span class="wordmark-orbit" aria-hidden="true"></span>CYBER<span>PETS</span></a>
    <span class="header-note">THE LIVING AQUARIUM COLLECTION</span>
  </header>
  <main class="detail-layout">
    <a class="back-link" href="../../">← All editions</a>
    <div class="detail-grid">
      <section aria-labelledby="pack-name">
        <div class="detail-heading"><p class="eyebrow">Edition preview</p><h1 id="pack-name"></h1></div>
        <div class="video-shell"><div id="pack-media"></div></div>
        <div class="detail-caption"><span>Footage from the desktop edition</span><span>Looping preview · No download</span></div>
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

const videoSource = path.join(root, 'videos');
await mkdir(path.join(out, 'videos'), { recursive: true });
for (const sku of skus)
  await copyFile(path.join(videoSource, `${sku}.mp4`), path.join(out, 'videos', `${sku}.mp4`));
console.log(`Built ${packs.length} pack routes and videos in ${out}`);

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
