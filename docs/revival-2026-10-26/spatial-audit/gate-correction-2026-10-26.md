# Gate correction — the reading-cost budget was phone-only

26 October 2026. Independent review of the spatial repair, after deployment
`7b670194` (source `3b13759`). This records a correction to the **gate**, not to
the app. No application source changed and nothing was redeployed: the deployed
bytes are untouched and still identical to `3b13759`.

## Found

The gate asserted a reading-cost budget for the editor only where the viewport
was 390:

```js
if(width===390&&purpose!=='live')assert.ok(metrics.editor.height<1650,...)
```

At 1024 and 1440 there was **no editor budget at all**. Two consequences:

1. The desktop editor grew and nothing noticed. Measured against the same live
   release, the decision column is 360px wide at 1024 and 480px at 1440, so the
   same fields stack taller than they did in the old 50:50 layout: the editor
   went from 1035.6px to 1490.7px at 1024 (+44%) and from 1013.9px to 1370.2px
   at 1440 (+35%). Field counts fell (18 to 16, 13 to 11) and whole-page height
   for business, industrial and investment fell too, so this is narrower-column
   wrapping rather than added content — but the gate could not see it either way.
2. The reported headline, "business editor 30% shorter", was true only of the
   phone. The desktop editor got taller. Both facts are in `comparison-metrics.json`.

The save-form budget was a flat `<450` at every width. It passed, but the
decision rail is 390/360/480px wide at 390/1024/1440, so the same three fields
stack differently and the measured height is 406.5/444.5/377.8px. At 1024 that
left **5.5px of headroom** — a release gate that fails for a reason unrelated
to design.

The screenshot budget was Playwright's default 30s. On a shared machine under
load the full-page capture of a 3,700px page exceeds that, so the gate could
fail a release for a machine condition rather than a layout defect.

## Changed

`scripts/verify-spatial-browser.mjs` now carries per-viewport budgets, because
one flat number cannot hold three rail widths:

| budget | 390 | 1024 | 1440 | measured |
| --- | ---: | ---: | ---: | --- |
| editor reading cost | 1650 | 1600 | 1500 | 1402.7 / 1490.7 / 1370.2 |
| save form reading cost | 450 | 480 | 450 | 406.5 / 444.5 / 377.8 |

The editor assertion now runs at every width for every purpose that has an
editor, and a missing editor is itself a failure rather than a silently
skipped check. A width with no budget defined fails loudly instead of skipping.
Failure messages now carry the measurement and the budget.

Capture budgets: `goto` 120s, full-page screenshot 180s, viewport screenshot
60s — written with the reason, since these pages are 3,700px tall and the
machine is shared.

`scripts/verify-spatial-falsifier.mjs` is new. It injects a 400px spacer into
the decision column and the save form and proves each budget **rejects** the
growth while accepting the real layout. A gate that has only ever passed
proves nothing.

## Verified

| check | result |
| --- | --- |
| full spatial runner against the public URL | exit 0, all widths |
| metrics from that run vs recorded `after-metrics.json` | identical, 0 mismatches |
| old oversized baseline `cd5c4f43` | **rejected**, exit 1, `save reading cost 595px exceeds 450px` |
| falsifier, live URL | every budget accepts the real layout and rejects the injected regression at 390/1024/1440 |
| old gate vs injected 400px desktop regression | **exit 0 — passed a broken desktop** |
| new gate vs the same injected regression | **exit 1 — `business 1024: editor reading cost 1891px exceeds 1600px`** |

The last two rows are the point of this correction: the hole was demonstrated,
not merely read in the source, and the corrected gate is demonstrated to close
it. `falsifier-results.json` holds the per-width evidence.

## Remaining

The desktop budget locks in the **current** editor height, not the old one. The
old 1035.6px editor and the new 360px rail are geometrically incompatible: at
360px wide the same fields must be taller. Recovering the old desktop height
would need a wider rail, which is a design decision, not a budget change. This
gate makes any further growth visible; it does not argue that 1490.7px in a
360px rail is the settled answer.

`axiom-audit` remains unavailable (npm 404, see `axiom-unavailable.txt`) and is
still not counted as passed.
