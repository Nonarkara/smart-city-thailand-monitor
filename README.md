# Smart City Thailand Monitor

Greenfield monorepo scaffold for a public Smart City Thailand dashboard and a private editorial/sync back office.

## What is implemented

- `apps/web`: React + Vite public dashboard with bilingual `th/en` UI, strict grid layout, URL-driven filters, a public home view, and a minimal private admin console route.
- `apps/api`: Fastify API with the required public endpoints, header-protected admin endpoints, in-memory state, source-health tracking, and adapter-based sync services.
- The API now supports free Google-driven news refresh via Google News RSS (and optional Google Alerts RSS feeds) with a 5-minute sync loop when `ALLOW_LIVE_FETCH=true`.
- `apps/worker`: lightweight sync trigger that calls the API admin sync endpoint and is ready for a Render cron service.
- `packages/shared`: canonical TypeScript contracts plus seeded mock data used by the API and the frontend fallback path.
- `render.yaml`: Render Blueprint for a split deployment (`static web`, `api web`, `cron`, `postgres`).

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

## Environment

Copy `.env.example` to `.env` and set:

- `ADMIN_TOKEN` for admin endpoints
- `NEWS_API_KEY` only in backend/Render secrets
- `NEWS_API_QUERIES` to override the default curated NewsAPI search set (pipe-separated)
- `NEWS_API_PAGE_SIZE` to control per-query article count
- `ALLOW_LIVE_FETCH=true` when you want the adapters to hit live sources
- source-specific endpoints only when you have confirmed stable machine-readable URLs

## Security note

The NewsAPI key previously shared in chat should be rotated before any real deployment. This repo intentionally uses environment variables only and does not embed that key anywhere in source.

## Render

The included `render.yaml` expects:

- a public static frontend
- a public API service
- a cron-driven sync worker
- a managed Render Postgres database

After pushing to GitHub, connect the repo in Render and deploy via Blueprint.
