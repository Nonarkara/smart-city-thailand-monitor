# Public evidence for choosing a Bangkok place

Research checked 26 October 2026. Product intent: `docs/revival-2026-10-23/PLAN.md`
sections 3–4 and `NEXT-EVIDENCE.md`. No separate intent-named file exists in this
checkout. The product must compare real premises, recurring costs, daily needs
and actual journeys. Supply counts cannot establish customers or investment merit.

Invariant: a mapped candidate keeps its source and snapshot time; it never becomes
an observed open business, accessible entrance or verified journey by rendering it.

## Source decisions

| Source / public reference | Useful decision evidence | Availability, licence and coverage | Decision |
| --- | --- | --- | --- |
| [Geofabrik Thailand OSM](https://download.geofabrik.de/asia/thailand.html), [extract method](https://download.geofabrik.de/technical.html) | Everyday services and actual mapped rail entrance nodes | ODbL; offline pinned source, no visitor API/key. Existing 24 Oct PBF checksum and header verified again. Coordinates rounded to 4 decimals. Nodes only: major omissions where facilities are mapped as areas. Snapshot, not an opening survey. | Integrate additional categories using existing loader, bounded cells and attribution. |
| [OSM subway entrance definition](https://wiki.openstreetmap.org/wiki/Tag:railway%3Dsubway_entrance), [schools](https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dschool), [parks](https://wiki.openstreetmap.org/wiki/Tag:leisure%3Dpark) | Entrance-to-home visit planning; childcare/education and green-space candidates | Entrance nodes do not establish step-free access, opening hours, connected sidewalks or journey times. School tag does not prove admissions, fees or places. Park node coverage is especially sparse. | Add rail entrances, schools/childcare, parks; add library nodes to culture. Do not create area centroids or completeness scores. |
| [BMA park dataset](https://data.bangkok.go.th/dataset/park) | Municipal park inventory, potentially fuller than node-only OSM | CKAN package_show HTTP 200; ZIP and CSV. Source metadata modified 17 Jun 2024. Licence explicitly “License not specified”. A differently scoped [national park table](https://data.go.th/en/dataset/park) advertises attribution terms; that does not settle rights for this municipal resource. | Keep source link and resource details in probes.json. Do not redistribute the BMA files under assumed ODbL/CC terms. Review resource rights, geometry and observation dates before integration. |
| [BMA school catalogue search](https://data.bangkok.go.th/api/3/action/package_search?q=school&rows=3) | Public school inventory | HTTP 200,21 matches; sampled three packages all have unspecified licence. Recent metadata modification is not a school survey date. District preschool tables differ from citywide schools. | Follow up the exact resource contract, coordinates and school-year coverage. Do not infer admissions or uniformly current records. |
| [BMA GTFS search](https://data.bangkok.go.th/api/3/action/package_search?q=GTFS&rows=3), [OTP catalogue](https://otp.gdcatalog.go.th/api/3/action/package_search?q=GTFS&rows=3) | Scheduled multimodal journeys, if a usable feed exists | Both tested searches HTTP 200,0 matches. This is a negative catalogue probe, not evidence that Thailand has no GTFS. Need agency/feed rights, service calendars, feed validity and transfer rules. | Do not invent transit times from station proximity. Start from real entrance candidates and explicit external route planning; preserve user journey checks. |
| [OpenAQ v3](https://docs.openaq.org/using-the-api/quick-start), [licences](https://docs.openaq.org/resources/licenses) | Dated station measurements and historical air exposure context | Documentation requires an API key; unauthenticated locations probe returned401. Provider-specific licences must be inspected. Nearest monitor is not a property measurement. | Reuse Atlas ingestion rather than exposing a key or duplicating polling. Next integration needs station distance, observed time, instrument, missing periods and history completeness. |
| [WorldPop](https://www.worldpop.org/faq/), [catalogue](https://www.worldpop.org/datacatalog/), [API](https://api.worldpop.org/v2/) | Residential population context for an explicitly dated catchment | CC BY4.0 according to provider. Modelled population grids, not observed storefront footfall. Blind GET to tested population endpoint returned405; this was not a successful data retrieval. | Candidate for offline zonal sums after choosing a named year/product and handling raster cells at catchment edges. Never label residents as potential buyers or convert directly to revenue. |
| [Traffy Longdo developer description](https://traffy.longdo.com/about) | Categories and dates of reported local friction | Provider describes key-free CORS access with Traffy credit/link. Existing Atlas contract already supplies aggregates. Reports reflect reporting/handling, not prevalence or future danger. | Reuse existing aggregates; no second ingestion stack or personal complaint/photo export. |
| [Inside Airbnb assumptions](https://insideairbnb.com/data-assumptions/), [downloads](https://insideairbnb.com/get-the-data/) | Short-stay supply context | Provider explains modelled occupancy. Existing Atlas snapshot should keep scrape date and attribution. Calendar availability is not verified bookings; short-stay prices are not long-term lease rents. | No new investment yield or long-term rent benchmark from this source. |

`probes.json` records the actual six fresh requests, statuses, selected resource
URLs and licence metadata. Public documentation reviewed above establishes
provider descriptions; it does not claim successful ingestion of those sources.

## Executed increment

The reproducible, existing OSM extraction now yields 12,049 node candidates:
7,429 food;2,634 groceries;804 health;184 fitness;103 markets;147 culture
(including53 additional libraries);298 schools/childcare;31 parks;419 rail entrances.
161 manifest cells; maximum340,258bytes. Existing food/grocery/health/fitness/market
records are preserved. No inferred park entrance or polygon centre was added.

Nearby results stay within800m straight-line of the current pin. Each row can open
an external Google Maps walking estimate with that exact origin and candidate
destination. This is an explicit user action; there is no automatic third-party
route request. Gates, crossings, opening and accessibility still need site checks.

The browser now streams with the manifest's byte budget and verifies SHA256 over
the original bounded bytes before parsing. One corrupt/partial cell makes coverage
unknown rather than publishing a plausible partial count. The manifest is the
same-origin authority; hashes detect cell/manifest mismatch, not a compromised
publisher. Pin changes still cancel and hide previous results.

## Next useful evidence, in order

1. Cover mapped school/park areas with their real geometry and boundary-to-pin
   distance, separately from entrances. Add only after multi-polygon validation,
   source-type IDs, duplicate handling and download-budget tests. A centroid must
   not silently become the walking destination.
2. Add actual route observations (entrance, gates, crossings, weekday/departure,
   access needs), then a licensed service-calendar-aware routing source. Keep
   estimated and personally checked journeys distinct.
3. For one business activity and catchment, collect several actual premises and
   measured pedestrian/transaction windows. Existing financial scenarios can then
   test those observations instead of treating supply density as demand.
4. Add dated environmental history via Atlas and repeated comparable rent samples.
   These need denominators/coverage and comparable units; a new map colour cannot
   supply missing history or historical rent fairness.

No payment, demand ranking, field-verified access or full commercial suitability
assessment is claimed by this release.
