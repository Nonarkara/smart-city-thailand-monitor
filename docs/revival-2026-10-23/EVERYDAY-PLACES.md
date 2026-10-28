# Everyday places: bounded evidence increment

Invariant: a mapped place is a candidate to check, never proof of opening,
walkability, customer demand or business viability. Missing records mean unknown.

Reuse the current map, 800 m search radius and existing evidence reading path.
Keep the toolbar and private premises workspace unchanged. Add a compact nearby
directory with purpose-relevant categories and source links, rather than another
dashboard band. Keep municipal records separate because their coverage differs.

Source: public Geofabrik Thailand OpenStreetMap extract, pinned 24 October 2026.
One offline download; no visitor calls to public Overpass or a new paid service.
Filter actual node points for food, groceries, markets, health, fitness and
culture. Exclude explicitly closed/disused/private records. Ways and relations
are excluded; no centroid becomes an invented entrance. Preserve node IDs and
edit dates, but describe edits as edits, never visits or business verification.
Round coordinates to four decimals, EPSG:4326, with no offsets. Source remains
ODbL with attribution, licence and downloadable derived data.

First measure the filtered result, then choose static files under 500 KB each.
Serve from the existing Pages asset pipeline, explicitly allowlisted. Validate
at the browser boundary, reject stale/future/malformed snapshots, cancel requests
on pin changes, and never persist public catalogue data into the private bank.

Verification: reproducible extraction and checksums; actual counts/size/category
inspection; boundary tests for bad data and radius; real browser phone/tablet/
desktop cases, sources, empty/unavailable states and category changes; independent
visual review; existing unit gates/build; commit, push, deploy and live proof.

This increment cannot answer historical rent fairness, unmet customer demand,
industrial permission, or route accessibility. These remain evidence gaps.

## Source contract and actual probe

Public endpoint: https://download.geofabrik.de/asia/thailand-261024.osm.pbf
Provider details: https://download.geofabrik.de/technical.html
Licence/attribution: https://www.openstreetmap.org/copyright and ODbL 1.0.
Retrieved 25 October 2026. No authentication. Browser CORS is irrelevant: one
offline operator download becomes same-origin static files; visitors never call
Geofabrik. No polling, service SLA or automatic refresh is claimed.

IPv4 HEAD returned 200, Content-Length 329280467, Last-Modified 24 Oct 23:00:29 GMT.
Default network attempt timed out; bounded IPv4 download succeeded in 55 seconds.
Provider MD5 matched 215e1ff30fe4d4adef2db3d664dab9da. Local SHA256:
e8373240cf0be47cc641f2c8627e674064d8c47f4ff2a11f6a33fcbfc9a50949.
PBF header source timestamp: 2026-10-24T20:20:51Z. This is 25 Oct in Bangkok;
it is the database snapshot time, not a survey of business availability.

`python3 scripts/build-everyday-places.py /path/thailand-261024.osm.pbf`
uses installed osmium 1.19.1 and Python stdlib, verifies the pinned checksum and
header, filters node tags, clips a buffered geographic box and writes deterministic
cells. Source cache stays outside Git. Refresh requires reviewing/pinning a new
source contract and rerunning the same verification, not silently changing dates.

Supported pin centres: lat 13.45–14.10, lon 100.30–100.95. The extract extends
0.02 degrees beyond each edge, more than 800 m at these latitudes. This box is
a product coverage region, not an official Bangkok administrative boundary.
Search uses haversine distance; each node rounds to 4 decimals before export.
No geometry simplification, fictional centroids or coordinate jitter.

Derived ODbL database: 11,248 points,155 cells,1,669,707 bytes total; largest
cell 322,962 bytes. Counts: food 7,429; groceries 2,634; health 804; fitness 184;
markets 103; museums/galleries 94. The public manifest lists every file with its
SHA256, bytes and count, making the full modified database downloadable. Licence
and attribution are visible beside the directory and on the map. No contributor
IDs, contacts, personal notes, reviews or inferred ratings are exported.

Records explicitly tagged closed/disused/abandoned/demolished or private/no access
are excluded. No named-place deduplication: two equal names at distinct OSM nodes
remain two mapped candidates. Unknown opening/access remains unknown.

Client rejects future, impossible, zone-less or >30-day snapshots; bad/missing cells
make the directory unavailable, never zero. Unindexed cells indicate no exported
nodes; their completeness remains unknown. Pin changes cancel outstanding fetches
and immediately hide previous location results. Failed sources retain local
calculators and private records. Only chosen category's nearest 30 points can be
shown on the map; the complete local candidate list remains available.
