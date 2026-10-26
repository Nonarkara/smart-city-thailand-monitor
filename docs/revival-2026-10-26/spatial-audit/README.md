# Whole-path spatial repair

26 October 2026. Scope: Live, Business, Industry, Buy to let, area and saved-space
comparisons, settings, source entry, populated calculations and recovery states.
The preserved legacy IOC entry and Atlas map are separate from this repair.

The earlier component checks missed the full reading cost. The phone business
page was 4,900px; its editor 2,018px and its three-field save form 595px. Desktop
forms began below a full viewport map and forced a 50:50 split, leaving a long
empty results half. Numeric boxes stretched to 332px and sometimes inherited
the height of a wrapped label. Settings and comparison actions were scattered.

## Changed

Explore now has a 2/3 working map beside one continuous 1/3 decision column.
The map stays alongside the current work during ordinary document scrolling;
the rail has no nested vertical scroll. Phone composes map, place/action and
forms deliberately. All inputs, data layers, source links, calculators, named
records, reports and privacy controls remain.

Palette/MoMA alignment and spacing roles govern the column. Numeric fields are
bounded label/value rows; URLs get a readable full row. At enlarged text or
narrow reading widths, fields stack before their captions become character
columns. Missing inputs get compact pending-calculation text; actual entered
sales restore the full sensitivity table and its qualifications.

Saved comparisons use A/B/C column headings, with full identities in the selected
list, provenance and accessible headings. This prevents a 120-character name from
inflating every column. Related actions wrap beneath readable names when needed.
Dropdown label widths are measured, including the longest station names. Dense
text-control groups retain at least 32px height and 4px separation; isolated primary
actions and map controls retain 44px, following the owner's current MSH rule.

## Measured

| Phone section | Before | After |
| --- | ---: | ---: |
| Business page | 4,900px | about 3,712px |
| Business editor | 2,018px | 1,403px |
| Industrial editor | 1,996px | 1,382px |
| Investment editor | 1,431px | 1,125px |
| Save form | 595px | about 406px |
| Normal toolbar | 47px | 45px |

Wide numeric controls now measure about 152×32px. Actual map tiles loaded in
scrolled editor captures: 6 on phone, 20 on tablet/wide, with no map error.
Some household document heights increase on wide screens because the evidence
follows in one column; the map remains visible alongside it. Raw page height
alone is not the task-quality measure. `comparison-metrics.json` retains all
before/after measurements, including increases.

## Seven-rule rendered audit

1. Content-sized boxes: corrected stretched controls, repeated unknown result
   shapes and oversized save form. All values and qualifications remain.
2. Composition: working map + continuous task rail removes the abandoned results
   half and separate left-hand evidence tail. Compare makes its table dominant.
3. Reading measure: prose stays within 65ch; text-enlargement checks verify readable
   name/criterion widths. Numeric captions stack at narrow font-relative widths.
4. Typography: approved Jost/Prompt retained, with three normal-view type roles.
5. Ornament: no cards, shadows, gradients, icons or decorative bands added. The
   dropdown caret is a functional affordance with an explicit text-space budget.
6. Hierarchy: map, selected place/action, then calculation/evidence. Criteria remain
   body labels rather than oversized headings competing with place identities.
7. Chrome and bleed: one 45px normal toolbar, full dropdown labels, no document
   horizontal overflow. Wide comparison tables retain an explicit scrolling region.

Independent whole-path review caught enlarged name compression, long repeated
table headings and unsettled map captures. These were repaired and re-captured.
A further large-text sweep caught the same caption compression in numeric forms;
the font-relative field-container rule fixes it. Final review found no remaining
visual blocker in the reviewed states.

## Reproduction and regression evidence

- `node scripts/verify-spatial-browser.mjs`: four purposes at 390/1024/1440, Compare,
  open settings, section budgets, full dropdown labels, scrolled working-map proof.
- `verify-economics-browser.mjs`: populated business/investment calculations,
  five sourced comparables, reports, isolation and 30px text; source URL editing
  measure is at least 300px on phone.
- `verify-premises-browser.mjs`: three widths, independent coincident units,
  private reports, 120-character names and 30px text. Enlarged name spans must keep
  at least 240px; repeated names cannot push the table header over 100px; criterion
  columns keep at least 180px in the enlarged phone case.
- The previous blanket 44px saved-action assertion was updated to the owner's
  explicit dense-group 32px/4px rule. Reading-width and table-header checks were
  added alongside it; a page-width check alone cannot clear spatial quality.
- Household flows pass 390/799/801/1024/1440, including three-way comparison,
  changed journey evidence, preferences and enlarged text.
- Boundary recovery, storage failure, deadlines, malformed guide/publisher data
  and delayed guide cases pass. Civic and everyday map interactions also pass,
  including the late-source popup/focus regression and unavailable/stale snapshots.
- 75 JavaScript tests, two Python source checks, shared/web builds and source/built
  secret scans pass. The retired API is not deployed; its preexisting build issues
  are outside this frontend release.

The old immutable release is deliberately run against the new section budget and
rejected; see `regression-proof.json` and `baseline-rejected.txt`. Restoring the
oversized layout therefore cannot silently pass the new gate.

## Gate correction, 26 October 2026

The reading-cost budget above was phone-only: the editor assertion sat inside
`if(width===390)`, so no editor budget existed at 1024 or 1440. The desktop
column grew to 1490.7px at 1024 (+44%) and 1370.2px at 1440 (+35%) without the
gate noticing, and "business editor 30% shorter" was true only of the phone.
Field counts fell (18 to 16, 13 to 11) and whole-page height for business,
industrial and investment fell too, so the taller column is narrower-rail
wrapping rather than added content — but the gate could not see it either way.

Budgets are now per viewport, because the decision rail is 390/360/480px wide at
390/1024/1440 and one flat number cannot hold three widths: editor
1650/1600/1500px, save form 450/480/450px. A missing editor now fails instead of
silently skipping, an undefined width fails loudly, and capture budgets were
raised so a loaded shared machine cannot fail a release for a machine condition.

`verify-spatial-falsifier.mjs` injects a 400px regression and proves every
budget rejects it while accepting the real layout. The hole was demonstrated,
not merely read: the old gate exited 0 on an inflated desktop, the corrected
gate exits 1 with `business 1024: editor reading cost 1891px exceeds 1600px`.
Full record in `gate-correction-2026-10-26.md` and `falsifier-results.json`.
No application source changed and nothing was redeployed.

Unavailable check: `axiom-audit` returned npm 404 from the configured registry;
`axiom-unavailable.txt` records it. This is not counted as passed. The rendered
audit and independent review above are the actual spatial evidence.

This repairs the UI; it does not manufacture demand, historical rent fairness,
verified walking routes or production maturity. The broader shipability goal
remains open.

## Live proof

Source `3b1375929f99a159c4d4c44a206d853072a87e6c` deployed as Pages `7b670194`.
Public URL: https://bangkok-ioc.pages.dev/places
Immutable deployment: https://7b670194.bangkok-ioc.pages.dev/places

The complete spatial runner passes on the public URL: all four purposes at 390,
1024 and 1440, comparisons, open settings, full dropdown labels, section budgets
and scrolled working-map checks. `after-*` captures/metrics are live; the local
metrics are retained as `local-after-metrics.json`. `live-bytes.json` proves exact
JS/CSS equality to the tested build and byte-identical legacy IOC root/Atlas map
assets before and after this deployment. The current metadata-only proof commit
does not require another frontend deployment.
