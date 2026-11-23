const root = document.body.dataset.root || './';
const page = document.body.dataset.page;
const sku = document.body.dataset.sku;
const CART_KEY = 'cyberpets-preview-cart';

function readCart() {
  try {
    const value = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(value) ? value.filter(item => item && item.sku) : [];
  } catch { return []; }
}

function price(value) { return `${Number(value || 0).toFixed(2)} USDT`; }

function setupCart(packs) {
  const button = document.getElementById('cart-button');
  const count = document.getElementById('cart-count');
  if (!button || !count) return () => {};
  const drawer = document.createElement('aside');
  drawer.className = 'cart-drawer';
  drawer.hidden = true;
  drawer.setAttribute('aria-label', 'Shopping bag');
  drawer.innerHTML = '<div class="cart-drawer__head"><h2>Your bag</h2><button class="cart-close" type="button" aria-label="Close shopping bag">×</button></div><div class="cart-items" id="cart-items"></div><div class="cart-drawer__foot"><span>Total</span><strong id="cart-total">0.00 USDT</strong><small>Prices are placeholders and can be changed before launch.</small></div>';
  document.body.append(drawer);
  let items = readCart();
  const itemsNode = drawer.querySelector('#cart-items');
  const totalNode = drawer.querySelector('#cart-total');
  function save() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch {}
  }
  function render() {
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
    count.textContent = String(quantity);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    totalNode.textContent = price(total);
    itemsNode.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'cart-empty';
      empty.textContent = 'Your bag is empty.';
      itemsNode.append(empty);
      return;
    }
    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `<span>${item.name}<small>Qty ${item.quantity}</small></span><strong>${price(item.price * item.quantity)}</strong><button class="cart-buy" type="button">Buy</button><button type="button" aria-label="Remove ${item.name}" data-remove="${item.sku}">×</button>`;
      itemsNode.append(row);
    }
  }
  function open(opened) {
    drawer.hidden = !opened;
    button.setAttribute('aria-expanded', String(opened));
  }
  button.addEventListener('click', () => open(drawer.hidden));
  drawer.querySelector('.cart-close').addEventListener('click', () => open(false));
  drawer.addEventListener('click', event => {
    const remove = event.target.closest('[data-remove]');
    if (!remove) return;
    items = items.filter(item => item.sku !== remove.dataset.remove);
    save();
    render();
  });
  render();
  return pack => {
    const existing = items.find(item => item.sku === pack.sku);
    if (existing) existing.quantity += 1;
    else items.push({ sku: pack.sku, name: pack.name, price: Number(pack.price || 0), quantity: 1 });
    save();
    render();
    open(true);
  };
}

function kind(pack) {
  if (pack.category === 'bundle') return 'bundle';
  if (pack.assets.some(id => id.startsWith('tank.'))) return 'tank';
  if (pack.assets.some(id => id.startsWith('pet.snake'))) return 'snake';
  if (pack.assets.some(id => id.startsWith('pet.spikeball'))) return 'ball';
  return 'smile';
}

