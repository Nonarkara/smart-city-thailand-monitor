# Independent review of release `917458d7` (source `53f871b`)

Reviewed 28 October 2026, after the release of source `53f871b` as Pages
deployment `917458d7`. The handoff work responds to the review in `4375dde`;
the gate correction in `855a176` is carried forward.

## Verified

**The release is what the source says it is.** A clean `npm run build` from
`53f871b` reproduces all five published assets bit-for-bit against the live
deployment: `PlaceFitPage-BXclxrf7.js` `fb2ce5b1…`,
`PlaceFitPage-Bw7kfpcJ.css` `24b5fc34…`, `index-BaApTyHE.js` `9ededcdc…`,
`App-Dnuna3PJ.js` `ceae349e…`, `styles-Do9BlrOS.css` `352185dc…`. The live HTML
is `4a1ac3fc…` and is byte-identical between `bangkok-ioc.pages.dev` and the
immutable `917458d7` host.

**All 167 published resources match the build** — every asset and every
manifest cell fetched from the live host and hashed: 167/167 byte-identical,
0 mismatches. `verify-place-release.mjs` independently reports 167 matched and
the legacy IOC entry unchanged across the release.

**76 unit tests pass** (75 in the previous release).

**The full spatial gate passes on this release** at 390, 1024 and 1440, with
the per-viewport budgets retained and not weakened. The handoff runner passes
all its cases against the public URL: seven viewport sizes, short-source
operating controls, saved-home 30px text, a real pan followed by an exact
recenter, keyboard focus moving to the map and back to the directory, and the
rent, category and "On map" state preserved across the round trip.

**The Atlas scope is now stated correctly.** `verify-place-release.mjs` records
the Atlas as an observation with the note "independent project; may deploy
separately" and asserts no ongoing IOC invariant on it, while still verifying
the legacy IOC proxy. The Atlas root observed now (`98143245…`) matches the
value seen during the previous review, confirming that the earlier difference
came from that project's own deployments.

## A correction this review got wrong

The corruption test written in `4375dde` did **not** prove that the checksum
rejects a tampered cell. The same-length mutation flipped a byte at
`length-2`, and in a real cell that byte is a closing `}` — so the payload
failed `JSON.parse` and was rejected before any hashing happened. The truncated
case was likewise caught by the byte-count check. Both cases proved that
corrupt data yields unknown coverage, which is true and worth testing, but
neither isolated the checksum.

Confirmed directly: the last bytes of a published cell are `Z"}]}\n`, the byte
at `length-2` is `}`, and the original mutation raises a JSON parse error. The
strengthened verifier now changes a permitted ASCII `kind` string instead,
asserts that the byte length is unchanged and the bytes actually differ, and
proves the real cell reader accepts the tampered shape. Only the hash can
reject that payload, so a missing checksum would let it through. Run against
the live release, both tampered and truncated modes finish at unknown coverage
with no partial count.

The general rule: a mutation rejected by an earlier layer proves nothing about
a later one. A test that corrupts data and observes a rejection has not shown
*which* check did the rejecting.

## Geometry reconciliation

The live spatial run reproduces the recorded editor, evidence and save
geometry to the pixel at every width, but the workspace is 87px taller at 1440
and 109px at 1024 while the page is 24px and 44px taller. That reconciles
exactly with the intended change in this release: the global footer moved from
below the workspace into the evidence rail. The rail grew by the footer's
height, and the space below the workspace shrank by the same amount, so the
document grew by the difference. Measured live, the rail (2984.6px at 1440) is
now the tallest child of the workspace and the map keeps its own viewport
height of 855px.

`docs/revival-2026-10-26/spatial-audit/continuation-metrics.json` is therefore
a pre-relocation record from the previous release. It is left as historical
evidence, but it no longer describes the deployed layout, and the current
release's geometry lives in `docs/revival-2026-10-27/nearby-handoff/`.

## One observation on the count wording

The count now reads "1 mapped candidate" or "13 mapped candidates", which fixes
the grammar. The category name is no longer repeated in that sentence; it is
carried by the category control and by the map's source caption instead, which
is the right place for it. The earlier form, "13 mapped rail entrances
candidates", was wrong in grammar and redundant in content.

## Notes on running the gates

The handoff runner failed on its first run here and passed on the second with
no change to the code. The first attempt ran concurrently with the full
spatial gate; two heavy headless Chrome instances on one machine were enough
to time out a click. The failure was contention, not the product. The gate
should still be run on its own, or the budget raised, before a release is
failed on it.

## Remaining

Unchanged and still true: this is a pilot with dated, partial public reference
data. It does not verify walking access, opening hours, admissions, rent
fairness or customer demand. `axiom-audit` remains unavailable and is not
counted as passed.
