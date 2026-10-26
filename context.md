# Place-fit pilot context

Approved 23 October 2026: a six-area household comparison before business
location studies. The legacy IOC remains accessible. No paid checkout yet.

Invariant: a place can meet a household's entered limits only when the evidence
required by those limits is present and checked for the current scenario.
Changing destination, travel mode, departure time or home pin invalidates the
journey check. Rent and monthly extras remain user entries, never market averages.

## Design read

26 October spatial correction: adopt Palette's MoMA spacing/planar alignment
within the existing Civic register. Explore becomes one 2/3 map +1/3 continuous
decision column on wide screens, with a sticky map and ordinary document scroll;
phone composes map, place/action and compact label-value forms in that order.
The Civic map is a deliberate full-viewport canvas; the narrow live-control column
uses a 16px page-unit. MoMA supplies alignment, proportion and relative spacing;
the Editorial reading-shell margins do not apply to this map workspace.
No nested rail scrolling, hidden qualifications or removed features. Three spacing
roles: page-unit16px, baseline1.35em, optical cap0.5em. Comparison tables dominate
Compare. Native form targets remain readable and dense controls at least32px.

A street atlas beside a candid place note: locate the choice, understand the
tradeoff, then test a real home. The map dominates Explore; the evidence table
dominates Compare. The reference is the geographic orientation of Vignelli's
1972 transit diagram and the explicit row-by-row logic of a Which? comparison.

`/places` uses the Civic register (daylight), Jost + Prompt and amber #f59e0b.
The older dark-wall instructions in CLAUDE.md describe the retained operations
product, not this separately approved consumer route. No rounded corners,
decorative gradients, drop shadows or stock-image filler. Existing map colors
are source cartography, not additional decorative accents.

Rules have distinct jobs: 2px identifies the major structural edge, 1px groups
reference rows, and 3px amber marks a tradeoff/focus. Controls fit their labels.
Mobile groups area selection into one deliberate selector rather than a long
button stack. Its 220px map supports orientation while leaving the selected
place and shortlist action together on the first screen. Evidence below earns
scrolling through actual costs, local facts and a visit check. No content is
clipped to claim a one-screen pass. Wide comparisons can scroll horizontally
on a phone; row labels remain fixed and the instruction is visible.

## Sources and preservation

The Atlas location Worker is a separately deployed narrow route; the existing
Atlas map deployment is untouched. Source state and last-good cache patterns
are adapted from IOC; generated statistics/geometry are quarantined.

The Pages Worker keeps legacy entry/data requests on immutable deployment
fa6ccef0. Only the new pilot entry, its bundles and pilot JSON use new assets.
The source repository is smart-city-thailand-monitor, not a separate IOC repo.

## Checks

Full reading-path release gate: run `scripts/verify-spatial-browser.mjs` across
all four purposes, Compare and open settings at390/1024/1440. Inspect whole-page
and scrolled working-map captures, not just first-screen chrome. Check populated
economics and named-space flows, including120-character names and30px text. A
no-horizontal-overflow assertion does not establish readable label measure; saved
rows must wrap actions before squeezing names. Dense text-control groups use the
current owner rule: at least32px high, gaps at least4px. Isolated primary actions
and map controls retain44px. The old immutable release must fail the new section
budgets; preserve that negative proof. Independent whole-path review precedes ship.

`node --test scripts/test-place-fit.mjs`; shared + web builds; real visitor
flows; 390x844, 1024x900 and 1440x900 screenshots, adjacent breakpoints, open
preferences, long labels and enlarged text; independent review; then live proof.
Browser or source scans alone do not establish a visual pass. Customer demand,
field access and a paid report remain to be tested with people.

## Map-first correction, 23 October

The earlier review missed combined chrome cost: phone map started at y305 after 304px of toolbar bands. User explicitly requested one thin bar. Identity, area selection, view switch and one preferences disclosure now share a line; existing settings and source links remain inside that disclosure. Map is dominant, selected-place fit/action second, supporting evidence third. Desktop map uses the remaining viewport; its real evidence sidebar may scroll. Phone map grows using reclaimed space. The toolbar audit now has a 64px normal-text ceiling; enlarged text may reflow rather than clip. See docs/revival-2026-10-23/MAP-FIRST.md for staged economic evidence design; no market-rent or demand score is inferred from current sources.

## Purpose/economics increment, 23–24 October

User approved continuation after the four-layer proposal. Purpose now selects Live, Business, Industry or Buy to let without adding a toolbar band. Household behavior remains intact. Scenario arithmetic is local and separate per purpose, guide anchor and rounded pin; changing activity invalidates premises checks. Pins outside an anchor are labeled Pinned space, never misrepresented as a verified neighborhood address. Explicit losses and user surplus/yield targets affect verdicts. No positive investment/demand recommendation is produced by arithmetic alone.

Operating costs include owner pay and fit-out recovery; financing/tax are separately entered for investment cash flow. Matched user-sourced comparable rents require five eligible, dated observations, same user-confirmed conditions, ±20% size, ≤90 days and one canonical listing identity. Semantic URL IDs are retained; tracking IDs are ignored. Observation dates use Bangkok midnight.

