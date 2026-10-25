# Independently named premises — professional shipability continuation

## Problem and approved direction
The live pilot stores one working household quote per station guide and economic drafts per purpose/guide/rounded pin. It cannot compare two actual apartments or shops in Ari independently. Coordinates also cannot identify floors/units in the same building. This is an explicit product gap against choosing where to live/open a business; the user has directed continued implementation toward professional shipability.

No new public inventory, paid service, recommendation score or inferred demand. All saved premises remain user entries on this browser. Existing area comparisons, maps, reports, purpose contexts and live evidence remain intact.

## Prior art inspected before scoping
QGIS separates spatial bookmark identity/name from its extent/CRS: https://www.qgis.org/pyqgis/master/core/QgsBookmark.html . uMap independently identifies stored layers/features and separates stored metadata from geographic data: https://github.com/umap-project/umap/blob/master/umap/models.py and https://docs.umap-project.org/en/master/deploy/overview/ . Borrow stable identity independent of coordinates and explicit storage/export ownership; do not add either stack or copy its code.

## Data and interaction contract
- A saved premises record has an independent stable ID, user label, purpose, station-guide context, explicit user pin, a quote snapshot, scenario snapshot, comparable snapshot and saved timestamp. Optional quote observation date/source remain unknown when absent; save time is never presented as observation time.
- Two records may share area AND coordinates (different floors/units); edits never silently overwrite another ID. Creating a named record is explicit. Once opened, its costs/checks auto-save to that ID, matching existing local-first forms; metadata changes are explicit. Area drafts remain independent.
- Name + pin are required to save a real-space candidate; absent rent/permissions/demand remain incomplete, not defaults. Saved values do not become verified offers.
- Compare up to three saved premises of the active purpose. Keep the existing area comparison as a separate view within Compare, avoiding another top-bar layer. Name/coordinates, costs, scenario status, source/date and missing checks support the decision. Current household preferences apply consistently to all saved homes; old journey checks remain tied to destination/mode/departure.
- Selected premises appear as A/B/C map markers matched to comparison columns. Source dots and station markers remain available. Click a saved marker/row to restore that premises into the draft, without changing other saved records.
- The current-edit identity is visible. Area/purpose navigation exits that named editor; moving its pin uses an explicit saved-pin action and invalidates checks/source context. Duplication creates a new ID and clears premises-specific checks/sources. Removals are explicit. Existing clear-private-data action also clears saved premises.
- Public shared links continue to contain only area IDs/purpose. Named premises, notes, private prices and coordinates are never encoded in a shared link. Export selected personal comparison explicitly.
- Preserve existing v1 storage when the new property is absent. Persist named selection/mode; shared area links force the area view. Bound records and field sizes; validate restored snapshots and reject malformed imports/records without converting unknown costs to known zero. Do not write a serialized state larger than the reader supports.

## Surgical implementation scope
- NEW premises.ts: stable snapshot model/helpers, purpose filtering/three-selection rules, report serialization and safe restore/update identity.
- NEW PremisesWorkspace.tsx: content-sized save/update form, private saved list and comparison view, reusing existing operating/investment calculations. No new dependency or full-page redesign.
- MODIFY PlaceFitPage.tsx: additive saved-record state, validated persistence, restore handlers and comparison-mode switch; pass selected saved markers into existing map. Keep original area workflows as defaults for old users/tests.
- MODIFY boundaries.ts: additive validated saved-premises property; bounded serialization checks. Reuse current value/date/URL guards; prevent recursive/unbounded parsing and delayed-guide restoration races.
- MODIFY places.css: dense purpose-led workspace/table controls and map candidate labels, using Jost/Prompt, one accent,44px actions and existing reading measures. No new pre-map chrome, decorative cards, shadows or fixed empty space.
- Tests/CI: unit identity isolation at same coordinates, snapshot copies, invalid restoration/size cap, purpose filtering and three-record limit; real browser two premises in one area, same building, restore/update without cross-record loss, map/column identity, changed journey invalidation, persistence/report/private sharing and keyboard flow. Preserve all48 existing tests.

## Release gate
Actual production build and prior household/economic/boundary/map regressions. Capture390/1024/1440 (normal, filled, failure/empty states and enlarged text), independent rendered/source review, then commit/push/direct Pages deploy/live proof. Verify no legacy IOC or Atlas bytes changed. This feature advances the goal; it does not establish local demand, market fairness/history or citywide investment suitability.

Implementation refinement: independent saved-record editing prevents restoring a named space from overwriting legacy area quotes. Auto-save costs/checks to that record; metadata form saves name/date/source explicitly. This removes hidden unsaved financial snapshots. Duplicate records copy only cost assumptions and clear route/access/permissions/observations.
