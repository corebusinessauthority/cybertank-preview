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
  const gallery = document.createElement('span');
  if (pack.sku === 'smiley-hue') {
    gallery.className = 'card-photos card-photos--hue';
    for (let frame = 1; frame <= 4; frame++) {
      const photo = document.createElement('img');
      photo.src = `${root}posters/smiley-hue-${frame}.jpg`;
      photo.alt = `Hue Smiley color ${frame}`;
      photo.loading = 'lazy';
      gallery.append(photo);
    }
    stage.append(gallery);
    return stage;
  }
  const pictured = picturedAssets(pack);
  const featured = pictured.length > 4 ? [...pictured.filter(isCreature).slice(0, 3), ...pictured.filter(isTank).slice(0, 1)] : pictured;
  gallery.className = `card-photos${featured.length > 1 ? ` card-photos--mosaic card-photos--${featured.length}` : ''}`;
  for (const asset of featured) {
    const photo = document.createElement('img');
    photo.src = `${root}posters/${encodeURIComponent(posterSku(asset, pack))}.jpg`;
    photo.alt = assetName(asset);
    photo.loading = 'lazy';
    gallery.append(photo);
  }
  stage.append(gallery);
  if (pictured.length > featured.length) {
    const count = document.createElement('span');
    count.className = 'card-stage__more';
    count.textContent = `+${pictured.length - featured.length} more`;
    stage.append(count);
  }
  return stage;
}

function previewTankColor(pack) {
  const palette = ['blue', 'cyan', 'green', 'lime', 'orange', 'pink', 'red', 'violet', 'yellow'];
  const named = pack?.sku.match(/^color-pack-(amber|blue|lime|rose|violet)$/)?.[1];
  const aliases = { amber: 'orange', rose: 'pink' };
  if (named) return aliases[named] || named;
  const key = pack?.sku || '';
  let hash = 0;
  for (const character of key) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

function posterSku(asset, pack) {
  if (asset === 'tank.matrix') return 'matrix-tank';
  if (asset === 'tank.plain') return 'plain-tank';
  if (asset === 'tank.custom') return 'custom-color-tank';
  if (asset === 'tank.random_color') return `${previewTankColor(pack)}-classic-tank`;
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
  const creatures = pack.assets.filter(asset => isCreature(asset) &&
    (asset !== 'pet.spikeball' || !pack.assets.includes('pet.spikeball.twin')));
  return [...creatures, ...pack.assets.filter(isTank)];
}

function isCreature(asset) { return asset.startsWith('pet.'); }
function isTank(asset) { return asset.startsWith('tank.'); }

function assetName(asset) {
  if (asset === 'tank.matrix') return 'Cyber Tank';
  if (asset === 'tank.plain') return 'Plain Water Tank';
  if (asset === 'tank.custom') return 'Customizable Color Tank';
  if (asset === 'tank.random_color') return 'Random Color Tank (example shown)';
  if (asset.startsWith('tank.')) {
    const [, color, shade] = asset.split('.');
    return `${titleCase(color)} Water Tank — ${titleCase(shade)}`;
  }
  if (asset === 'pet.snake') return 'Cyber Leech';
  if (asset === 'pet.snake.transparent_black') return 'Black Glass Leech';
  if (asset.startsWith('pet.snake.')) {
    const [, , style, color] = asset.split('.');
    return `${titleCase(color)} ${style === 'transparent' ? 'Glass ' : ''}Leech`;
  }
  if (asset === 'pet.spikeball') return 'Cyber Spikeball';
  if (asset === 'pet.spikeball.twin') return 'Cyber Twin Set';
  if (asset.startsWith('pet.spikeball.twins.')) {
    const variant = asset.slice('pet.spikeball.twins.'.length);
    if (variant === 'metal_hue') return 'Cyber + Hue Twin Set';
    if (variant === 'hue') return 'Hue Twin Set';
    const [style, color] = variant.split('.');
    const label = `${titleCase(color)}${style === 'transparent' ? ' Glass' : ''}`;
    return `${label} Twin Set`;
  }
  if (asset.startsWith('pet.smiley.')) return `${titleCase(asset.slice('pet.smiley.'.length))} Smiley`;
  return titleCase(asset.replace(/^(tank|pet)\./, '').replaceAll(/[._]/g, ' '));
}

function titleCase(value) { return value.replace(/\b\w/g, letter => letter.toUpperCase()); }

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
  return link;
}

async function getPacks() {
  const response = await fetch(`${root}packs.json`);
  if (!response.ok) throw new Error('The collection could not be loaded.');
  return response.json();
}

