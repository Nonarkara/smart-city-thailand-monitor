# Smart City Thailand Command Center

Greenfield monorepo scaffold for a public Smart City Thailand dashboard and a private editorial/sync back office.

This operational monitor (live traffic, flood, air quality, news, and related feeds) is a different project from [smart-city-thailand-index](https://github.com/Nonarkara/smart-city-thailand-index), which ranks Thai cities on SLIC methodology.

## What is implemented

- `apps/web`: React + Vite public dashboard with bilingual `th/en` UI, strict grid layout, URL-driven filters, a public home view, and a minimal private admin console route.
- `apps/api`: Fastify API with the required public endpoints, header-protected admin endpoints, in-memory state, source-health tracking, and adapter-based sync services.
- The API now supports free Google-driven news refresh via Google News RSS (and optional Google Alerts RSS feeds) with a 3-minute full sync plus a 1-minute fast-ops sync loop when `ALLOW_LIVE_FETCH=true`.
- `apps/worker`: lightweight sync trigger that calls the API admin sync endpoint and is available for future cron-based deployments, but it is not used in the recommended first Render launch.
- `packages/shared`: canonical TypeScript contracts plus seeded mock data used by the API and the frontend fallback path.
- `render.yaml`: Render Blueprint for a split deployment (`static web` + `api web`) with separate fast-ops and full-sync cadences.

## Recommended v1 API stack

This repo is currently opinionated toward the following sources for the first live version:

- `Open-Meteo Forecast API`: default weather feed
- `Open-Meteo Air Quality API`: default AQI / PM2.5 / PM10 feed
- `Google News RSS`: default free external news feed with no API key required
- `Google Alerts RSS`: optional user-supplied feed URLs for targeted official Google feeds
- `NewsAPI`: optional secondary paid/limited news feed
- `CityData Thailand`: city dashboard and metadata discovery
- `data.go.th / Open-D`: dataset-specific Thai public data adapters
- `GISTDA Disaster Open API`: disaster and hazard overlays
- `Smart City Thailand Office / depa`: official manual/editorial updates
- `Server time sync`: UTC + multi-time-zone dashboard clocks

## Satellite stack for Thailand

The nationwide dashboard now separates satellite providers into two groups:

- `NASA GIBS WMTS`: public no-secret overlays already suitable for nationwide aerosol, precipitation, and vegetation context
- `JAXA Earth API`: public EO context already used for rainfall overlays
- `Sentinel Hub Process API`: credential-backed raster API for Thailand true-color, NDVI, NDWI, flood, haze, and cloud-aware composites
- `Sentinel Hub Statistical API`: credential-backed summary/time-series API for Thai provinces, basins, and custom AOIs
- `Copernicus Data Space STAC`: preferred scene-search API for Thailand coverage discovery
- `Copernicus Data Space OData`: direct product-search and download API
- `Copernicus Data Space openEO`: server-side EO processing for Thailand-scale cubes and batch jobs

### Live nationwide satellite routes

When `COPERNICUS_CLIENT_ID` and `COPERNICUS_CLIENT_SECRET` are configured, the API now exposes:

- `/api/satellite/digest`: nationwide preview cards, EO freshness metrics, and recent searchable scenes
- `/api/satellite/preview/:presetId`: token-backed Sentinel Hub preview images for `true-color`, `vegetation`, and `flood-radar`
- `/api/satellite/stats`: nationwide EO freshness metrics plus Sentinel-2 NDVI median
- `/api/satellite/search`: token-backed Sentinel Hub catalog search for recent scenes over Thailand

If credentials are missing, the JSON routes return a typed `not-configured` status and the image route returns a placeholder SVG so the dashboard still renders cleanly.

### Practical note

- Prefer `STAC` and `OData` for Copernicus catalogue and download workflows.
- Do not plan around `OpenSearch`; Copernicus Data Space documentation states it was decommissioned effective `2026-03-02`.
- For Thailand specifically, the most useful collections to prioritize are:
  - `Sentinel-1` for monsoon-season flood and cloud-resistant monitoring
  - `Sentinel-2 L2A` for land, vegetation, water, and urban-surface context
  - `Sentinel-5P` when atmospheric or pollution context is needed at broader scale

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Start the API:

```bash
npm run dev:api
```

3. Start the frontend:

```bash
npm run dev:web
```

4. Optionally run the worker manually:

```bash
ADMIN_TOKEN=your-token npm run dev:worker
```

5. Or build everything once to verify the monorepo:

```bash
npm run build
```

## Environment

Copy `.env.example` to `.env` and set:

- `ADMIN_TOKEN` for admin endpoints
- `NEWS_API_KEY` only in backend/Render secrets
- `NEWS_API_QUERIES` to override the default curated NewsAPI search set (pipe-separated)
- `NEWS_API_PAGE_SIZE` to control per-query article count
- `ALLOW_LIVE_FETCH=true` when you want the adapters to hit live sources
- `AUTO_SYNC_ENABLED=true` when the API should schedule its own refresh loops
- `SYNC_INTERVAL_MS=180000` for the full-source refresh cadence
- `OPS_SYNC_INTERVAL_MS=60000` for high-value operational feeds such as traffic, weather, AQI, and flood status
- `DATABASE_URL` to persist snapshots in Postgres instead of relying on filesystem-only fallback
- `COPERNICUS_CLIENT_ID` and `COPERNICUS_CLIENT_SECRET` for live Sentinel Hub / Copernicus previews
- source-specific endpoints only when you have confirmed stable machine-readable URLs

## Security note

The NewsAPI key previously shared in chat should be rotated before any real deployment. This repo intentionally uses environment variables only and does not embed that key anywhere in source.

## Render

The included `render.yaml` is intentionally minimal for the first public launch:

- `smart-city-monitor-web`: public static frontend
- `smart-city-monitor-api`: public API service

The app can now persist snapshots to Postgres through `DATABASE_URL`, but the Blueprint does not create a database automatically to avoid unexpected spend during sync.
The API still runs safely without a database by falling back to local snapshot files.

### Render deploy flow

1. Push the repo to GitHub.
2. In Render, create a new Blueprint and connect this repo.
3. Use the repository root `render.yaml`.
4. Set the required API secrets:
   - `ADMIN_TOKEN`
5. Keep these runtime values enabled:
   - `ALLOW_LIVE_FETCH=true`
   - `AUTO_SYNC_ENABLED=true`
   - `OPS_SYNC_INTERVAL_MS=60000`
   - `SYNC_INTERVAL_MS=180000`
6. Optionally set:
   - `NEWS_API_KEY`
   - `DATABASE_URL`
   - `GOOGLE_NEWS_RSS_QUERIES`
   - `GOOGLE_ALERTS_FEEDS`
   - `CITYDATA_CATALOG_ENDPOINT`
   - `DATAGOTH_ENDPOINT`
   - `GISTDA_ENDPOINT`
   - `COPERNICUS_CLIENT_ID`
   - `COPERNICUS_CLIENT_SECRET`
7. Deploy and verify:
   - API health at `/health`
   - live source status at `/api/sources`
   - live satellite digest at `/api/satellite/digest`
   - the public dashboard renders and continues updating on the configured fast/full cadence

### Why the first launch is minimal

- The API still serves from an in-memory working set for speed, but it can now persist durable snapshots to Postgres.
- `DATABASE_URL` is optional and should point to a managed Postgres instance in the same region when durability matters.
- The API performs a 1-minute fast-ops sync and a 3-minute full sync when `ALLOW_LIVE_FETCH=true` and `AUTO_SYNC_ENABLED=true`.
- If you later move sync to a cron/worker model, disable `AUTO_SYNC_ENABLED` instead of duplicating refresh traffic.

### Secret handling

- Keep `ADMIN_TOKEN` and any paid API keys only in Render environment variables.
- Do not commit secrets to GitHub.
- Rotate the NewsAPI key that was previously shared in chat before using it in production.

## License

Released under the MIT License. See [LICENSE](LICENSE).
