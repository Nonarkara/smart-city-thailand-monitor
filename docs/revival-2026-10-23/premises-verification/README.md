# Named premises verification — 25 October 2026

## What changed
Users can keep independent named apartments, shops or industrial premises, including multiple units at exactly the same pin. UUID/secure random identity is separate from station-guide context and coordinates. Costs/checks auto-save to the selected record; existing area drafts remain separate. Name/date/source use an explicit metadata save. Moving or duplicating clears location-specific checks, quote observation/source and comparable matches. Copying never establishes a verified offer.

Up to three records of the active purpose compare with the same existing calculations. A/B/C match report/table/map identity; coincident units share a menu at their actual coordinate, with no invented offsets. Metadata distinguishes source observation date from save time. Personal reports export selected or all saved records explicitly. Shared area URLs never include named records or personal values.

Storage is additive to v1, capped at20 records with bounded fields and serialization. Oversize writes fail before replacing a readable prior workspace. Failed storage/clear states stay visible. Current record/selection/mode restore against validated guides. A public area share forces the original area comparison, keeping private identities local.

## Evidence
-62 unit tests passed; unit-results.txt contains the full output. Existing48 tests are preserved, with added independent identity, same-coordinate grouping, snapshot copying, purpose/three-record limits, invalid restoration, source/move clearing, old v1 compatibility, oversize write and secure-ID fallback checks.
- Web production build passed; final entry index-DTxBk1oi.js, pilot bundle PlaceFitPage-CWnXSMjR.js, CSS PlaceFitPage-OAJ38wc1.css.
- Real Chrome named workflow passed390/1024/1440: two same-pin units with different rents, independent editing, metadata removal/restoration, duplicate/move invalidation, source/date unknowns, stored reload, personal report, private-share separation, preserved original household/business area drafts, keyboard grouped marker selection, crosshair yield/pan restore, maximum3 selection and purpose separation. Tested extreme monetary input, a120-character unbroken name, enlarged text and44px save target. Synthetic personal entries exist only in isolated test contexts; none are application defaults or public inventory.
- Previous household5-width, economics3-width, boundary recovery9-case and live Atlas catalog3-width regressions all passed on the same frozen build. Catalog tests use the actual service, while named financial tests deliberately exercise service503 degradation without substituting successful market data.
- gitleaks dir apps/web/src/places --redact: no leaks found in scanned pilot source; not a historical-repository claim.

## Findings fixed before release
Duplicate sibling editor/save keys retained stale form DOM after a pin change; prefixed keys and a one-editor browser assertion closed it. Clearing optional source/date was undone by a parsed-full-record/partial-merge mismatch; explicit unset fields and stored-state assertions closed it. A tablet crosshair covered A in A · B; actual DOM intersection now hides it only during overlap and restores it on pan. Long unbroken names widened the phone page to2554px; scoped wrapping now keeps it390px. Relevant diagnostic attempt files are retained.

The normal toolbar remains a single content-sized row under64px (normally47px). The final390 stress screenshot enlarges text and may reflow controls vertically; do not mistake that intentional accessibility state for default chrome. Comparison-top images are normal viewport captures at page top; full-page images may show sticky-header capture artifacts. Map captures prove marker/layout behavior, not complete tile-source availability.

No rent fairness/history, actual demand, investment return or property-level risk is established by named storage. These remain user scenarios with explicit missing checks. The full professional-shipability goal stays active.

Independent source/rendered review passed after all targeted fixes. Reviewer inspected final390/1024/1440 comparison/map states, source-clear semantics, coincident-marker readability and the120-character phone-name case; no remaining blocker. Source is frozen for deployment.

Before publication, the additional two-tab audit required v2/lock-protected persistence. Current total is69 tests; storage-verification records migration, concurrency and recovery. All named and prior workflows pass with that storage layer. The named feature's initial11a0071 commit was deliberately held from production until this data-loss risk was closed.
