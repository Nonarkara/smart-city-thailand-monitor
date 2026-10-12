# Credits

This file records what this repository borrows, and the line it does not cross.

## Hero

`assets/hero.png` is a screenshot of the public dashboard at `https://bangkok-ioc.pages.dev/`, taken on 10 October 2026. The wide screen is a 1440 by 900 viewport. The narrow screen is a 390 by 844 viewport of the same URL. The name and the one-line pitch are set in Inter, with Helvetica and Arial as fallbacks.

The field behind the screens is one flat colour from [Nonarkara/palette](https://github.com/Nonarkara/palette): `--wada-blue`, `#12354e`. Palette names that value Dark Tyrian Blue, Plate 002. It is a digital conversion shipped with that exhibition, not a measurement of printed ink. The type on the field is Palette's `--white`, `#f7f5ef`.

Palette's application code and writing are MIT licensed. Its colour data comes from Matt DesLauriers' MIT-licensed [dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations), which credits Dain M. Blodorn Kim's earlier compilation. The historical combinations are credited to Sanzo Wada. This repository does not copy Palette's interface, book scans, or cover art. Palette, Seigensha, and the Wada estate are not affiliated with this monitor.

`docs/hero-banner.png` is an earlier civic-studio drawing. The README does not use it.

`assets/manga.jpg` is original AI-assisted art made for this project. It is the closing panel at the end of the README.

## Interface fonts

`apps/web/index.html` loads Inter, Manrope, and Noto Sans Thai from Google Fonts. Those families stay under their own licenses. The hero loads Inter for the two lines of type and does not embed the font file.

## Data providers

Adapters and map layers name their upstreams in code. The README table is the visitor-facing list. Upstream terms still apply. Nothing in this repository relicenses those feeds.

Notable third-party software used to build the apps, and not relicensed here: React, Vite, Leaflet, TanStack Query, Fastify, and the other packages in the workspace `package.json` files. See each package's own license.
