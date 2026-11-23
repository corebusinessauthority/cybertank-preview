const root = document.body.dataset.root || './';
const page = document.body.dataset.page;
const sku = document.body.dataset.sku;

function kind(pack) {
  if (pack.category === 'bundle') return 'bundle';
  if (pack.assets.some(id => id.startsWith('tank.'))) return 'tank';
  if (pack.assets.some(id => id.startsWith('pet.snake'))) return 'snake';
  if (pack.assets.some(id => id.startsWith('pet.spikeball'))) return 'ball';
  return 'smile';
}

function accent(pack) {
  const name = pack.sku;
  const choices = [
    ['rose', '#f08da9'], ['pink', '#ff93d3'], ['violet', '#b99aff'],
    ['amber', '#ffc579'], ['orange', '#ff9a70'], ['yellow', '#ffe477'],
    ['lime', '#b7ed77'], ['green', '#7fe9ae'], ['blue', '#82baff'],
    ['cyan', '#79e4eb'], ['red', '#fc848b'], ['hue', '#e49bf6'],
    ['matrix', '#6be6a4'], ['plain', '#8ac9ed'],
  ];
  return choices.find(([word]) => name.includes(word))?.[1] || '#b9cedd';
}

function cardArt(pack) {
  const stage = document.createElement('div');
  stage.className = 'card-stage';
  stage.style.setProperty('--accent', accent(pack));
  const box = document.createElement('div');
  box.className = 'card-pack';
  const front = document.createElement('span');
  front.className = 'card-pack__front';
  const gallery = document.createElement('span');
  const pictured = picturedAssets(pack);
  gallery.className = `card-photos${pictured.length > 1 ? ' card-photos--mosaic' : ''}`;
  if (pictured.length > 12) gallery.classList.add('card-photos--many');
  for (const asset of pictured) {
    const photo = document.createElement('img');
    photo.src = `${root}posters/${encodeURIComponent(posterSku(asset))}.jpg`;
    photo.alt = assetName(asset);
    photo.loading = 'lazy';
    gallery.append(photo);
  }
  front.append(gallery);
  box.append(front);
  stage.append(box);
  return stage;
}

function posterSku(asset) {
  if (asset === 'tank.matrix') return 'matrix-tank';
  if (asset === 'tank.plain') return 'plain-tank';
  if (asset === 'tank.custom') return 'custom-color-tank';
  if (asset.startsWith('tank.')) {
    const [, color, shade] = asset.split('.');
    return `${color}-${shade}-tank`;
  }
  if (asset === 'pet.snake') return 'snake';
  if (asset === 'pet.snake.transparent_black') return 'snake-transparent-black';
  if (asset.startsWith('pet.snake.')) return `snake-${asset.slice('pet.snake.'.length).replaceAll('.', '-')}`;
  if (asset === 'pet.spikeball') return 'spikeball';
  if (asset === 'pet.spikeball.twin') return 'spikeball-twins';
  if (asset.startsWith('pet.spikeball.twins.')) return `spikeball-twins-${asset.slice('pet.spikeball.twins.'.length).replaceAll(/[._]/g, '-')}`;
  if (asset.startsWith('pet.smiley.')) return `smiley-${asset.slice('pet.smiley.'.length)}`;
  throw new Error(`No character picture for ${asset}`);
}

function picturedAssets(pack) {
  return pack.assets.filter(asset => asset.startsWith('tank.') || asset.startsWith('pet.'));
}

function assetName(asset) {
  return asset.replace(/^(tank|pet)\./, '').replaceAll(/[._]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function card(pack) {
  const link = document.createElement('a');
  link.className = 'pack-card';
  link.href = `${root}packs/${encodeURIComponent(pack.sku)}/`;
  link.setAttribute('aria-label', `Preview ${pack.name}`);
  link.style.setProperty('--accent', accent(pack));
  const body = document.createElement('div');
  body.className = 'pack-card__body';
  body.append(cardArt(pack));
  const label = document.createElement('span');
  label.className = 'pack-card__name';
  label.textContent = pack.name;
  body.append(label);
  link.append(body);
  link.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const bounds = link.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    body.style.setProperty('--tilt-x', `${(-y * 6).toFixed(1)}deg`);
    body.style.setProperty('--tilt-y', `${(x * 8).toFixed(1)}deg`);
  });
  link.addEventListener('pointerleave', () => {
    body.style.removeProperty('--tilt-x');
    body.style.removeProperty('--tilt-y');
  });
  return link;
}

async function getPacks() {
  const response = await fetch(`${root}packs.json`);
  if (!response.ok) throw new Error('The collection could not be loaded.');
  return response.json();
}

function renderCatalog(packs) {
  const grid = document.getElementById('card-grid');
  const count = document.getElementById('result-count');
  const buttons = [...document.querySelectorAll('.filter')];
  function apply(filter) {
    const shown = packs.filter(pack => filter === 'all' ||
      (filter === 'pet' ? kind(pack) === 'snake' || kind(pack) === 'ball' || kind(pack) === 'smile' :
        filter === 'tank' ? kind(pack) === 'tank' : pack.category === filter));
    grid.replaceChildren(...shown.map(card));
    if (count) count.textContent = `${shown.length} editions`;
    for (const button of buttons) {
      const selected = button.dataset.filter === filter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
  }
  buttons.forEach(button => button.addEventListener('click', () => apply(button.dataset.filter)));
  apply('all');
}

async function renderDetail(packs) {
  const pack = packs.find(item => item.sku === sku);
  if (!pack) throw new Error('This edition does not exist.');
  document.title = `${pack.name} · CyberPets preview`;
  document.getElementById('pack-name').textContent = pack.name;
  document.getElementById('pack-description').textContent = pack.description;
  document.getElementById('pack-note').textContent = pack.assets.some(id => id.startsWith('tank.'))
    ? 'Visual preview only. Purchases and downloads are handled separately.'
    : 'Creature shown in a demonstration Matrix tank. The tank is not included. Purchases and downloads are handled separately.';
  document.getElementById('pack-art').append(cardArt(pack));
  const contents = document.getElementById('pack-contents');
  if (contents) {
    for (const asset of picturedAssets(pack)) {
      const entry = document.createElement('figure');
      entry.className = 'included-item';
      const photo = document.createElement('img');
      photo.src = `${root}posters/${encodeURIComponent(posterSku(asset))}.jpg`;
      photo.alt = assetName(asset);
      photo.loading = 'lazy';
      const name = document.createElement('figcaption');
      name.textContent = assetName(asset);
      entry.append(photo, name);
      contents.append(entry);
    }
  }
  const media = document.getElementById('pack-media');
  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.controls = true;
  video.preload = 'metadata';
  video.setAttribute('aria-label', `${pack.name} gameplay preview`);
  const fallback = document.createElement('div');
  fallback.className = 'video-fallback';
  fallback.innerHTML = '<div><strong>Video preview in preparation</strong><span>Check back soon for this edition’s loop.</span></div>';
  video.addEventListener('error', () => media.replaceChildren(fallback), { once: true });
  video.src = `${root}videos/${encodeURIComponent(pack.sku)}.mp4`;
  media.append(video);
  video.play().catch(() => {});
}

getPacks().then(packs => page === 'catalog' ? renderCatalog(packs) : renderDetail(packs))
  .catch(error => {
    const target = document.getElementById(page === 'catalog' ? 'card-grid' : 'pack-media');
    if (target) target.textContent = error.message;
  });
