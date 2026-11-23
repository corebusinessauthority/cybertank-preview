# CyberPets Cybertank preview

An independent, browser-only preview of CyberPets' Living Aquarium. It contains a fixed Matrix tank, one metallic snake, metallic spikeball twins without lasers, and a hue-changing smiley. It does not contain the desktop game's settings, paid packs, or source code.

The site is self-contained: Three.js 0.180.0 and its MIT license live in `vendor/`, while the preview texture lives in `assets/`. No checkout of `aquapets`, npm install, or external CDN is required.

## Build locally

```sh
npm run check
npm run build
python3 -m http.server 8765 --directory dist
```

Open `http://localhost:8765/` for the site and `http://localhost:8765/itch/` for the game-only embed. The build writes into ignored `dist/`.

## GitHub Pages

In this repository's **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**. A push to `main` runs `.github/workflows/pages.yml` and deploys `dist/` to <https://corebusinessauthority.github.io/cybertank-preview/>. The main `aquapets` repository is not involved.

## itch.io HTML5 preview

GitHub Pages does not automatically populate itch.io's **Embed game** selector. Make a ZIP of the **contents** of `dist/itch/`, with `index.html` at the ZIP root:

```sh
cd dist/itch
zip -r ../../itch-html5-preview.zip index.html app.js style.css metal.jpg vendor
```

Upload that ZIP to the itch.io project as a browser-playable HTML5 file. If the itch.io project is currently an **NFT** rather than an **HTML Game**, change its project kind before expecting browser embed controls. The itch-specific version omits the itch.io purchase widget to avoid recursively embedding the store page.
