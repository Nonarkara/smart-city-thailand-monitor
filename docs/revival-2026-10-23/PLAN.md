# Bangkok IOC: find the Bangkok that fits your life

Research and implementation proposal · 23 October 2026 · status: proposed, no runtime changes.

## Decision

Build a place-comparison product for people choosing where to live or open a business. Start with a housing pilot. Keep the business lens separate and test it with real operators before claiming commercial demand intelligence.

The user’s direction: budget, quality of life, interests, the city’s beauty and local businesses, rail-oriented living versus car-dependent gated communities, building on the legacy, MSH first, and a possible freemium business.

The question is: can sourced local evidence help a person make a better shortlist before paying a deposit or signing a lease? Existing products prove that rental search and site analysis are established categories. They do not prove willingness to pay for this proposed product.

## 1. Recovery: where the old system lives

| Component | Verified location or state |
| --- | --- |
| Old public site | https://bangkok-ioc.pages.dev — HTTP 200 |
| Cloudflare project | `bangkok-ioc`; also lists `bangkok.nonarkara.org` as a domain; that custom domain was not separately tested |
| Hosting mode | Cloudflare Pages direct upload; project listing says Git Provider: No |
| Current production deployment | `fa6ccef0-4472-4fd2-963a-fd6379be5850`, branch `main`, source `0130769` |
| Matching source commit | https://github.com/Nonarkara/smart-city-thailand-monitor/commit/0130769d9b7767e37f75869e9c0a1641cfc4c604 |
| Source repository | https://github.com/Nonarkara/smart-city-thailand-monitor |
| Recovered repository revision | `8110db99e3984b0994e97f0399183456b57b7def` |
| Legacy stack | React/Vite/Leaflet frontend; Fastify backend; shared types and seed data |
| Legacy API | https://smart-city-monitor-api.onrender.com/health returned an HTML Service Suspended page |
| Atlas source | https://github.com/Nonarkara/bkk-3d-atlas |
| Atlas deployment | Cloudflare Worker, R2 buildings, D1 civic data; https://atlas.nonarkara.org |

The served HTML calls itself Muang Thong Thani Super Dashboard v4.0.0. After loading, the browser title becomes Bangkok Governor’s IOC and the UI says v3.0.0. This is identity drift within the legacy application, not evidence that its source has disappeared.

The old CLAUDE.md says pushes automatically deploy Pages and Render. Cloudflare’s current project record contradicts the Pages claim. A GitHub push alone must not be treated as a production release.

The current Atlas checkout has unrelated building-rendering work in progress. Do not stage, discard, deploy, or rebase that work as part of this migration. Use an isolated branch/checkout for implementation.

## 2. Donor assessment for Atlas

The invariant: every transferred fact keeps its source, observation period, geographic scope, and uncertainty. A fetched timestamp never turns an old or generated value into a live observation.

