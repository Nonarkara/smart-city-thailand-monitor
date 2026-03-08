# Smart City Thailand Monitor

Greenfield monorepo scaffold for a public Smart City Thailand dashboard and a private editorial/sync back office.

## What is implemented

- `apps/web`: React + Vite public dashboard with bilingual `th/en` UI, strict grid layout, URL-driven filters, a public home view, and a minimal private admin console route.
- `apps/api`: Fastify API with the required public endpoints, header-protected admin endpoints, in-memory state, source-health tracking, and adapter-based sync services.
- The API now supports free Google-driven news refresh via Google News RSS (and optional Google Alerts RSS feeds) with a 5-minute sync loop when `ALLOW_LIVE_FETCH=true`.
- `apps/worker`: lightweight sync trigger that calls the API admin sync endpoint and is available for future cron-based deployments, but it is not used in the recommended first Render launch.
- `packages/shared`: canonical TypeScript contracts plus seeded mock data used by the API and the frontend fallback path.
- `render.yaml`: minimal Render Blueprint for a split deployment (`static web` + `api web`) with API-side sync every 5 minutes.

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
- `SYNC_INTERVAL_MS=300000` to keep the API-side live refresh on a 5-minute cadence
- source-specific endpoints only when you have confirmed stable machine-readable URLs

## Security note

The NewsAPI key previously shared in chat should be rotated before any real deployment. This repo intentionally uses environment variables only and does not embed that key anywhere in source.

## Render

The included `render.yaml` is intentionally minimal for the first public launch:

- `smart-city-monitor-web`: public static frontend
- `smart-city-monitor-api`: public API service

The app does not use Postgres yet, so the first deploy does not provision a database.
The app already runs its own in-process sync loop in the API service, so the first deploy does not provision a cron job either.

### Render deploy flow

1. Push the repo to GitHub.
2. In Render, create a new Blueprint and connect this repo.
3. Use the repository root `render.yaml`.
4. Set the required API secrets:
   - `ADMIN_TOKEN`
5. Keep these runtime values enabled:
   - `ALLOW_LIVE_FETCH=true`
   - `SYNC_INTERVAL_MS=300000`
6. Optionally set:
   - `NEWS_API_KEY`
   - `GOOGLE_NEWS_RSS_QUERIES`
   - `GOOGLE_ALERTS_FEEDS`
   - `CITYDATA_CATALOG_ENDPOINT`
   - `DATAGOTH_ENDPOINT`
   - `GISTDA_ENDPOINT`
7. Deploy and verify:
   - API health at `/health`
   - live source status at `/api/sources`
   - the public dashboard renders and continues updating every 5 minutes

### Why the first launch is minimal

- The API uses an in-memory store today.
- `DATABASE_URL` is not used by the application code yet.
- The API already performs live sync internally every 5 minutes when `ALLOW_LIVE_FETCH=true`.
- Adding a separate cron worker on day one would duplicate sync traffic and complicate operations.

### Secret handling

- Keep `ADMIN_TOKEN` and any paid API keys only in Render environment variables.
- Do not commit secrets to GitHub.
- Rotate the NewsAPI key that was previously shared in chat before using it in production.
