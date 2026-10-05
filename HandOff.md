# Project Handoff

## Current State

The UnityHub backend has been replaced with the NodeExpress Fastify backend under `src/backend`. The existing React frontend under `src/frontends/emandi` remains unchanged.

Fastify serves the frontend at `/emandi` and `/remote`. Backend routes are mounted under the current NodeExpress `/api` prefixes. The frontend still uses legacy dispatch and Oakter URLs, so its API calls require the changes documented in `route-migration.md`.

Development now uses backend port `8080`, matching the React development proxy; React remains on its default port `3000`.

HTTP 404 responses no longer emit global or not-found console logs.

## Verification

- `npm install` completed using a temporary npm cache.
- `npx tsc --noEmit` passed.
- `npm run build` passed.
- Compiled server smoke test passed for `/emandi`, `/remote`, and `/api/gatepasses/queued`.
- Existing React hook and Browserslist warnings remain.
- Startup requires `VEHICLE_TAGGING_MOBILE_NUMBER` in the environment.
- `npx tsc --noEmit` and `git diff --check` pass after the port update.
- `npx tsc --noEmit` and `git diff --check` pass after the 404 logging update.

## Next Steps

1. Migrate frontend API URLs and payload handling using `route-migration.md`.
2. Add the missing production environment variable configuration.
3. Retest frontend workflows against the new `ActionResponse` contract.
