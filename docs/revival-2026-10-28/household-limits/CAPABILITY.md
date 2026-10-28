# Household hard constraints — capability increment

28 October 2026. Branch `feature/household-hard-constraints`, built on the
merged pilot release `1a3399e` (deployed as `d658eb1d`).

## The gap this closes

`PLAN.md` §4 makes the household decision's hard constraints explicit: "quoted
rent and fees, **bedrooms**, **pets**, car availability, required destinations
and maximum commute". It then states the rule that governs them: "unknown
evidence remains unknown and **cannot silently pass a hard constraint**".

Two of those six constraints were not in the product at all. Bedrooms and pets
existed in no preference, no quote, no assessment, no comparison and no report.
The consequence was not a missing feature but a false assurance: a household
that needs three bedrooms and keeps a dog could enter a rent that fitted, tick
"walking route checked", enter a journey inside the limit, and be told
**"Meets your entered limits"** — with zero reasons and zero unknowns. The
shipped `assess()` returned that verdict for a 1-bedroom, no-pets unit as
well, because it never asked.

Verified against the shipped logic before any change:

```
status  : Meets your entered limits
reasons : []
missing : []
total   : 25000
```

A green status that cannot be reversed by the single fact most likely to
reverse it is exactly what the plan forbids.

## What changed

**Model** (`placeFit.ts`). The household states a requirement; a premise
carries a fact.

- `Preferences.bedroomsNeeded` — minimum bedrooms the household needs, an
  integer 1–20. Undefined means no such requirement; it is not a guess.
- `Preferences.petsNeeded` — the household has pets, so the building must allow
  them.
- `Quote.bedrooms` — bedrooms in this specific home. 0 is a studio. A fact
  about one building only.
- `Quote.petsAllowed` — `"yes" | "no" | "unknown"`. A fact about one building
  only.

**Assessment.** A stated requirement is never passed by an unchecked premise.

- Requirement stated, premise not checked → **Needs checking**, with the
  requirement named: "Record the bedrooms in this home; your household needs
  3." and "Confirm whether pets are allowed in this building."
- Requirement stated, premise contradicts it → **Does not meet your limits**:
  "This home has 1 bedroom; your household needs 3." and "This building does
  not allow pets."
- Requirement stated, premise satisfies it → the check passes and stops asking.
- Requirement not stated → nothing is added. A household that does not state a
  bedroom or pet requirement sees exactly the behaviour it saw before, and a
  premise with one bedroom is not invented into a failure.

**A fact about a building does not survive a move.** `relocatePremises`,
`duplicatePremises` and placing a new pin now clear the bedrooms and the pet
policy, alongside the journey, access, permitted use and observation source
they already cleared. Re-pinning the map and calling the old bedroom count
"this home" would be the same error the code already guards against for
journeys and permitted use.

**Validation and persistence.** New fields are validated on restore: a bedroom
count outside 0–20, a requirement outside 1–20, or a pet policy that is not
one of the three states is dropped and the read is flagged as recovered. A
workspace saved before these fields existed still loads and states that no
requirement is recorded. Nothing migrates, because nothing needs to: the
fields are optional and an absent field means "not stated".

**Surfaces.** The requirement is entered in the limits panel beside the
ceiling; the facts are entered beside the quoted rent. The comparison table
carries **Bedrooms** and **Pets** as rows that state the premise and the
requirement together ("1 bedroom — you need 3"). The report carries the
household requirement, both per-premise facts, and a visit checklist derived
from what is still unresolved, so a visit is aimed at what is actually unknown
rather than at a generic list.

**One accessibility defect fixed on the way.** The "Home-to-station access"
select had no explicit accessible name, so its name was computed from the
wrapping label and included its own option text: "Home-to-station access Not
checked Walking route checked Car / feeder needed". It now carries an
explicit label, as every other select in the app already did.

## Verified

| check | result |
| --- | --- |
| unit suite | 94 pass, 0 fail (79 before this increment) |
| household rules, including hostile input | 15 new tests |
| persistence round trip and invalid-value rejection | 4 new tests |
| building facts cleared on move and duplicate | 1 new test |
| rendered gate `verify-household-limits.mjs` | pass: unchecked → "Needs checking" with both requirements named; one bedroom → "Does not meet your limits"; pets refused → "Does not meet your limits"; both satisfied → "Meets your entered limits"; comparison carries both rows |
| full gate suite against this build | see the deployment record |

The rendered gate is the one that matters. A model test proves the logic; the
gate proves the product tells the user.

## What this does not claim

Still true and unchanged: this is a pilot over dated, partial public reference
data. It does not verify walking routes, opening hours, admissions, rent
fairness, property-level risk or customer demand. Bedrooms and pet policy are
the user's own entries about a home they have seen — the app records and
compares them; it does not observe them. A household requirement that is not
entered is not inferred, and a premise that has not been checked is never
green.