function accent(pack) {
  const name = pack.sku;
  if (name.startsWith('cyber-tank-')) return '#b9c2cc';
  const choices = [
    ['rose', '#f08da9'], ['pink', '#ff93d3'], ['violet', '#b99aff'],
    ['amber', '#ffc579'], ['orange', '#ff9a70'], ['yellow', '#ffe477'],
    ['lime', '#b7ed77'], ['green', '#7fe9ae'], ['blue', '#82baff'],
    ['cyan', '#79e4eb'], ['red', '#fc848b'], ['hue', '#e49bf6'],
    ['cyber', '#b9c2cc'], ['matrix', '#b9c2cc'], ['plain', '#8ac9ed'],
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
  const palette = ['blue', 'cyan', 'green', 'orange', 'pink', 'red', 'violet', 'yellow'];
  const named = pack?.sku.match(/^color-pack-(amber|blue|lime|rose|violet)$/)?.[1];
  const aliases = { amber: 'orange', lime: 'green', rose: 'pink' };
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
    const [, style, color] = asset.split('.');
    if (['neon', 'pulse', 'aurora', 'cyber'].includes(style)) {
      if (style === 'cyber') return pack?.sku?.startsWith('cyber-tank-') ? pack.sku : 'matrix-tank';
      const source = { amber: 'orange', lime: 'green', rose: 'pink' }[color] || color;
      const shade = style === 'neon' ? 'light' : style === 'pulse' ? 'dark' : 'classic';
      return `${source}-${shade}-tank`;
    }
    const [, existingColor, shade] = asset.split('.');
    return `${existingColor}-${shade}-tank`;
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
    const [, style, color] = asset.split('.');
    if (['neon', 'pulse', 'aurora', 'cyber'].includes(style)) {
      const label = titleCase(color);
      return style === 'cyber' ? `Cyber Tank — ${label}` : `${label} ${titleCase(style)} Tank`;
    }
    const [, existingColor, shade] = asset.split('.');
    return `${titleCase(existingColor)} Water Tank — ${titleCase(shade)}`;
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

function card(pack, addToCart) {
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
  label.append(document.createTextNode(pack.name));
  const cardPrice = document.createElement('small');
  cardPrice.className = 'pack-card__price';
  cardPrice.textContent = price(pack.price);
  label.append(cardPrice);
  body.append(label);
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const add = document.createElement('button');
  add.className = 'card-add';
  add.type = 'button';
  add.textContent = '+';
  add.setAttribute('aria-label', `Add ${pack.name} to shopping bag`);
  add.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    addToCart(pack);
  });
  const buy = document.createElement('button');
  buy.className = 'card-buy';
  buy.type = 'button';
  buy.textContent = 'Buy';
  buy.setAttribute('aria-label', `Buy ${pack.name}`);
  buy.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
  });
  if (pack.sku.includes('hue')) actions.classList.add('is-hue');
  actions.append(add, buy);
  body.append(actions);
  link.append(body);
  return link;
}

async function getPacks() {
  const response = await fetch(`${root}packs.json`);
  if (!response.ok) throw new Error('The collection could not be loaded.');
  return response.json();
}

function renderCatalog(packs, addToCart) {
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
  let shown = [];
  let rendered = 0;
  function addPage() {
    if (rendered >= shown.length) return;
    const next = shown.slice(rendered, rendered + 24);
    grid.append(...next.map(pack => card(pack, addToCart)));
    rendered += next.length;
  }
  function maybeLoadMore() {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 700)
      addPage();
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
    maybeLoadMore();
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
  window.addEventListener('scroll', maybeLoadMore, { passive: true });
  window.addEventListener('resize', maybeLoadMore);
  buttons.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    apply();
  }));
  search.addEventListener('input', apply);
  apply();
}

async function renderDetail(packs, addToCart) {
  const pack = packs.find(item => item.sku === sku);
  if (!pack) throw new Error('This edition does not exist.');
  document.title = `${pack.name} · CyberPets preview`;
  document.getElementById('pack-name').textContent = pack.name;
  const detailSide = document.querySelector('.detail-side');
  if (detailSide) {
    detailSide.style.setProperty('--accent', accent(pack));
    if (pack.sku.includes('hue')) detailSide.classList.add('is-hue');
  }
  document.getElementById('pack-description').textContent = pack.description;
  const detailPrice = document.getElementById('pack-price');
  if (detailPrice) detailPrice.textContent = price(pack.price);
  const detailAdd = document.getElementById('detail-add');
  if (detailAdd) detailAdd.addEventListener('click', () => addToCart(pack));
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
const backToTop = document.querySelector('.back-to-top');
if (header && backToTop) {
  const syncHeader = () => {
    const condensed = window.scrollY > 120;
    header.classList.toggle('is-condensed', condensed);
    backToTop.hidden = !condensed;
  };
  window.addEventListener('scroll', syncHeader, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  syncHeader();
}

getPacks().then(packs => {
  const addToCart = setupCart(packs);
  return page === 'catalog' ? renderCatalog(packs, addToCart) : renderDetail(packs, addToCart);
})
  .catch(error => {
    const target = document.getElementById(page === 'catalog' ? 'card-grid' : 'pack-media');
    if (target) target.textContent = error.message;
  });