| Donor organ | Evidence | Decision |
| --- | --- | --- |
| CKAN discovery idea and text normalization | `apps/api/src/adapters/ckanHelpers.ts`, BMA/TAT/TCEB adapters | Adapt the discovery method. Keep datasets as datasets, with resource links and licences. Remove invented project completion, confidence, dates and live status. |
| Typed source states | Shared types and `AdapterSyncResult` | Reuse the distinction between live/delayed/stale/manual where compatible with Atlas; add observed/reference/modelled/editorial/unknown evidence types. Do not bring seed hydration into the live path. |
| CCTV cache/probe pattern | `apps/api/src/services/publicCctv.ts` | Preserve as prior art. Atlas already has cameras and caches. A successful image HTTP request does not establish current imagery; require image time and preserve colocated cameras with different views. Do not copy distance-only deduplication. |
| Bangkok passages and local place material | `packages/shared/src/mockData.ts` | Editorial review queue only. Verify place existence, location, relevance, source and rights before publishing. Never label it surveyed or current merely because it shipped in a seed. |
| Weather, air, traffic and satellite source references | Adapter/config inventory | Most overlap Atlas. Check gaps, then reuse Atlas feeds. Do not create a second polling system. |
| TAT/TCEB catalog adapters | Donor endpoints checked below | Hold. One returned zero matches; another returned 404. Catalog metadata also cannot establish neighborhood customer demand. |
| BMA roads, canals, drainage | `bmaGisRoadsAdapter.ts`, `bmaGisCanalsAdapter.ts`, `bmaGisDrainageAdapter.ts` | Quarantine. These call `generateMockBangkok*` yet return live status. Keep Atlas’s sourced geometry. |
| Bangkok public statistics | `bangkokPublicStatsAdapter.ts` | Quarantine. `generateMockBangkokStats` is returned as live. Some index-based summary fields are also mislabeled. |
| AlphaEarth change artifacts | `apps/web/public/data/alphaearth/change-bangkok-core-2023-2024.json` | Reject this artifact: NaN and Infinity make it invalid strict JSON and the statistics unusable. Recompute and validate before any later reuse. This finding applies to the inspected file, not every satellite source. |
| TimesFM forecasts | Old dated files; Atlas explicitly reports no connected inference service | Hold until production method, inputs, run time and out-of-sample validation exist. |
| Market/crypto/lottery panels | General monitoring content | Preserve in the legacy view. They do not earn space in a housing comparison. |
| Whole Fastify service / 5,000-line UI | Suspended backend and mixed seed/live behavior | Preserve the source, avoid transplanting the whole application. |

No donor code has been integrated into Atlas in this research change. The table is an audited transfer plan, not a claim of completed migration.

### Live feasibility checks

Full requests, check times and response summaries are in [source-probes.json](source-probes.json). Checked on 23 October 2026; endpoint success is a point-in-time observation.

- Atlas `/api`: JSON catalog responds.
- Atlas `/api/civic-pois`: 1,725 features returned. That is a catalog count, not a complete survey of Bangkok amenities.
- Atlas `/api/atlas/at-this-point`: returns district, land context, flood context and nearest transit. Its `walkable` label is not a verified pedestrian journey. Its flood envelope is schematic and road passability is unknown. Do not use either as a lease or investment verdict.
- `data.bangkok.go.th` CKAN search works. The sample garden query returned 60 matches, including unrelated substring matches. Two relevant sample packages had unspecified licences. Validate relevance and individual resource permissions before ingest.
- Donor `citydataportal.bangkok.go.th` CKAN URL: HTTP 404.
- Donor TAT query `tourism bangkok`: valid JSON with zero matches. This does not mean TAT has no usable data; improve queries and inspect Thai-language packages.
- Donor TCEB CKAN URL: HTTP 404.
- Longdo’s documented Traffy `action=near`, with `limit=0`: returns aggregate complaints near a point and attribution. Use an hour cache; obey Retry-After. Zero reports does not mean no problems. The sample covers 800 m around Siam, not all Bangkok.

## 3. Market evidence and its limits

Sources accessed 23 October 2026. These are provider descriptions and current published offers; no customer interviews or sales have happened.

