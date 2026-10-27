# Evidence and spatial continuation

26 October2026. Before: deployment7b670194 / source3b13759, independently corrected
gate855a176. After: code and measurements in this directory plus
`../spatial-audit/continuation-*`. Research/source decisions: README.md.

## Found and changed

The desktop financial rail wrapped complete labels into long reading paths.
Rail widths increase360→400 at1024 and480→520 at1440; map widths remain624/920
(over60%). Numeric inputs retain13ch plus padding, full field labels and all
existing actions. No feature or source qualification is clipped to claim fit.

| Business reading path |390|1024|1440|
| --- | ---: | ---: | ---: |
| Before editor height |1402.7|1490.7|1370.2|
| After editor height |1402.7|1410.7|1329.7|
| Before save form |406.5|444.5|377.8|
| After save form |406.5|377.8|357.5|
| Before complete page |3712|3579|3110|
| After complete page |3730|3291|3008|

Phone page adds18px for route actions and contextual qualifications. Its editor
height is unchanged. The header stays45px (5.3% of844px;5% of900px). Existing
map-first composition, comparison, settings and all four purposes remain.
Desktop editor budgets tighten1600→1500 and1500→1450; the existing400px
falsifier rejects regressions at all three widths. Phone budget remains1650.

New category names exposed a30px-text native-select arrow collision. All nine
full labels now fit using the same explicit arrow reservation as the header.
No category is renamed merely to satisfy a selected-option-only measurement.

Long source names exposed a real popup defect: a source popup could outgrow the
phone map. Open popups now earn a60dvh phone map, wider bounded text and a resize/
autopan update. Closing restores ordinary map height. No source fields are hidden.
A second visual check found zoom controls painting over source text despite
passing bounding-box checks. Raising only popup-pane z-index was ineffective
inside Leaflet's transformed map-pane stacking context; zoom controls now yield
while a popup is open, like the existing pin controls, and return on close.
Attribution stays visible. The new test uses elementFromPoint at the overlapping
rectangles to establish which element actually receives the painted hit.

## Verification

- Shared and web production builds pass. The retired API remains outside this
  release; its documented missing exports are not repaired with fabricated data.
- Existing69 unit cases pass; the new integrity case and six catalogue cases
  pass (76total), plus two source-filter Python cases.
- Shipped catalogue is12,049 points with exact counts/hashes/byte bounds and
  original source checksum/header.12049 is a catalogue count, not city coverage.
- Full spatial runner covers four purposes, Compare and open settings at390/1024/
  1440. Full-page and scrolled-map captures record preserved controls and content.
- Existing everyday browser tests cover directory/source links, toggles, stale/
  unavailable snapshots and late independent-source arrival without losing popup
  identity or keyboard focus. Catalog regression runner passes all three widths.
- New evidence runner checks all category labels at30px, explicit walking route
  origins/destinations,300-character names with100-character sources, complete
  source visibility, popup paint precedence and close restoration. A same-length,
  schema-valid cell mutation must produce unknown coverage and zero partial rows.
- Independent review by a separate agent found the streaming-integrity buffering
  risk, enlarged-label problem and long-popup defect; each was addressed before
  release. Reviewer captures and metrics are in `independent-review/`.

All seven anti-slop rules were checked against rendered states: content-sized
controls and shorter desktop forms; map/decision balance; bounded prose and full
labels; existing Jost/Prompt; no ornaments; map then selected decision then
supporting evidence; no added chrome/hero/cards. Actual new hits and their fixes
are above. The map and comparison data earn the remaining scrolling.

The whole product is still a pilot. This release does not establish field-checked
walking access, admissions, environmental history, long-term rent benchmarks,
customer demand or commercial site viability. Public dataset metadata without
an explicit reuse licence remains research, not ingested evidence.

## Live release proof

Runtime source `1c310d2`, Cloudflare Pages deployment `1edf1e93`.
Public URL: https://bangkok-ioc.pages.dev/places
Immutable URL: https://1edf1e93.bangkok-ioc.pages.dev/places

Public-URL evidence and spatial runners pass all assertions at390/1024/1440,
including30px labels, painted popup precedence, exact route origins, corrupt-cell
suppression, all four purposes, Compare and settings. Live spatial metrics match
local production metrics exactly. The live falsifier accepts the real geometry
and rejects every400px injected regression.

`live-bytes.json` verifies every current build JS/CSS bundle, the manifest and all
161 manifest cells byte-for-byte against the public URL (167matched resources).
At the 26 October release check, legacy IOC and Atlas entry HTML matched their
predeployment captures. This is a timestamped observation: Atlas is an independently
deployed project and its root changed in its own later release, as documented in
independent-review-2026-10-27.md. Atlas equality is not an ongoing IOC invariant.
No Atlas service or retired API was deployed by this change.

The original axiom-audit registry404 remains recorded in the earlier spatial audit;
it is not counted as a passed check. Rendered and independent evidence above are
the visual proof. This proof-only follow-up does not change deployed runtime bytes.
