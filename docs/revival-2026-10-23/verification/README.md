# Place-fit verification — 23 October 2026

13 behavior tests and shared/web production builds pass. Standalone Chrome checks pass at widths 390, 699, 701, 1024 and 1440. Phone flows cover home pinning, three-area comparison, entered costs/access, destination changes invalidating old journeys, personal-report download, expanded preferences and enlarged text. The map instruction row is checked against control overlap, including enlarged text. One-area comparisons fit the phone viewport; three-area comparisons deliberately scroll with fixed row labels.

Independent rendered review inspected phone/tablet/desktop, comparison and enlarged-text captures and found no visual release blockers. These are desk and browser checks, not field verification of pedestrian routes, rents, neighborhood conditions or willingness to pay. Unknowns remain visible in the product.

Reproduce with `node --test scripts/test-place-fit.mjs`, shared/web builds, then `PILOT_URL=<published /places URL> node scripts/verify-place-fit-browser.mjs`. PLAYWRIGHT_MODULE_PATH and CHROME_PATH select an installed Playwright/Chrome runtime. Test report contains synthetic entries only.

Atlas location evidence is deployed separately at atlas.nonarkara.org/api/location/evidence. Legacy IOC routes and data are retained through the immutable original deployment. The consumer pilot is additive at /places.
