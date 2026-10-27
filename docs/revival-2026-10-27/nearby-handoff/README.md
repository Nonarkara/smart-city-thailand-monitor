# Nearby candidates: map handoff and operating-map audit

27 October 2026. Responds to MiniMax review4375dde. Runtime changes are limited
to the existing /places route. The legacy IOC proxy and separate Atlas project
are preserved. Every test mutation below happens in an isolated browser context.

The task: inspect nearby candidates, reach their actual map, and return to the
same list without losing the search pin, category or private premises entries.
The map dominates its task view; the category/source qualification and return
must be readable together. The list keeps its source and route actions in rows.

## Findings and fixes

1. At390x844, checking On map left the result entirely offscreen. Independent
   baseline: control y405.9; map bottom−1344.6; separation1750.5px. At799/800 the
   gap was1552.75px. Desktop's sticky composition avoided that phone failure.
   A mobile View map action now stays with the directory controls; a reciprocal
   Back to candidates action stays with the map's active source caption. Native
   anchors focus the map/directory. View map explicitly recenters the current
   search after panning and closes old popups; it never changes a home/space pin.
2. At30px text with an actual saved home, general pin/dot/A-B-C guidance pushed
   the new return below the first844px. Moving the active category, source date,
   coverage qualification and return before that guidance retains all content.
   Independent before/after return bottom:864.4→669.4px (195px recovered).
   The caption/guidance region's total height stays398.5px. This is regrouping,
   not a font reduction, clipping, disclosure or smaller map.
3. A short/loading Atlas response exposed a desktop containing-block defect.
   The global footer below the workspace forced the viewport-sized sticky map
   upward at document end; its Pin control could disappear behind the header.
   Explore now finishes its evidence rail with the same footer/Clear action;
   Compare retains its global footer. The map keeps its independent viewport
   height. No filler/min-height ties it to the evidence sibling.
4. Count wording repeated plural category names and always said candidates.
   The selected category remains in its control; the count now reads1 mapped
   candidate or13 mapped candidates. The map caption gives category/source/date/
   coverage, without repeating the list count.
5. MiniMax's same-length mutation flipped a closing JSON brace: JSON parsing
   would reject it even without hashing. The verifier now changes a permitted
   ASCII kind string, asserts equal byte length and changed bytes, and proves
   the real cell reader accepts its shape before intercepting it. A missing
   checksum would therefore let this payload through. Both tampered and
   truncated modes must finish at unknown coverage with no partial count.
6. An old browser assertion compared the total marker count before/after an
   OSM toggle. An independently arriving Atlas response changed that total0→3.
   Markers now expose their public source IDs; the test scopes the toggle to
   osm: IDs. The existing delayed-Atlas popup/focus preservation case also passes.

## Geometry budgets and measured states

`verify-nearby-handoff.mjs` renders390x844,799/800/801x900,1024x900,1280x720 and
1440x900. It records chrome, selected-place/intro region, map, directory controls,
first row, document size and action separation in actual browser rectangles.
Normal toolbar remains45px:5.3% of844 and5% of900. Phone operating map remains
295.4px high at390 and315px at799/800. Its source caption/return fit in the same
first view; normal390 return bottom400.1px. The list's active handoff adds38px
at390; its resulting category/count/actions remain together. Desktop shows no
redundant handoff controls. All complete page sizes are in before/after-geometry.
The release does not claim that a longer page is shorter merely because navigation
is now useful. Actual source availability may vary between the two hosts.

Budgets are tied to this task: handoff control/action gap<=32px; entry and return
fully inside the working viewport; map>=240px; category/return gap<=96px; normal
chrome<=64px; no document bleed; exact private rent/category retention; exact
map recenter after a real pan. Desktop map edges allow2px fractional document-end
rounding; the44px Pin must be completely below the header and own its painted
center. The failure being blocked is an obscured operating control, not a1.25px
tile-edge offset. At1280x720, the same operating test remains meaningful.

Negative fixtures restore four actual failures and apply the same gates:
missing View map; an800px separation from directory controls; caption after
all general guidance; and the original footer outside the workspace. Every
fixture must fail. No production data or live DOM is altered outside throwaway
test contexts. BUDGETS_PASS does not certify unobserved product states.

## Verification and independent finding closure

- Shared and web production builds pass;76 unit tests pass. The retired API is
  excluded as previously documented; no fabricated seeds were restored.
- Full existing spatial gate: four purposes, Compare and settings at390/1024/1440;
  editor/save budgets retained;400px falsifiers still reject every regression.
- New production geometry runner: seven normal viewport cases, two503/footer
  cases, and a saved-home30px case; pan/recenter, keyboard focus, source caption,
  unchanged rent and the missing/separated/order/footer falsifiers pass.
- Existing long-title popups,30px category labels, byte-integrity failure paths,
  directory toggles and delayed independent-source arrival pass. Regression
  captures are under regression/; spatial captures under spatial/.
- New-category verifier recomputes expected candidates from the pinned source
  and checks exact source IDs, counts, origin/destination and singular/plural.
- Independent review is under independent-review/: seven widths plus saved-home,
  empty and failed-source30px views, and actual visible loading/failed desktop
  views. Findings1–3 above are closed with those rendered states. Clear works
  in both Explore and Compare, with exactly one footer/action in each.

All seven anti-slop rules were checked: controls retain content-sized geometry;
map/reading regions keep separate tasks; full labels and qualifications remain;
Jost/Prompt and the existing Civic design remain; no ornaments/cards were added;
map→active source/action hierarchy is explicit; no added global chrome, tiny
text or clipped long state is used to manufacture a pass. The new hits above
were task/geometry failures despite passing the earlier font/overflow checks.
Axiom-audit's previously recorded registry404 is not counted as a pass.

## Corrections to the historical record

VERIFICATION.md for26October now explicitly dates its entry-byte observations.
Atlas is independently deployed and legitimately changed afterward. The new
verify-place-release.mjs records timestamped Atlas samples without asserting
an ongoing IOC invariant; it still verifies the legacy IOC proxy across this
release and every currently referenced build asset/manifest cell. The old
preservedEntries JSON remains historical evidence and is not rewritten.

The earlier desktop gain was real and retained: rails360→400px at1024 and
480→520px at1440; business editor1490.7→1410.7px and1370.2→1329.7px. The width
change, not a relaxed budget, reduced that reading cost.

This remains a pilot with dated, partial public reference data. It does not
verify walking access, opening, admissions, rent fairness or customer demand.
