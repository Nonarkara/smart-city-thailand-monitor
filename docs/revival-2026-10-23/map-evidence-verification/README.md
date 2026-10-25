# Map evidence verification

The catalog layer reuses the live Atlas location evidence service. Actual Ari response supplied three partial reference records. It does not supply opening dates, public access, retail demand or rental values.

Checked at 390, 1024 and 1440px: pointer selection, source/date/uncertainty text, safe source links, toggle cleanup/restoration, purpose-specific settings, sticky 47px toolbar and no horizontal overflow. Unit suite: 33 checks. Household five-width and economic three-width browser regressions passed.

Visual audit against seven anti-slop rules: content-sized popup; map dominates; popup line length contained; Jost/Prompt retained; source container has functional purpose; map/area/action hierarchy retained; no added toolbar bands, gradients, rounded cards or decorative shadows. Caught and fixed station markers intercepting source points and the pin action covering popup titles. Captures wait for popup opacity and pan transition before inspection.

Source controls remain optional. Layer cleanup removes previous points when evidence changes. Unsafe URLs, duplicate/invalid coordinates and records outside 800m are excluded; distances are recomputed from the chosen center.

Regression verification also exercises keyboard Enter on a source point and a simulated503 after changing area: previous catalog targets must disappear. Simulated failure is not a substituted successful dataset.
