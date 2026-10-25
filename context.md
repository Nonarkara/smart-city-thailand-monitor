# Place-fit pilot context

Approved 23 October 2026: a six-area household comparison before business
location studies. The legacy IOC remains accessible. No paid checkout yet.

Invariant: a place can meet a household's entered limits only when the evidence
required by those limits is present and checked for the current scenario.
Changing destination, travel mode, departure time or home pin invalidates the
journey check. Rent and monthly extras remain user entries, never market averages.

## Design read

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
