# Map-first repair and purpose-led economics

User direction: consolidate three pre-map bands into a thin useful line, make the right panel support location decisions, and design evidence-based rents and operating viability. Header repair is explicitly requested and within the approved pilot. Economic data collection and new scoring are a separate implementation scope, not inferred from existing complaint counts.

## Immediate surgical changes
- PlaceFitPage.tsx: consolidate identity, area selection, Explore/Compare and preferences into one toolbar. Preserve budget, travel, interests, destination, source links, notes, maps and comparison. Put current household fit and its missing checks near the selected place/action.
- places.css: size toolbar to controls; give reclaimed height to map. Desktop map/workspace fits remaining viewport; mobile keeps map and selected-place decision together. Enlarged text can reflow deliberately.
- Browser verification: assert map starts within 64px at normal sizes (previous phone chrome 304px); measure chrome percentage and map area, open settings, compare and report, enlarged text. Independent screenshot review at 390/1024/1440 before publishing. No >30% file shrink.

## Four decision layers, exposed progressively
1. Purpose: live; run a named business; produce/store goods; buy to let. Hard exclusions first (permitted use, access, budget, required utilities). Industry is not inferred from cafe density.
2. Place: timed network access, actual catchment, verified amenities/competitors, usable floor area, local restrictions, environmental exposure. Each feature has source, observation time, coverage and uncertainty.
3. Economics: matched rent evidence and explicit operating/investment scenarios. Separate asking, quoted and agreed rent; never mix residential, retail, office and industrial comparables. Property type, size, frontage, floor, condition, furnishing, lease and included charges must be comparable. Show median, middle-half range, count, age and geographic match; suppress sparse results. Match repeated units and deduplicate agents.
4. Decision: conditions met, disqualifiers, scenario sensitivity and next field check. Map highlights only calculated candidates with adequate evidence; unknown areas remain unknown. No universal investment score.

## Economic contracts proposed for approval
Rent premium = subject rent per usable m² / median comparable rent per usable m² - 1. This is relative to the observed sample, not intrinsic fair value. Record matching and rejected observations.

Time comparison uses repeated comparable units or fixed property/size/lease strata over dated windows. Retain nominal and inflation-adjusted series; record seasonality and structural breaks. A changing luxury listing mix must not be described as rent inflation. No 'normal times' claim without a defined baseline and history.

Business break-even monthly sales = (rent + other monthly fixed costs) / contribution margin fraction. Contribution margin deducts variable costs, including platform fees where relevant. Required transactions per open day = break-even sales / average receipt / open days. Owner pay, working capital and fit-out recovery are explicit inputs. Model low/base/high sales; footfall and conversion are separate measured assumptions, not business-registration counts.

Buy-to-let: net operating income = gross potential rental income less vacancy/credit losses and operating costs (including property tax); net operating yield = NOI / total acquisition and initial fit-out cost. Debt service and owner income tax belong in separate cash-flow calculations; property tax remains an operating cost. No expected appreciation inserted. Loss-making scenarios remain visible. Tenant viability is a separate analysis, not guaranteed by an owner's yield.

## Sources and prior art checked 23 October 2026
- UrbanSim official methods separate numeric estimation, location choice and supply/demand accounting: https://udst.github.io/urbansim/models/index.html . Borrow the separation, not a city-scale simulation dependency.
- PropertySights describes its own Bangkok asking-listing data, sample thresholds, coverage bias and changing listing mix: https://propertysights.com/data-methodology . Quoting permission is not a bulk-ingestion agreement. Evaluate a licensed export before adapters; no current integration claimed.
- DBD describes company records and financial statements: https://www.dbd.go.th/storage/manual/328ae223-5d4f-4b33-8b66-05b0e5265008.pdf . Company headquarters and annual accounts cannot establish shop-level customers, catchment turnover or pedestrian demand.

## Build order
A. Ship header and right-panel household decision hierarchy now.
B. Proposed next increment: one commercial category in a bounded catchment, manual verified rent comparables and user-entered break-even scenario; validate against real operator decisions. General citywide industry/commerce ratings remain out of scope until credible data exists.
C. Rent history and measured demand/competition layers, then explainable candidate-area comparison. No colored opportunity heatmap before coverage and validation gates.

Invariant: absence of a source is an unknown, never a low risk or a market opportunity. The intersection worth exploring is permitted use × reachable customers/amenities × viable costs × the user's needs; a failure of a hard condition cannot be averaged away.
