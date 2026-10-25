# Everyday-place evidence verification

26 October 2026, Bangkok time. Pilot evidence, not a production readiness claim.

Source contract and reproducible build: [EVERYDAY-PLACES.md](../EVERYDAY-PLACES.md).
75 JavaScript unit tests pass, including every real cell's hash/count/schema,
current-asset routing, radius and invalid/stale/future data. Two Python lifecycle
checks pass. Shared and web production builds pass. The retired API's preexisting
build failures remain outside this deployment. No fabricated source replacement.

Chrome visitor flows pass at 390×844, 1024×900 and 1440×900: real Ari groceries,
source links, category change, layer on/off, keyboard popup, dated provenance,
unknown availability when stale/unavailable and no horizontal page overflow.
Saved-premises regression passes all three widths; its compact result is retained
here without rewriting the earlier release's original captures.

## Seven-rule visual audit

1. Boxes fit content: caught inherited 35px checkbox and wrapped short label;
   corrected to 18px native control. Candidate name/type/distance now share a row
   when they fit. Rows fell from about 52px to 30.75px; one longer phone record
   still earns 52.5px to preserve its complete label.
2. Composition: the map remains dominant; nearby data joins the existing evidence
   reading column. No additional toolbar band or equal-card grid.
3. Line length: existing 65ch prose measure retained; phone wraps naturally.
4. Type: existing Jost/Prompt retained; no new face.
5. Ornament: none; row rules separate source records, controls perform actions.
6. Hierarchy: map first, selected area and actual-space check second, nearby
   reference candidates third. Initial map screenshots remain a distinct proof.
7. Chrome/slop: toolbar remains 47px at all three sizes. No clipping, hidden
   qualifications, invented count/score, new hero or decorative surface.

`directory-*`, `map-*` and `popup-*` capture the three states. `results.json`
records actual geometry and tested URL. Source popups distinguish snapshot date
from node edit date and explicitly say the latter is not a visit date. Selecting
On map centres/zooms the actual search point; no point offsets or invented routes.

Independent reviewer reviewed source and all three viewport sets. The initial
checkbox defect was fixed before the final review. Full shipability remains open:
commercial demand, matched rent history, verified entrances/routes, field tests,
ongoing data operations and paying-customer validation are not established here.

Final asynchronous regression: delayed Atlas data previously removed the whole
catalogue layer and detached an open OSM popup. Markers now reconcile by stable
ID and record signature. The deterministic browser case adds another source's
point while checking that the exact popup DOM and keyboard focus survive.
Existing civic map flows also pass at all three sizes; source review independently
passes this surgical repair.

Unavailable check: `npx --yes axiom-audit . --strict` returned npm404 because the
package is unavailable from the configured registry. It is not counted as a pass.
Rendered seven-rule audit, geometry assertions and independent review are recorded
above. Source, derived data and built-output secret scans report no leaks.

## Live release

Source 30392fd9aa942a112ac7da7f5fd1269deb941d67 deployed as Pages cd5c4f43:
https://bangkok-ioc.pages.dev/places (immutable cd5c4f43.bangkok-ioc.pages.dev).
The full everyday browser runner passes on the public production URL at all three
widths, including stale/unavailable and delayed independent-source cases.
`results.json` and captures are live; `local-results.json` preserves the local run.
`live-bytes.json` proves exact deployed pilot JS, manifest and largest cell bytes,
and byte-identical legacy IOC root/Atlas app.js before and after deployment.
