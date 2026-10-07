# Repository Instructions

Last reviewed: 2026-10-07 — synchronized with the current NodeExpress backend and migrated E-Mandi frontend.

## Working Style

- Trace the affected flow before editing.
- Prefer the smallest clear solution that satisfies the requirement.
- Reuse existing helpers, types, dependencies, and patterns.
- Do not add speculative abstractions, configuration, files, dependencies, or features.
- Do not add conditions unless required by the contract, security, data integrity, or error handling.
- Before adding an `if`, `else`, guard, loop, or abstraction, confirm that it is required and that a simpler expression would not be clearer.
- Use explicit types. Do not use `any`; use `unknown` only at external boundaries and narrow it immediately.
- Put request, response, and module-specific definitions in the module's `.types.ts` file. Use a shared type only when multiple modules genuinely need it.
- Prefer concise arrow functions. Use block-bodied arrow functions only when multiple steps are required.
- Keep simple getters and one-expression methods on one line.
- Prefer named intermediate values over dense inline expressions when preparing payloads or storage paths.
- Use straightforward `if` blocks for optional side effects; avoid nested ternaries for multi-step work.
- Separate logical phases inside a method with a blank line.
- When assembling an object incrementally, give it an explicit concrete type.
- Keep function parameter lists on one line unless genuinely large.
- Keep long expressions compact when readable, but wrap them when they become difficult to scan.
- Do not add trailing commas.
- Do not use one-letter variable names unless the context makes the meaning obvious.
- Use PascalCase without underscores for externally exposed error codes.
- Keep configuration values as private class members, hoisted near the top of services, and read settings through `Configuration.GetSetting` or `Configuration.TryGetSetting`.
- Keep utility methods inside utility classes and keep shared constants in the single central constants file.
- Prefer centralized exception handling over local `try/catch`; catch locally only when a partial operation must be converted into a typed action result.
- Convert failures from external APIs and storage providers to `UpstreamApiError`.
- Preserve user changes and match the existing local formatting style.
- Record future syntax or style corrections requested by the user here.

## Review Before Delivery

- Review every change at least twice.
- Challenge every line, branch, type, file, and abstraction for necessity during both reviews.
- Remove duplicated logic, unnecessary branches, and unused fields.
- Do not weaken required validation, error handling, security, or data integrity.
- Run TypeScript and diff checks after code changes.

## Architecture Rules

- Keep Route → Operation → Service boundaries.
- Routes handle HTTP binding only and receive globally validated typed data.
- Operations orchestrate use cases and return typed operation responses.
- Services own domain behavior, persistence, and external communication.
- Keep validation in module schema dictionaries imported into the global validation dictionary. Routes must not manually parse request bodies.
- Keep response-envelope creation centralized. Do not manually build `ActionResponse` objects in operations or routes.
- Keep constants in `src/backend/core/constants.ts`.
- Keep utility implementations as classes.
- Keep backend structure under `src/backend`:
  - `src/backend/main.ts` entry point
  - `src/backend/app.ts` app bootstrap
  - `src/backend/core/*` shared backend infrastructure
  - `src/backend/modules/<module>/*` module implementation
  - `src/backend/assets/*` static backend assets
  - `src/backend/static/*` runtime generated files
- Frontend remains in `src/frontends/emandi` and should not be modified during backend migration unless explicitly requested.
- See `Architecture.md` for the full repository structure, route map, runtime flow, and migration scope.

## Naming and Routes

- The queue module is `gatepass`, mounted at `/api/gatepasses`.
- Use one operations file per module, not one file per operation.
- Use plural REST resource names such as `/gatepasses`, `/parties`, and `/niners`.
- Put module assets and runtime static files directly under `src/backend/assets` and `src/backend/static`.
- Keep Gatepass and Niner PDF renderers self-contained; do not introduce a shared renderer.
- Oakter Remote is mounted at `/api/oakter-remote` with `/status`, `/devices`, `/sync`, and `/commands` routes.
- Background jobs belong in services without HTTP routes or operations and must follow the application lifecycle.
- Backend serves built frontend at `/emandi` and `/remote`.
- Frontend API migration details are tracked in `route-migration.md`.
- The active frontend uses the migrated gatepass and Oakter Remote routes; it does not currently consume E-Mandi document, vehicle-tagging, file, or WhatsApp file routes.
- `README.md` provides quick-start commands; `Architecture.md` is the source of truth for technical layout.

## Verification

- Use `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
- Do not write tests or temporary scripts unless explicitly requested.

## Scope Discipline

- Do not modify the reference NodeExpress repository.
- Do not fix unrelated bugs or change established contracts without an explicit requirement.
- Do not edit generated `dist/`, frontend `build/`, or dependency directories.
