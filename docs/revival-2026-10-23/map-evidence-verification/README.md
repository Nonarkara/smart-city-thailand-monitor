# Map evidence verification

The catalog layer reuses the live Atlas location evidence service. Actual Ari response supplied three partial reference records. It does not supply opening dates, public access, retail demand or rental values.

Checked at 390, 1024 and 1440px: pointer selection, source/date/uncertainty text, safe source links, toggle cleanup/restoration, purpose-specific settings, sticky 47px toolbar and no horizontal overflow. Unit suite: 33 checks. Household five-width and economic three-width browser regressions passed.

Visual audit against seven anti-slop rules: content-sized popup; map dominates; popup line length contained; Jost/Prompt retained; source container has functional purpose; map/area/action hierarchy retained; no added toolbar bands, gradients, rounded cards or decorative shadows. Caught and fixed station markers intercepting source points and the pin action covering popup titles. Captures wait for popup opacity and pan transition before inspection.

Source controls remain optional. Layer cleanup removes previous points when evidence changes. Unsafe URLs, duplicate/invalid coordinates and records outside 800m are excluded; distances are recomputed from the chosen center.

Regression verification also exercises keyboard Enter on a source point and a simulated503 after changing area: previous catalog targets must disappear. Simulated failure is not a substituted successful dataset.

Independent rendered/source review passed25October: latest390/1024/1440 source popups fully opaque/readable, title/close/source unobscured, pin/+ yielded correctly, source/date/access caveat explicit; no release blocker. Reviewer: pilot_review.

Production: source3bf13426a73187727b2914da39ba24e381b43aa0, deployment573cffcb, https://bangkok-ioc.pages.dev/places. Public entryindex-CSFX8TtY.js and catalog bundle matched build; market snapshot matched source exactly. Legacy IOC root and Atlas app.js matched pre-release bytes. Live catalog pointer/keyboard/toggle/failure-cleanup/geometry tests passed390/1024/1440. Toolbar47px, no page overflow. Latest catalog/sticky captures are from the public site.

Live economic regression passed390/1024;1440 screenshot hit a30second capture timeout, then passed in an isolated1440 rerun with120second capture allowance. Functional phone run verified arithmetic, five synthetic sourced-comparable entries, persistence, report, purpose/pin isolation and invalidation. Test fixture numbers stay out of public defaults. Browser verifier now supports PILOT_WIDTHS for bounded retries; this does not change deployed application code.
