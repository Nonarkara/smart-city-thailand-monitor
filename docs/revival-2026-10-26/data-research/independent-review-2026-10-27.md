# Independent review of release `1edf1e93` (source `1c310d2`)

Reviewed 27 October 2026, after the release of source `1c310d2` as Pages
deployment `1edf1e93`. The earlier spatial repair (`3b13759` / `7b670194`) was
verified separately on 26 October; the gate correction in `855a176` is carried
forward here.

## Verified

**The release is what the source says it is.** A clean `npm run build` from
`1c310d2` reproduces all five published assets bit-for-bit against the live
deployment: `PlaceFitPage-UgJmKVFa.js` `01471021…`,
`PlaceFitPage-CgMKn77N.css` `ce8b2e5a…`, `index-Bcz4SaLq.js` `283f7ebd…`,
`App-CNTTuc8E.js` `b8f602cf…`, `styles-Do9BlrOS.css` `352185dc…`. The live
HTML is `794d1905…` and is byte-identical between `bangkok-ioc.pages.dev` and
the immutable `1edf1e93` host, so the release under test is still the one
published.

**All 167 published resources match the build.** Every asset and every
manifest cell in `live-bytes.json` was fetched from the live host and compared
byte-for-byte: 167/167 identical, 0 mismatches.

**The candidate data matches the manifest.** `manifest.json` declares 161 cells
and 12,049 places, with a maximum cell of 340,258 bytes. Reading the cells
directly gives exactly 12,049 places in the same nine categories: food 7,429;
groceries 2,634; health 804; transit 419; education 298; fitness 184; culture
147; markets 103; green 31. The four added categories total **801** — 419 rail
entrances, 298 schools/childcare, 31 parks and 53 additional libraries.

**The new categories render in the live UI with real evidence.** At Bang Na
(all four categories populated within 800 m) the live page shows manifest-backed
counts — "13 mapped rail entrances candidates within 800 m", one school, one
park, one culture/library — each row carrying an OpenStreetMap source link and
a walking route link whose origin is the current pin (13.6681, 100.6045) and
whose destination is the candidate itself. Where a category genuinely has
nothing nearby, the page says "No matching points in this snapshot. Nearby
availability is unknown." rather than showing an empty or invented list. The
window is 800 m straight-line, and route links are external estimates: the page
states that gates and crossings are unverified.

**Corrupt data makes coverage unknown.** `boundaries.ts` verifies the byte
count and then the SHA-256 of the original bounded bytes before parsing. Tested
against the live release by corrupting the served cells two ways: a
same-length byte flip (the size check passes, the hash must catch it) and a
truncated body (the size check must catch it). Both produce "Everyday-place
snapshot unavailable or out of date. Coverage is unknown; your comparison still
works." and publish **no** candidate count. A corrupt cell cannot become a
plausible partial count.

**The gate passes on this release, with the budgets tightened.** The budgets
from `855a176` were tightened rather than loosened once the desktop column
improved: editor 1600 to 1500 at 1024 and 1500 to 1450 at 1440, with the
measured editor now 1411 and 1330. The full runner exits 0 against the public
URL at 390, 1024 and 1440. The falsifier still holds: every budget accepts the
real layout and rejects an injected 400px regression at every width.

**The research record is faithful.** The BMA park probe was re-run live
(HTTP 200; the host needed a patient timeout, about 35 s end to end) and the
dataset id, title, `License not specified`, `metadata_modified`
`2024-06-17T05:54:04.549560` and both resource URLs are identical to
`probes.json`. The two GTFS catalogue searches still return HTTP 200 with zero
matches, recorded as a negative catalogue probe rather than as evidence that no
feed exists. The research report keeps provider documentation, actual
retrieval and planned integration apart, and states plainly that the BMA park
and school catalogues have unspecified licences and must not be redistributed
under assumed ODbL terms.

## Corrections to the record

**"Legacy IOC and Atlas entries remain unchanged" — half true, and now stale.**
The legacy IOC entry is byte-identical: `bangkok-ioc.pages.dev/` is
`4b0732c3…` exactly as recorded. The Atlas is not. Its root is now 106,297
bytes (`98143245…`) against the recorded 103,031 bytes (`f352fb43…`). The Atlas
is a separate project with its own deployments — `bkk-3d-atlas` has its own
build-stamp commits, including one at 18:38 on 27 October — so this change came
from that project's own release and not from this one. The claim was accurate
when written and is now out of date; it should be read as a snapshot, not as a
standing invariant.

**The desktop editor got shorter, not taller, in this release.** Reported
against the same live release: the editor went from 1490.7px to 1411px at 1024
and from 1370.2px to 1330px at 1440, because the decision rail widened from
480px to 520px. The save form went from 444.5px to 377.5px at 1024. This is
the answer to the open question left on 26 October: the taller desktop column
was worth reducing, and the rail width was the lever.

## Scripts added by this review

- `scripts/verify-corrupt-cell.mjs` — corrupts served cells and proves coverage
  goes unknown with no published count.
- `scripts/verify-new-categories.mjs` — proves the four new categories render
  manifest-backed candidates with route links, and that empty areas say so.

## Remaining

Nothing in this release is a field survey. Opening hours, accessibility,
entrance-to-home walking routes and the size of the school and park omissions
are unverified; supply counts do not establish demand. `axiom-audit` remains
unavailable and is not counted as passed.
