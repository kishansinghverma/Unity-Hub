# Repository Guidelines

Last reviewed: 2026-10-05 — suppressed console logging for HTTP 404 responses.

## Structure

`src/backend/main.ts` is the backend entry point. Backend code follows Route → Operation → Service under `src/backend/modules`. Shared backend infrastructure lives under `src/backend/core`, backend assets under `src/backend/assets`, and generated files under `src/backend/static`. The React application remains under `src/frontends/emandi`.

Do not edit generated `dist/`, frontend `build/`, or dependency directories. Do not modify frontend code during backend migration unless explicitly requested.

## Style

Use strict TypeScript, four-space indentation in backend files, semicolons, PascalCase types, camelCase functions and variables, and lowercase filenames. Prefer concise arrow-function class fields for service and operation methods. Avoid trailing commas, `any`, unnecessary abstractions, and unrelated formatting changes.

Routes stay thin. Operations orchestrate workflows. Services own persistence and external communication. Keep validation at HTTP boundaries and use centralized error handling.

## Verification

Use `npx tsc --noEmit`, `npm run build`, and `git diff --check`. Do not write tests or temporary scripts unless explicitly requested.

## Frontend Serving

The backend serves the built React application at `/emandi` and `/remote`. Frontend API route migration is tracked in `route-migration.md` and is intentionally separate from this backend replacement.
