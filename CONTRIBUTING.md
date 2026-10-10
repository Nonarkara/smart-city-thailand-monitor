# Contributing

Thanks for looking. This repository is a civic operations monitor, not an official government system. Small, accurate changes are more useful than a new coat of paint.

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

- Open an issue for anything that changes behavior, data sources, or deploy defaults. Bug fixes for a clear defect can go straight to a pull request.
- Do not commit `.env`, tokens, or feed payloads that your account is not allowed to redistribute.
- Do not present seed data, mock statistics, or the README illustration as live telemetry.
- The API package does not typecheck. Read [Known issues](README.md#known-issues) before debugging a red `apps/api` build. Please don't file that three-error set again unless you are sending the fix.

## Setup

Requirements: Node 20 or newer, npm, git.

```bash
git clone https://github.com/Nonarkara/smart-city-thailand-monitor.git
cd smart-city-thailand-monitor
npm ci
cp .env.example .env
```

Leave `ALLOW_LIVE_FETCH=false` unless your change needs a real upstream. Set `ADMIN_TOKEN` before exercising `/admin` or `apps/worker`.

```bash
npm run dev:web    # http://127.0.0.1:5173  seed data is enough for UI work
npm run dev:api    # http://127.0.0.1:4000  currently blocked by the known type errors
```

## Checks

```bash
npm run build -w packages/shared
npm run build -w apps/web
npm run build -w apps/worker
npx tsc -p apps/api/tsconfig.json --noEmit
```

`npm run build` at the repo root also builds the API, so it fails until those errors are gone. The Pages workflow only builds shared and web. There is no test runner configured.

Use `tsc -p <tsconfig>`, not a one-off `tsc --noEmit` without a project file.

TypeScript and markdown in this repo use ASCII quotes.

## What a change usually touches

| Task | Where to look |
| --- | --- |
| New feed | `apps/api/src/adapters/`, then the list in `apps/api/src/services/sync.ts`, then `sources` in `packages/shared/src/mockData.ts` |
| New JSON route | `apps/api/src/server.ts` and the matching `useQuery` in `apps/web/src/App.tsx` |
| New map layer | `mapLayers` in `packages/shared/src/mockData.ts`, layer colors in `apps/web/src/InteractiveMap.tsx`, toggle ids in `apps/web/src/App.tsx` |
| Env var | `apps/api/src/config.ts` or the `VITE_` read in `apps/web`, plus `.env.example` as a commented name |
| Shared type | `packages/shared/src/types.ts`, then rebuild `packages/shared` before the API or web |

`fetchFromApi` must keep a fallback. If you add a query, pass a seed value and say in the pull request whether that value is live, cached, or synthetic.

`runBangkokStatsSync` currently returns generated figures marked `live`. Do not copy that pattern.

## Interface

The default theme in `apps/web/src/styles.css` is dark (`#0a0e14` / `#e8edf3`) with `--radius: 0px`. Some controls still set `border-radius: 2px`. The editorial theme sets `--radius: 4px`. Prefer the default tokens. Do not add `backdrop-filter`. The web stylesheet does not use it.

The hero image is `assets/hero.png`: a screenshot of the running dashboard, with the repo name and the one-line pitch, on a flat Palette field. If the screen changes, replace it with a new capture of this app. Do not substitute an illustration.

## Pull requests

Use the pull request template. Say what you ran, and say what you could not run. Screenshots of UI changes should be of this app, with a note if the API was down and the seed fallback is showing.

Keep commits focused. Don't mix a docs pass with an adapter rewrite.
