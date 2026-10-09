# Credits

This file records what this repository borrows, and the line it does not cross.

## Hero

`assets/hero.svg` is an original drawing made for this repository.

It uses colour tokens from [Nonarkara/palette](https://github.com/Nonarkara/palette) (`styles.css` and `context.md`):

| Token in Palette | Screen value | Role on the hero |
| --- | --- | --- |
| `--white` | `#f7f5ef` | Paper field in the light theme |
| `--black` | `#101010` | Ink in the light theme; paper field in the dark theme |
| `--wada-blue` | `#12354e` | Right-hand rail. Palette names this Dark Tyrian Blue, Plate 002 |
| `--wada-orange` | `#f99d1b` | Top edge of the rail. Palette names this Yellow Orange, Plate 002 |
| `--about-red` | `#a72144` | One square seal |

Plate 002 is a two-colour relationship in that exhibition. The hero keeps the same unequal cut the exhibition uses for two colours: about 61.8% field, 38.2% rail. Those RGB values are digital conversions shipped with Palette, not measurements of printed ink.

Palette's application code and writing are MIT licensed. Its colour data comes from Matt DesLauriers' MIT-licensed [dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations), which credits Dain M. Blodorn Kim's earlier compilation. The historical combinations are credited to Sanzo Wada. This repository does not copy Palette's interface, book scans, or cover art. Palette, Seigensha, and the Wada estate are not affiliated with this monitor.

The brush drawing — dry strokes, a paper grain, rain marks, and a large empty area — takes its mood from Japanese sumi-e and from the ink-on-paper feeling of Takehiko Inoue's manga *Vagabond*. That is an atmosphere reference only. The file does not copy panels, characters, lettering, swords, or any other artwork from *Vagabond* or from Inoue's other books. Inoue, Kodansha, and their publishers are not affiliated with this project and have not endorsed it.

`docs/hero-banner.png` is an earlier civic-studio drawing. The README no longer uses it. It is an illustration, not telemetry.

## Interface fonts

`apps/web/index.html` loads Inter, Manrope, and Noto Sans Thai from Google Fonts. Those families stay under their own licenses. The hero SVG does not embed them. It asks for Archivo Narrow and JetBrains Mono by name, then falls back to fonts already on the machine. Palette uses those two families; this repo does not redistribute the font files.

## Data providers

Adapters and map layers name their upstreams in code. The README table is the visitor-facing list. Upstream terms still apply. Nothing in this repository relicenses those feeds.

Notable third-party software used to build the apps, and not relicensed here: React, Vite, Leaflet, TanStack Query, Fastify, and the other packages in the workspace `package.json` files. See each package's own license.
