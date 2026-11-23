const root = document.body.dataset.root || './';
const page = document.body.dataset.page;
const sku = document.body.dataset.sku;

const glyphs = {
  tank: `<svg viewBox="0 0 120 120" fill="none" stroke-width="3" stroke-linejoin="round"><path class="outline" d="M20 35 60 18l40 17v52L60 105 20 87V35Z M20 35l40 17 40-17M60 52v53"/><path class="outline" opacity=".45" d="M30 57v20m16-28v35m31-36v38m13-47v35"/></svg>`,
  snake: `<svg viewBox="0 0 120 120" fill="none" stroke-width="7" stroke-linecap="round"><path class="outline" d="M21 91c20 7 42 3 48-17 5-15-16-29-12-44 3-13 20-16 35-7"/><circle class="fill" cx="95" cy="23" r="11"/><circle cx="97" cy="21" r="4" fill="#081016"/><path class="outline" stroke-width="2" d="M28 87l7 8m5-16 7 8m4-19 8 5m0-22 10 2m0-20 11-1"/></svg>`,
  ball: `<svg viewBox="0 0 120 120" fill="none" stroke-width="3"><path class="outline" d="m60 11 6 12 11-8 2 15 15-2-5 14 14 7-11 9 10 11-14 5 5 15-15-2-4 15-11-9-11 10-7-14-14 4 2-15-14-4 9-12-10-9 13-7-5-15 15 2 6-14 10 9Z"/><circle class="outline" cx="60" cy="60" r="25"/><ellipse cx="60" cy="60" rx="16" ry="9" fill="#f5f5ec"/><circle cx="60" cy="60" r="7" fill="#db3749"/><circle cx="60" cy="60" r="3" fill="#05070c"/></svg>`,
  smile: `<svg viewBox="0 0 120 120" fill="none" stroke-width="4" stroke-linecap="round"><circle class="outline" cx="60" cy="60" r="43"/><path class="outline" d="M43 72q17 22 34 0"/><circle class="fill" cx="44" cy="49" r="4"/><circle class="fill" cx="76" cy="49" r="4"/></svg>`,
  bundle: `<svg viewBox="0 0 120 120" fill="none" stroke-width="3" stroke-linejoin="round"><path class="outline" d="M12 31 60 12l48 19v58l-48 19-48-19V31Z M12 31l48 19 48-19M60 50v58"/><circle class="outline" cx="60" cy="57" r="18"/><circle class="fill" cx="60" cy="57" r="6"/><path class="outline" d="M19 82q13-14 24-2m33-1q15-14 25-4"/></svg>`,
};

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
  box.innerHTML = `<span class="card-pack__front"><span class="card-glyph">${glyphs[kind(pack)]}</span></span>`;
  stage.append(box);
  return stage;
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
    count.textContent = `${shown.length} editions`;
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
