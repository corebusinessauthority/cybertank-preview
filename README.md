# CyberPets Cybertank preview

An independent, browser-only preview of CyberPets' Living Aquarium. It contains a fixed Matrix tank, one metallic snake, metallic spikeball twins without lasers, and a hue-changing smiley. It does not contain the desktop game's settings, paid packs, or source code.

The site is self-contained: `index.html` at the repository root launches the tank directly. Three.js 0.180.0 and its MIT license live in `vendor/`; `metal.jpg` textures the spikeballs and `snake-metal.jpg` textures the snake. No checkout of `aquapets`, npm install, or external CDN is required.

## Build locally

```sh
npm run check
npm run build
python3 -m http.server 8765 --directory dist
```

Open `http://localhost:8765/` or `http://localhost:8765/itch/`; both show only the tank. The build writes into ignored `dist/`.

## GitHub Pages

The repository root is directly publishable from `main` under **Settings → Pages → Build and deployment → Deploy from a branch → main / (root)**. Alternatively, set **Source** to **GitHub Actions**; a push to `main` runs `.github/workflows/pages.yml` and deploys the equivalent `dist/` output. Either way, <https://corebusinessauthority.github.io/cybertank-preview/> opens the tank itself, not this README. The main `aquapets` repository is not involved.

## itch.io HTML5 preview

GitHub Pages does not automatically populate itch.io's **Embed game** selector. Make a ZIP of the **contents** of `dist/itch/`, with `index.html` at the ZIP root:

```sh
cd dist/itch
zip -r ../../itch-html5-preview.zip index.html app.js style.css metal.jpg snake-metal.jpg vendor
```

Upload that ZIP to the itch.io project as a browser-playable HTML5 file. If the itch.io project is currently an **NFT** rather than an **HTML Game**, change its project kind before expecting browser embed controls.
