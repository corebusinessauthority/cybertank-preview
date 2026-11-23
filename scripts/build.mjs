import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
const itch = path.join(out, 'itch');
await mkdir(itch, { recursive: true });
const files = [
  [path.join(root, 'src/app.js'), path.join(out, 'app.js')],
  [path.join(root, 'src/index.html'), path.join(out, 'index.html')],
  [path.join(root, 'src/embed.html'), path.join(itch, 'index.html')],
  [path.join(root, 'src/style.css'), path.join(out, 'style.css')],
  [path.join(root, 'assets/metal.jpg'), path.join(out, 'metal.jpg')],
];
for (const [source, destination] of files) await copyFile(source, destination);
await mkdir(path.join(out, 'vendor'), { recursive: true });
await mkdir(path.join(itch, 'vendor'), { recursive: true });
for (const name of ['three.core.js', 'three.module.js']) {
  await copyFile(path.join(root, 'vendor', name), path.join(out, 'vendor', name));
  await copyFile(path.join(root, 'vendor', name), path.join(itch, 'vendor', name));
}
await copyFile(path.join(root, 'vendor', 'LICENSE'), path.join(out, 'vendor', 'LICENSE'));
await copyFile(path.join(root, 'vendor', 'LICENSE'), path.join(itch, 'vendor', 'LICENSE'));
for (const name of ['app.js', 'style.css', 'metal.jpg']) {
  await copyFile(path.join(out, name), path.join(itch, name));
}
await writeFile(path.join(out, '.nojekyll'), '');
console.log(`Built GitHub Pages site in ${out}`);
console.log(`Built itch.io HTML5 upload in ${itch}`);