function renderCatalog(packs) {
  const grid = document.getElementById('card-grid');
  const buttons = [...document.querySelectorAll('.filter')];
  const search = document.getElementById('catalog-search');
  const count = document.getElementById('result-count');
  const empty = document.getElementById('search-empty');
  const searchIndex = packs.map(pack => ({
    pack,
    text: `${pack.name} ${pack.description} ${pack.sku} ${pack.assets.join(' ')}`
      .toLocaleLowerCase().replace(/[._-]/g, ' '),
  }));
  const initial = new URLSearchParams(location.search);
  let activeFilter = ['all', 'bundle', 'tank', 'pet'].includes(initial.get('category'))
    ? initial.get('category') : 'all';
  search.value = initial.get('q') || '';
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'load-more';
  more.textContent = 'Show more editions';
  grid.after(more);
  let shown = [];
  let rendered = 0;
  function addPage() {
    const next = shown.slice(rendered, rendered + 24);
    grid.append(...next.map(card));
    rendered += next.length;
    more.hidden = rendered >= shown.length;
  }
  function apply() {
    const terms = search.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    shown = searchIndex.filter(({ pack, text }) =>
      (activeFilter === 'all' ||
        (activeFilter === 'pet' ? ['snake', 'ball', 'smile'].includes(kind(pack)) :
          activeFilter === 'tank' ? kind(pack) === 'tank' : pack.category === activeFilter)) &&
      terms.every(term => text.includes(term))).map(({ pack }) => pack);
    rendered = 0;
    grid.replaceChildren();
    addPage();
    count.textContent = `${shown.length.toLocaleString()} ${shown.length === 1 ? 'edition' : 'editions'}`;
    empty.hidden = shown.length !== 0;
    for (const button of buttons) {
      const selected = button.dataset.filter === activeFilter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    const url = new URL(location.href);
    if (activeFilter === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', activeFilter);
    if (search.value.trim()) url.searchParams.set('q', search.value.trim());
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);
  }
  more.addEventListener('click', addPage);
  buttons.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    apply();
  }));
  search.addEventListener('input', apply);
  apply();
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
    for (const [title, assets] of [['Creatures', picturedAssets(pack).filter(isCreature)], ['Tanks', pack.assets.filter(isTank)]]) {
      if (!assets.length) continue;
      const section = document.createElement('section');
      section.className = 'included-group';
      const heading = document.createElement('h3');
      heading.textContent = `${title} (${assets.length})`;
      const grid = document.createElement('div');
      grid.className = 'included-grid';
      for (const asset of assets) {
        const entry = document.createElement('figure');
        entry.className = 'included-item';
        const gallery = document.createElement('div');
        if (asset === 'pet.smiley.hue') gallery.className = 'included-item__hues';
        for (let frame = 1; frame <= (asset === 'pet.smiley.hue' ? 4 : 1); frame++) {
          const photo = document.createElement('img');
          photo.src = asset === 'pet.smiley.hue'
            ? `${root}posters/smiley-hue-${frame}.jpg`
            : `${root}posters/${encodeURIComponent(posterSku(asset, pack))}.jpg`;
          photo.alt = asset === 'pet.smiley.hue' ? `Hue Smiley color ${frame}` : assetName(asset);
          photo.loading = 'lazy';
          gallery.append(photo);
        }
        const name = document.createElement('figcaption');
        name.textContent = assetName(asset);
        entry.append(gallery, name);
        grid.append(entry);
      }
      section.append(heading, grid);
      contents.append(section);
    }
  }
  const media = document.getElementById('pack-media');
  if (pack.preview === 'components') {
    const preview = document.createElement('div');
    preview.className = 'component-preview';
    const characters = pack.assets.filter(isCreature).filter(asset =>
      asset !== 'pet.spikeball' || !pack.assets.includes('pet.spikeball.twin'));
    const figure = document.createElement('figure');
    const clip = document.createElement('video');
    clip.autoplay = true;
    clip.muted = true;
    clip.loop = true;
    clip.playsInline = true;
    clip.controls = true;
    clip.preload = 'auto';
    const caption = document.createElement('figcaption');
    figure.append(clip, caption);
    const choices = document.createElement('div');
    choices.className = 'component-preview__choices';
    const buttons = [];
    function select(asset) {
      clip.poster = `${root}posters/${encodeURIComponent(posterSku(asset, pack))}.jpg`;
      clip.src = `${root}videos/${encodeURIComponent(posterSku(asset, pack))}.mp4`;
      clip.setAttribute('aria-label', `${assetName(asset)} gameplay preview`);
      caption.textContent = assetName(asset);
      for (const [button, candidate] of buttons) button.setAttribute('aria-pressed', String(candidate === asset));
      clip.play().catch(() => {});
    }
    for (const asset of characters) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'component-preview__choice';
      button.textContent = assetName(asset);
      button.addEventListener('click', () => select(asset));
      buttons.push([button, asset]);
      choices.append(button);
    }
    preview.append(figure, choices);
    if (characters.length) select(characters[0]);
    media.append(preview);
    return;
  }
  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.controls = true;
  video.preload = 'auto';
  video.poster = `${root}posters/${encodeURIComponent(pack.sku)}.jpg`;
  video.setAttribute('aria-label', `${pack.name} gameplay preview`);
  const fallback = document.createElement('div');
  fallback.className = 'video-fallback';
  fallback.innerHTML = '<div><strong>Video preview in preparation</strong><span>Check back soon for this edition’s loop.</span></div>';
  video.addEventListener('error', () => media.replaceChildren(fallback), { once: true });
  video.src = `${root}videos/${encodeURIComponent(pack.sku)}.mp4`;
  media.append(video);
  video.play().catch(() => {});
}

const header = document.querySelector('.site-header');
const categoryTrigger = header?.querySelector('.category-trigger');
if (header && categoryTrigger) {
  const setOpen = open => {
    header.classList.toggle('is-open', open);
    categoryTrigger.setAttribute('aria-expanded', String(open));
  };
  header.addEventListener('pointerenter', () => {
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) setOpen(true);
  });
  header.addEventListener('pointerleave', () => {
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) setOpen(false);
  });
  header.addEventListener('focusin', () => setOpen(true));
  header.addEventListener('focusout', event => {
    if (!header.contains(event.relatedTarget)) setOpen(false);
  });
  categoryTrigger.addEventListener('click', () => setOpen(true));
  document.addEventListener('pointerdown', event => {
    if (!header.contains(event.target)) setOpen(false);
  });
  header.addEventListener('keydown', event => {
    if (event.key === 'Escape') { categoryTrigger.focus(); setOpen(false); }
  });
}

getPacks().then(packs => page === 'catalog' ? renderCatalog(packs) : renderDetail(packs))
  .catch(error => {
    const target = document.getElementById(page === 'catalog' ? 'card-grid' : 'pack-media');
    if (target) target.textContent = error.message;
  });
