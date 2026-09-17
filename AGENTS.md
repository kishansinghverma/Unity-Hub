# Repository Guidelines

Last reviewed: 2026-09-17 — reviewed frontend/backend Oakter remote contracts.

## Project Structure & Module Organization

`src/index.ts` is the backend entry point. Under `src/backend`, HTTP handlers live in `routes/`, domain workflows in `operations/`, integrations and server setup in `services/`, shared helpers in `common/`, and EJS/image resources in `assets/`. The eMandi Create React App is in `src/frontends/emandi`; application code is under `src/` and browser-served files under `public/`. Root builds go to `dist/`. Do not edit generated `dist/`, `build/`, or dependency directories.

## Build, Test, and Development Commands

- `npm install`: installs root dependencies and, through `prepare`, frontend dependencies.
- `npm run start-dev-backend`: runs the TypeScript backend with Nodemon.
- `npm run start-dev-emandi`: starts the backend and React development server together; the frontend proxies API calls to port 8080.
- `npm run build`: compiles both applications and copies assets into `dist/`.
- `npm start`: runs the compiled server from `dist/index.js`; build first.
- `npm test --prefix src/frontends/emandi -- --watchAll=false`: runs frontend Jest tests once. The root `npm test` is currently a placeholder and intentionally fails.

## Coding Style & Naming Conventions

Both projects use strict TypeScript. Use four-space indentation in backend files and two spaces in React code, with semicolons; preserve the existing quote style of the file being edited and avoid unrelated formatting changes. Use `camelCase` for functions and variables, `PascalCase` for components and types, and lowercase filenames such as `dispatches.ts`.

Keep route handlers thin; place business logic in `operations/` and integrations in `services/`. Public operation methods should have one clear route binding, and route renames must be synchronized with validation schemas, frontend callers, README, and `HandOff.md`. Create React App's ESLint configuration checks frontend code.

Request-specific types belong under `src/backend/common/types/request/` in one file per request, such as `FinalizeDispatchRequest.ts`. Keep rendering payload types minimal and separate from transport/action metadata.

Prefer small, responsibility-focused operation functions. Public document methods should select the HTML or JSON path and delegate creation to dedicated helpers; shared delivery behavior belongs in one completion helper. Avoid mixing record resolution, PDF generation, printing, sharing, and response construction in one large function.

When multiple independent actions are requested, attempt each selected action instead of returning after the first one. Return a structured result for every action, including `success`, `failed`, or `not_requested`, and preserve useful error messages for the frontend.

Validation errors should explain the violated business rule in plain language. Add explicit Joi messages for custom cross-field rules instead of exposing generic `any.invalid` messages.

Document rendering uses dedicated templates: `template_gatepass_html.ejs`, `template_niner_html.ejs`, `template_gatepass_json.ejs`, and `template_niner_json.ejs`. Do not reintroduce a generic combined document template or server-side receipt parsers. HTML rendering uses the lean `HtmlDocumentData` payload (`tables` and `qr`); the logo is embedded as a Base64 data URL from `assets/logo_emandi.png`.

The dispatch API is mounted at `/api/dispatches` and currently exposes `/status`, `/init`, `/queued`, `/processed`, `/peek`, `/pop`, `/push`, `/finalize`, `/requeue/:id`, `/:id`, and party CRUD under `/parties`. `PATCH /finalize` accepts optional string `gatepassId`, `ninerId`, and `rate` fields, always moves the oldest queued record to processed, and merges only supplied fields. Keep the route, operation, validation, and documentation contracts aligned.

Vision functionality is mounted at `/api/vision`; captcha OCR is exposed at `POST /captcha`, and QR generation is shared by document operations through the Vision service. Keep external integrations in services and expose them through operations/routes where an HTTP contract is needed.

The Oakter device catalog at `src/backend/static/oak-devices.json` is runtime state and must remain untracked. `GET /devices` checks for the file and, when it is missing, synchronizes from Oakter before returning the hydrated catalog. Later reads use the saved file, while explicit refresh calls `/syncdevices` and renders its response directly.

Keep the Oakter remote contracts aligned: the global `validationMiddleware` validates `POST /api/oakterremote/command` against its schema before the route runs. The frontend expects catalog responses with `Response`, connection responses with `isConnected`, and command responses with `Status`/`Response`; the backend currently forwards the remote command response without normalizing it.

The remote page displays an initial loading skeleton with a stable outer panel height while the catalog request is pending. Manual refresh preserves the current controls while syncing.

## Testing Guidelines

Frontend tests use Jest, React Testing Library, and `@testing-library/jest-dom`. Name tests `*.test.ts(x)` beside covered code and test user-visible behavior. No backend framework or coverage threshold is configured; run `npm run build` after backend changes and manually exercise affected endpoints.

## Commit & Pull Request Guidelines

History follows Conventional Commit-style subjects: `feat: ...`, `fix: ...`, and `refactor: ...`. Keep commits focused and subjects imperative. Pull requests should summarize changes, identify affected routes or screens, link issues, list verification commands, and include screenshots for UI changes. Call out new environment variables or deployment steps.

## Security & Configuration

Runtime integrations read credentials from `.env`. Never commit tokens, passwords, session IDs, or MongoDB/MQTT connection details. Document required variable names without real values and avoid logging sensitive request or authentication data.

Generated PDFs are written to `src/backend/static` at runtime. Avoid persisting rendered HTML for diagnostics, and do not add filesystem paths or external asset dependencies to PDF templates when a self-contained data URL is suitable.

## Agent Completion & Handoff

At the end of every repository operation, update both this guide and `HandOff.md`. Advance the review note above even when these guidelines need no substantive revision. `HandOff.md` is the living continuation record: keep it concise, current, and free of secrets. Record what changed, commands run and their outcomes, known warnings or risks, and useful next steps. Do not declare work complete until both documentation updates are included.

Preserve existing manual and uncommitted work. Before editing, inspect `git status`; do not reset, discard, or broadly reformat unrelated changes. Prefer focused patches and verify backend changes with `npx tsc --noEmit`, `npm run build`, and `git diff --check` when practical.
