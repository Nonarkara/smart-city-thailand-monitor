# Security

## Reporting

Please report vulnerabilities privately through GitHub's security advisories for this repository:

<https://github.com/Nonarkara/smart-city-thailand-monitor/security/advisories/new>

If that page is unavailable, contact the owner through <https://github.com/Nonarkara>.

Do not open a public issue, pull request, or chat paste that contains live tokens, session cookies, or a working exploit. There is no bug-bounty program in this repository.

## What to include

- The affected path (`apps/api`, `apps/web`, `apps/worker`, or a deploy file).
- What you can already do, and what an attacker would still need.
- Whether the issue is in the default config (`ADMIN_TOKEN` unset, `ALLOW_LIVE_FETCH` left on, CORS `origin: true` in `apps/api/src/server.ts`).

## Secrets

`ADMIN_TOKEN`, `NEWS_API_KEY`, `YOUTUBE_API_KEY`, `OPENAQ_API_KEY`, `GEMINI_API_KEY`, `COPERNICUS_CLIENT_ID`, `COPERNICUS_CLIENT_SECRET`, `WAQI_API_TOKEN`, and `DATABASE_URL` are runtime secrets. The code default for `ADMIN_TOKEN` is the literal `change-me` when the variable is unset. Treat a deployment that still uses that value as unprotected.

`.env` is gitignored. `.env.example` must stay free of real credentials.

## Scope

This project pulls public feeds and renders them. A bug that leaks an admin token or writes to the store without `x-admin-token` is in scope. Misuse of an upstream provider's API, or a vulnerability in that provider, should go to the provider.

The suspended Render host named in the deploy files is an operations outage, not something this file can patch.

## Supported versions

Only the default branch of `Nonarkara/smart-city-thailand-monitor` is maintained from this repository. Forks set their own policy.
