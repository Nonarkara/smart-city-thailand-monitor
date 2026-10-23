# Purpose and economics increment — 24 October 2026

## Delivered behavior
- Live, Business, Industry and Buy-to-let purposes share one map toolbar.
- Operating scenarios calculate break-even sales, transactions/orders per day, low/base/high surplus, affordable rent at the user's surplus target, and fit-out/working-capital exposure.
- Investment scenarios separate net operating income, operating yield, financing/income-tax cash flow and a +10 percentage-point vacancy stress. Negative results and missed personal targets remain explicit.
- Financial completion cannot approve incomplete premises checks or prove demand. Changing activity resets checks; changing purpose, area or rounded pin selects a separate scenario. A pin outside a guide is labeled Pinned space, not a verified neighborhood address.
- Users can add dated comparable-source records. Five eligible records are required for a rent/m² median and middle-half range. Same user-confirmed conditions, ±20% size, 90-day maximum age and separate asking/quoted/agreed evidence types. Standard tracking parameters are ignored during deduplication; semantic unit IDs are preserved. This is a user-selected sample, not a market valuation.
- PropertySights public aggregate snapshot is attributed citywide residential asking-rent context only. Publisher date 14 October; retrieved 23 October. Hide ranges after 30 days. No commercial, station-area or historical estimate is invented. Reproduce with `node scripts/refresh-place-market.mjs`.
- All private assumptions/comparables stay local. Shared links contain purpose and area IDs; saved personal reports include the user's inputs and source records. Original household and Atlas evidence workflows remain accessible.

## Verification
29 behavior tests pass: `node --test scripts/test-place-fit.mjs scripts/test-economics.mjs`.
Clean web production build plus snapshot byte comparison required before deployment; CI includes both.

Real-browser economic flow at 390/1024/1440: full operating inputs, 5 synthetic comparable URLs with semantic IDs, persistence, area/purpose/pin isolation, activity-check invalidation, comparison, report content, negative investment cash flow, stress case, publisher JSON, household preservation and enlarged text. Scripts: verify-economics-browser.mjs and capture-economics-layout.mjs. Existing household regression script passes 390/799/801/1024/1440.

Filled scenario layout: toolbar 47px at all three sizes; phone primary bottom591px. Final sensitivity header fits; actual monetary outcome has distinct emphasis. Independent reviewer examined final map/form/result/enlarged-text captures and found no visual release blockers.

Capture values are synthetic browser fixtures, not recommended rents or forecasts. Final production verification is recorded below after deployment.

## Data work still needed
Six station guides remain navigation anchors. Industrial use is a premises scenario, not an industrial suitability map. Current customer demand, comparable commercial rents, rent-history baselines, permitted-use records and timed network access need additional verified data/field work. The official DRT source probe in ../demand-source-probe.json covers ARL through March 2026, not current BTS-area storefront demand; it is deliberately not mapped as such.
