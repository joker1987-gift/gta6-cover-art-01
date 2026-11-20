# Neon Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/joker1987-gift/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/joker1987-gift/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An entry for the [gta6-cover-art-01 bounty on make.fun](https://make.fun/bounty/gta6-cover-art-01).

A fully offline web app that turns your photos into GTA-style multi-panel
cover art: pick a layout, grade the colour, letter the cover, export a PNG.

## Run it

```
node serve.ts
```

then open the local address it prints. Or open `app/index.html` through
any static file server. The app makes no network requests and your photos
never leave the machine.

## What it does

- **Photos** — drag and drop or pick up to 6 photos. Three bundled sample
  photos are preloaded into a finished demo cover on first load.
- **Layouts** — six multi-panel arrangements: Hero Grid, Classic Nine,
  Story Strip, Duo Clash, Full Bleed + Insets and Mosaic Six.
- **Grades** — five canvas colour grades (Sunset Drive, Neon Nights,
  Golden Hour, Vice Teal, Midnight Noir) plus halftone, grain, vignette
  and ink-edge print effects.
- **Per-panel editing** — click a panel to select it, drag on the cover
  to reposition its photo, scroll or use the slider to zoom, and cycle
  which photo fills it. Cover-fit is clamped to the real overflow, so a
  photo never shows a gap, and smart framing keeps subjects clear of the
  title block.
- **Lettering** — an editable sunset-gradient title, a script subtitle,
  a location pill, a 0–5 heat-star row and a round VI badge.
- **Export** — one click renders a full-size PNG offscreen at
  1920 × 1080, 1080 × 1350 or 1080 × 1080.

## Entry plumbing

`node main.ts` copies `app/` and `screenshots/` into the output
directory (`$MAKEFUN_OUTPUT_DIR`, default `/output`) and writes
`dossier.json` there with the vendored `buildDossier` library.
Screenshot scenes are deterministic: `app/?shot=cover|editor|portrait|square`.
