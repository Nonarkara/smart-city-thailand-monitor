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
