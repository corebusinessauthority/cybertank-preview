# CyberPets preview collection

Independent, public gallery for CyberPets. The home page displays 68 collectible-style edition cards, with names but no prices. Each card contains a real still from the native C++ renderer; bundles picture their included tanks and characters separately. Opening a card shows a looping recording of that edition. These are visual previews, not the software or a download entitlement.

The site contains no storefront, executable, private source, purchase verification, or itch.io keys. Future OpenSea purchases and itch.io delivery require a separate fulfillment process; a purchase alone is **not** automatically linked to a download by this site. Creature-only videos use a demonstration Matrix tank that is not included with those editions.

## Local build and review

```sh
npm run check
npm run build
python3 -m http.server 8765 --directory dist
```

Open `http://localhost:8765/` for the collection, or a route such as `http://localhost:8765/packs/matrix-leech/` for a specific preview. The build fails if any of the 68 edition videos or posters is missing. Files in `dist/` are generated and ignored by Git.

## GitHub Pages

The repository works with either **Settings → Pages → Build and deployment → Source: GitHub Actions** or **Deploy from a branch → main / (root)**. `.github/workflows/pages.yml` builds and deploys `dist/` on pushes to `main`; `npm run build` also refreshes the tracked `packs/<sku>/index.html` routes for branch-based hosting. The public address is <https://corebusinessauthority.github.io/cybertank-preview/>. A custom domain may be configured later; all site links are relative, so both paths work.

## Maintaining the collection

The public `packs.json` was generated from the product's 68 pack manifests with `node scripts/import-packs.mjs /path/to/AquariumNFT`. It contains only display metadata. The corresponding `videos/<sku>.mp4` clips were recorded from an opt-in C++ capture build by `scripts/capture-videos.mjs`. `node scripts/make-posters.mjs` extracts the native stills; this repo does not depend on the product source at deploy time. Review videos before publishing when a pack's contents change.