PropertySights public JSON snapshot is quoted with attribution and published/retrieved dates, only as citywide residential context. Hide its ranges after 30 days. It has no commercial/station-level comparables or historical rent series. Repeatable refresh is scripts/refresh-place-market.mjs; no automatic refresh is claimed. Vite publicDir is the repository /public directory, not apps/web/public; only the Pages Worker is copied separately. CI verifies the market snapshot is in built output.

Nearby Atlas evidence is retained across purposes. Registered companies, civic POIs and complaint counts never become inferred customer demand. Reports/share links honor active purpose; private numbers stay local, reports include them only when explicitly saved. Current anchors remain six residential station guides; Industry is a real-space scenario tool, not a location suitability rating.

## Catalog map continuation, 25 October

Existing Atlas catalog points are optional source dots with pointer/keyboard popups, direct source/date and unknown access status. Coordinates/distance/source URLs pass catalog.ts boundary checks. No demand or opening inference. Dedicated pane prevents station markers intercepting point targets; popup temporarily takes precedence over pin controls. Settings are purpose-relevant and header stays sticky with measured height for scroll offsets. Tests/scripts and visual evidence are in map-evidence-verification; independent review required before release.


## Boundary reliability, 25 October

Saved browser data, guide JSON, Atlas evidence and publisher snapshots now pass bounded allowlist readers in boundaries.ts. Unknown or damaged decision values cannot approve a household; valid notes/scenarios survive recovery. Explicit storage failure and failed-clear messages replace silent persistence failures. Fetch deadlines/cancellation and a2MB response cap prevent indefinite evidence waits. Deferred persistence protects saved shortlists until validated guides load; Compare/Area are disabled while loading. Note field accessible names remain stable when restored. Tests and release evidence: boundary-verification/README.md. Full professional-shipability goal remains active; no citywide demand/market recommendation claim.

## Independent named premises, 25 October

Each saved home/space has a stable ID independent of guide, purpose and coordinates. Multiple units at one pin stay separate. Editing a named record auto-saves only that record; area quote/scenario drafts stay intact. Metadata save keeps quote observation/source separate from last-save time. Move/duplicate clears source context, access/journey/permission evidence and comparables. Selected same-purpose records compare up to3 and map as A/B/C, grouping coincident coordinates without offsets. Center crosshair yields to marker text and returns after pan. Public area links contain no named private data; personal reports explicitly export selected/all records.20-record cap and2MB serialization bound protect persistence. Tests/evidence: premises-verification/README.md. Goal remains active; these records are not public listings or independently verified premises.

## Safe concurrent persistence, 25 October

A two-tab probe proved whole-profile overwrites could erase financial inputs. storage.ts now reads/copies valid v1 into separate v2 storage, protecting new fields from cached v1 writers. Web Locks serialize v2 compare-and-write against a per-tab expected revision; the ref updates inside the lock for queued local writes. Stale tabs warn and offer session report/reload instead of overwriting newer records. Unsupported lock/storage access remains explicitly session-only. Clear both versions under the lock. Do not replace this with unguarded localStorage writes or a check outside the lock.69unit tests and real3-width two-tab cases pass; storage-verification/README.md holds evidence. Full professional-shipability goal remains active.

## Everyday-place reference layer, 26 October

An offline, checksum-pinned Geofabrik/OSM snapshot supplies 11,248 actual node
points across six everyday-service categories. Public manifest and 155 bounded,
content-addressed cells live in repository public/data/places/everyday; the Pages
Worker explicitly serves them as current assets. No per-visitor Overpass calls.
The directory recomputes an 800 m straight-line search for the active pin, aborts
old requests, validates all cells, and suppresses snapshots older than 30 days.
Missing/stale/partial coverage never proves absence. Optional category map shows
nearest 30 and zooms to the actual search point. Node edit dates are not observation
dates; opening/access, walking routes, quality and customer demand remain unknown.
Four-decimal coordinates and ODbL attribution/downloadable modified database are
explicit. Public data never enters the private workspace. See EVERYDAY-PLACES.md
and everyday-verification for source contract, tests and independent visual proof.

## Evidence and reading-path continuation, 26 October

Product intent remains PLAN.md sections3–4: actual premises, daily needs, costs
and journeys. Research decisions and fresh catalogue probes are in
`docs/revival-2026-10-26/data-research`. Expanded OSM node categories cover rail
entrances, education, parks and libraries; node-only omissions remain explicit.
Walking route links require an explicit click and are estimates, not checked
journeys. Browser loading now enforces each manifest cell's streamed byte limit,
exact length and raw-byte SHA256 before parsing; partial/corrupt evidence fails
closed. The same-origin manifest is the checksum authority, not an independent
signature. No public data is persisted into private premises records.

Desktop rails become400px at1024 and520px at1440, preserving over60% map width
and readable financial labels. Purposeful open popups can temporarily grow the
phone map to60dvh; closing restores its ordinary height. ResizeObserver updates
open popup autopan after geometry changes. Long source names wrap without clipping
or shrinking type. Header remains45px at normal text. The nearby select uses an
explicit arrow reservation so every full category label fits at30px text.