| Existing offer | What it establishes | Consequence for this product |
| --- | --- | --- |
| [RentHub](https://www.renthub.in.th/en) searches apartments by station, school and neighborhood | Location-aware rental search already exists | A listing map alone is weak differentiation. Start with user-supplied listings and outbound links, not a duplicate portal. |
| [ThaiPins](https://www.thaipins.com/) collects anonymous actual rents at approximate locations | Actual-versus-asking rent is an existing product idea | Its sample is self-reported. Do not assume representative medians or permission to copy its data. Consider partnership and distinguish rent evidence types. |
| [SiteSelect](https://siteselect.longdo.com/) offers competitors, travel catchments, population and income context | Business location analysis is an established paid category | Do not compete on number of map layers. Compete on a transparent, useful small-business decision and field-verification plan. |
| [SiteSelect pricing](https://siteselect.longdo.com/pricing) publishes Starter at THB 2,999/month, with annual rental described | A current price anchor exists for a different commercial offer | It is not proof that a household or small shop will pay us that price. |
| [Traffy developer docs](https://traffy.longdo.com/about) provide a stable nearby-complaints endpoint | An attributed location-evidence source is available | Complaints describe reports and resolution, not incidence rates, safety rankings or future risk. |
| [Inside Airbnb](https://insideairbnb.com/get-the-data/) offers quarterly downloads under CC BY 4.0 | A documented reusable accommodation dataset exists | Short-stay asking prices and availability are not long-term rent, occupancy or shop demand. Atlas already carries a snapshot. |

Working hypothesis: people will value a candid explanation of daily life and tradeoffs across their own shortlist, especially when map proximity conceals poor access. The defensible asset is maintained local evidence and good judgment about its limits.

Disconfirmation to seek: users may already obtain enough from an agent, Google Maps and a visit; renters may only need this once; fresh rent and access evidence may cost more to maintain than they will pay. Test these before building subscriptions or a marketplace.

## 4. First product

Working description: **Find the Bangkok that fits your life.** Keep naming provisional; the IOC address is a useful pilot URL, not necessarily the consumer brand.

One core journey:

1. Describe budget, household needs, destination(s), usual travel time, car access and interests. Budget distinguishes rent from total monthly living costs. Destination can be a chosen station or area; an exact home address is unnecessary.
2. Explore places and shortlist up to three neighborhoods or user-selected homes.
3. Compare the same evidence dimensions across all three.
4. Read why each may fit, what might frustrate you, what is missing and what to inspect on a visit.
5. Save/share a comparison. Later, buy a maintained evidence report if users prove it valuable.

### Household fit

- Hard constraints: quoted rent and fees, bedrooms, pets, car availability, required destinations and maximum commute.
- Daily mobility: actual station entrance, connected pedestrian route, crossings, access gates, first/last-mile mode and relevant operating hours. Straight-line proximity must stay labeled as proximity.
- Everyday needs: groceries, local market, clinics, parks, schools, laundry and food within a stated catchment. A place pin does not establish opening hours, price, quality, eligibility or capacity.
- Interests and character: food streets, independent businesses, culture, canals, heritage, nightlife, quiet routines. Explain the source and date of editorial observations. “Best” needs a named criterion and reviewer.
- Housing form: condo, apartment, shophouse, gated estate, low-rise neighborhood. Record entrances and access conditions per place; do not infer them from the category.
- Friction: nearby complaint categories and time windows, observed environmental history, construction evidence, late-night return options, recurring costs. Sparse coverage remains visible.
- Outcome: a readable fit explanation with tradeoffs. No universal livability score. Preferences determine relevance; unknown evidence remains unknown and cannot silently pass a hard constraint.

Example to validate, not a real recommendation: someone who dislikes driving can exclude a listing if its only verified access is by car, even if its rent and building facilities look attractive. A nearby station alone must not reverse that exclusion.

### Business fit

Start later with one business type, for example a small cafe, and two or three candidate addresses.

Compare lease quotes, permitted use evidence, frontage, loading/access, hours, nearby complementary uses, competitor completeness, resident/daytime catchment and observed footfall. Store weekday/weekend and time-of-day windows separately.

Supply is mapped premises or businesses. Demand is measured footfall, enquiries, sales or other observed activity; population and POI density are proxies. Few competitors can mean unmet demand or too few customers. The system must show the distinction. Do not publish an investment return, revenue forecast or “underserved” verdict from counts alone.

Allow a simple user-entered break-even scenario later: fixed monthly costs divided by contribution per transaction gives transactions required per month. That is a scenario, not a sales forecast. A site cannot be called viable without evidence about achievable demand and the actual lease.

### Product boundaries

Atlas owns geographic evidence and source adapters. IOC owns preferences, comparison, local editorial interpretation and paid report packaging. Share evidence through a versioned contract, rather than copying the live ingestion stack.

Preserve the old operational product at a stable legacy entry and immutable deployment URL before promoting the new experience. Keep maps, charts, tickers, cameras, datasets and source history recoverable. Hiding irrelevant panels from a new task view does not authorize deleting them.

## 5. Freemium hypothesis

| Tier | Proposed value | Test |
| --- | --- | --- |
| Free | Explore places, basic fit filters, source dates, useful shortlist and a basic comparison | Can a person narrow a real decision without help? |
| Paid household report | Deeper comparison, recurring-cost worksheet, dated evidence, walking/access verification checklist and a visit plan | Test a one-off THB 490 report with real buyers. Price is an experiment, not a market finding. |
| Paid business study | Category-specific catchment and competition review plus a fieldwork plan | Quote manually after measuring analyst work; do not set a subscription yet. |
| Later professional access | Saved client comparisons, repeated reports, monitored location evidence | Only if agents or businesses demonstrate repeat use. |

A move is episodic. One-off reports are a better initial hypothesis than forcing households into monthly subscriptions. Keep basic source attribution and material unknowns free. Paid placement, if ever introduced, must be separated from comparison results and cannot purchase a better fit conclusion.

Measure contribution: report revenue minus payment fees, incremental data costs, refunds and human work. A “mostly automated” product still costs time when facts require field checking.

## 6. MSH first: preserve capability, change the task composition

Design read: a place comparison desk where the map locates the choices and a compact evidence table explains their differences. Reference: the comparison logic of a Which? product table and the geographic orientation of a city street atlas. Civic register, light in daylight, one amber interaction accent; retain justified data classifications. Font choice must support Thai and stay within the project’s family limit.

### Existing rendered findings

[Legacy baseline, 1280×720](legacy-1280x720.png) was captured on the live URL. This is a preliminary baseline, not the full required viewport audit.

- The map is about 773 px wide and the right rail about 507 px, with the main workspace starting at y=83 and ending at y=676. The map occupies roughly half the screen area; it competes with a rail of operational sections.
- Multiple right-rail sections are about 31 px tall while their content contains several rows. The screenshot shows headers without readable evidence. Fitting a dashboard by clipping content is not MSH.
- The city-context section starts around y=112 and is about 45 px tall; the next section starts around y=147. Their measured boxes overlap by about 10 px.
- Air-quality, temperature, activity and market sections have similar visual treatment while answering different tasks. A housing decision has no clear first action or shortlist.
- The ticker shows competing text over a narrow strip; pale map search/navigation surfaces have poor contrast in the capture.

Required layout:

- One compact identity/search region; budget, travel preference and shortlist actions form a useful group.
- Desktop: map dominates exploration; selected-place evidence sits adjacent. Comparison mode can let the table dominate because comparing is then the task.
- Phone: one useful task at a time, with selected place, reasons and next action kept together. A Map/Compare switch is preferable to stacking the desktop rail indefinitely.
- The first screen answers where I am looking, why this place may fit, and how to compare it. No giant introductory hero or login gate.
- Evidence tables can scroll when reading earns it. No hidden overflow to manufacture a one-screen pass; no tiny text; no clipped expanded states.
- Preserve keyboard focus, touch targets, large-text behavior, the live map and source links.

Before promotion, capture 390×844, 1024×900 and 1440×900, plus adjacent breakpoints. Measure combined chrome height/share, overlap, clipping and horizontal overflow; record hierarchy and task visibility. Exercise selection, comparison, errors, stale data, empty data, long Thai labels and 200% text. Obtain independent review. No screenshot pass is claimed in this plan.

## 7. Proposed surgical implementation

### Review decisions

Default proposal: household fit first, six contrasting pilot areas, a three-place comparison, one-off report trial, and a separate later business lens. Keep the current live root intact until the new pilot passes.

### Sacred items

- Preserve the live legacy map, charts, cameras, tickers and earned content at their existing entry during pilot development.
- No file shrinks by more than 30%; add modules/routes, do not replace large files wholesale.
- Keep Atlas’s existing building-rendering work out of this change.
- No generated observation, substituted age or silent seed fallback.
- No payment collection before tested report delivery, auth/entitlements and refund/support flow exist.

### Phase A — isolate and harvest

Atlas repository, isolated branch:

- NEW `docs/bangkok-ioc-donor-audit.md`: donor revision, asset register, excluded artifacts, licence and provenance decisions.
- NEW `src/location-evidence.ts`: small typed location-evidence composer. Adapt source-state and discovery ideas; avoid whole-service migration.
- MODIFY `src/index.ts`: route registration for `/api/location/evidence`, without changing existing map/risk routes.
- NEW `scripts/test-location-evidence.mjs`: contract, upstream failure, stale age, missing data and generated-data rejection checks.

Evidence contract: location and radius, source URL, provider record ID, observed period, fetched time, evidence type, spatial resolution, coverage limitations, licence/attribution, status, nullable value, and derived method version. Editorial observations additionally carry reviewer and checked date. No invented confidence percentage.

Use Atlas civic/point/transit evidence and a cached aggregate Traffy adapter. Do not interpret approximate rail distance as walkability or schematic flood context as a long-term property risk rating. No complaint personal details or photo ingestion is needed for a comparison.

### Phase B — preserved legacy plus a pilot

IOC repository:

- NEW `apps/web/src/places/PlaceFitPage.tsx`, `placeFit.ts`, `places.css`: isolated consumer route, preferences and comparison logic.
- NEW `apps/web/public/data/places/pilot.json`: reviewed place records and evidence links, not fabricated rent/commute estimates.
- MODIFY `apps/web/src/App.tsx`: add `/places` route with minimal changes. Retain existing routes.
- NEW focused tests for hard constraints, missing data, stale data, budget units, route-vs-distance distinctions and three-place comparison.
- NEW rendered geometry checks and screenshots for the pilot.

Start with six candidate areas spanning rail-centered, mixed-access and estate living. Choose their exact boundaries after checking data and access; neighborhood names are not consistent administrative units. Obtain real listing/lease quotes and route checks before displaying affordability or commute claims. Users can supply candidate listings, reducing dependence on scraped inventories.

### Phase C — prove payment and promote

Conduct eight household sessions using real moves: a rail-oriented newcomer, a Bangkok resident changing routine, a family with school/work destinations, and car-oriented households. Include Thai and English use. Proposed pilot gate: at least six of eight can complete and explain a shortlist, and at least three buy the report after seeing its scope. These are decision thresholds, not statistically established market demand.

Also interview five small operators using actual candidate sites. Do not build marketplace listings until someone can maintain current supply, availability and legitimate contact paths.

Track task completion, unknowns understood, shortlist revisits, report purchases, refunds and analyst minutes. Prefer observations and purchases over “would you use it?” answers. If nobody pays after understanding the report, revise the value before adding more layers.

Promotion requires a rollback-ready legacy deployment, typed evidence tests, real browser flows, independent MSH review, and a live smoke test of the specific release. Direct upload is explicit; a GitHub push does not deploy this Pages project.

## 8. Verification and unresolved work

Completed: source repository located by matching Cloudflare commit; source recovered; current API suspension checked; targeted donor files inspected; Atlas evidence endpoints and candidate catalog endpoints probed; current legacy screen inspected and baseline saved; competing offers and source terms reviewed.

Not completed: source integration into Atlas, runtime fixes, a new UI, full three-width MSH audit, complete source/licence audit, pedestrian routing, real rent inventory, field observations, customer interviews, payments or a new deployment. No claim of those outcomes is made.

This research is biased toward the assets already available in Atlas and the user’s strong local knowledge. Counter it by testing whether users can make a better real decision and whether keeping the evidence current is commercially practical.
