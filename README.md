# CyberPets preview collection

Independent, public gallery for CyberPets. The home page displays 1,282 sellable edition previews, with names but no prices. Wide cards use uncropped landscape stills from the native C++ renderer. Bundle pages list every creature first and every tank second. Solo pages show the edition's native gameplay loop; bundle pages let visitors select loops of their included creatures. These are visual previews, not software or download entitlements.

The site contains no storefront, executable, private source, purchase verification, or itch.io keys. Future OpenSea purchases and itch.io delivery require a separate fulfillment process; a purchase alone is **not** automatically linked to a download by this site. Creature-only videos use a demonstration Matrix tank that is not included with those editions.

## Local build and review

```sh
npm run check
npm run build
python3 -m http.server 8765 --directory dist
```

Open `http://localhost:8765/` for the collection, or a route such as `http://localhost:8765/packs/cyber-pack/` for a specific preview. The build fails if an individual edition's native video or poster is missing. Generated trio and curated bundles reuse the included creatures' native loops instead of copying more than a thousand nearly identical videos. Files in `dist/` are generated and ignored by Git.

## GitHub Pages

The repository works with either **Settings → Pages → Build and deployment → Source: GitHub Actions** or **Deploy from a branch → main / (root)**. `.github/workflows/pages.yml` builds and deploys `dist/` on pushes to `main`; `npm run build` also refreshes the tracked `packs/<sku>/index.html` routes for branch-based hosting. The public address is <https://corebusinessauthority.github.io/cybertank-preview/>. A custom domain may be configured later; all site links are relative, so both paths work.

## Maintaining the collection

The public `packs.json` is generated from the product's sellable pack manifests with `node scripts/import-packs.mjs /path/to/AquariumNFT/packs`. It contains only display metadata. Native `videos/<sku>.mp4` clips were recorded from an opt-in C++ capture build by `scripts/capture-videos.mjs`. `node scripts/make-posters.mjs` extracts landscape stills; this repo does not depend on the product source at deploy time. Review videos before publishing when a character changes.
