# Map-first MSH correction

The previous pass missed combined chrome cost. Before captures and geometry are retained here; current captures are in ../verification/.

| Viewport | Chrome before | Chrome after | Current viewport share | Map height before → after |
|---|---:|---:|---:|---:|
| 390×844 | 304px | 47px | 5.6% | 255 → 398px |
| 1024×900 | 191px | 47px | 5.2% | 709 → 849px |
| 1440×900 | 191px | 47px | 5.2% | 708 → 849px |

One toolbar combines identity, place, view and preferences. Existing preferences/source links remain reachable through the disclosure. Phone selected-place title and shortlist action remain together; desktop current fit/missing evidence precedes editorial context. The map gets the recovered height. Readable enlarged text may wrap the toolbar instead of being clipped. Real evidence below the map continues to earn document scroll; desktop selected-place evidence scrolls within its viewing column only when needed.

Verification covers widths 390/799/801/1024/1440, a normal-text chrome ceiling of 64px, home-pin/limits/report/comparison flows, settings access in Compare, settings viewport bounds, and enlarged text. 13 behavior tests and web production build pass. Independent review confirmed the chrome repair and absence of blocking overlap. Phone ordering correction and explicit Compare settings checks respond to final reviewer comments.

The four-layer economics proposal is ../MAP-FIRST.md. None of its market estimates or business-demand ratings are presented as implemented.

The optional source audit command `npx --no-install axiom-audit apps/web/src/places --strict` could not run: the package registry returned 404. It is not recorded as a passing check. Rendered geometry, production build, behavior tests and independent review are the evidence used here.

Production closeout: source 06949aa deployed as 5fb3dd4d. The five-width browser suite passes against https://bangkok-ioc.pages.dev/places, including Compare keyboard settings, settings bounds, report and enlarged text. The live entry references index-b7ZcWLcS.js. Original IOC root HTML and both immutable bundles remain byte-identical. Current captures reflect production.
