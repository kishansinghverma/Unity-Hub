# Project Handoff

Last updated: 2026-09-20

Latest operation: corrected EMandi service error-message wording and typos.

## Current State

The repository is on `main`, synchronized with `origin/main`, with all current work unstaged. The active change set combines a gatepass-document workflow, a REST-oriented API refactor, frontend caller updates, and contributor documentation. Preserve these uncommitted changes when continuing work.

## Architecture and Naming

- `src/backend/routes/emandi.ts`, `operations/emandi.ts`, and `services/emandi.ts` handle authenticated communication with the external eMandi portal.
- `src/backend/routes/dispatches.ts` and `operations/dispatches.ts` handle locally queued/processed dispatches and parties stored in MongoDB.
- `src/backend/routes/documents.ts` and `operations/documents.ts` generate gatepass PDFs for download, MQTT printing, or WhatsApp sharing.
- The React frontend remains under `src/frontends/emandi` and now calls `/api/dispatches` for local workflow data.

## Current API Contract

- eMandi credentials: `POST /api/emandi/init` with only `userName` and `password`; credentials are encrypted through KeyVault, while session status and clearing remain `GET` and `DELETE /api/emandi/session`
- Portal records: `GET /api/emandi/gatepasses` and `GET /api/emandi/niners`
- Captcha OCR: `POST /api/vision/captcha`
- Vehicle tagging: `GET /api/vtag/vehicles/:gatepassId`, `GET /api/vtag/vehicles/types`, and `GET|POST /api/vtag/entries`
- Dispatch lists: `GET /api/dispatches/queued` and `GET /api/dispatches/processed`
- Dispatch management: `GET /api/dispatches/status`, `GET /api/dispatches/peek`, `GET /api/dispatches/pop`, `POST /api/dispatches/push`, `PATCH /api/dispatches/finalize`, `GET /api/dispatches/requeue/:id`, and `DELETE /api/dispatches/:id`
- Parties: `GET|POST /api/dispatches/parties` and `PATCH|DELETE /api/dispatches/parties/:id`
- Gatepass documents: `POST /api/documents/gatepasses`
- eMandi records: `GET /api/emandi/gatepasses/latest`, single-record `GET /api/emandi/gatepasses?id=...&date=DD/MM/YYYY`, and filtered `GET /api/emandi/gatepasses?fromDate=...&toDate=...&limit=...`; equivalent query-based routes exist for `/niners`.

Validation keys now include the HTTP method where one resource path supports multiple operations.

The eMandi `/init` body rejects unknown fields. It stores no session or cookie state on disk, does not use environment credentials, and does not refresh active sessions. Authenticated portal requests reuse the in-memory session, creating one from KeyVault only when the session is absent or expired. Remote authentication failures clear the session and retry the original request once.

`EMandiService.buildRequestOptions` accepts only the active portal request shape: `POST`, headers, and a pre-encoded string body. It does not serialize arbitrary objects or support unused body types.

Coding preference: keep implementations lean and use arrow-function class fields for service and operation methods.

`validator.middleware` runs after body parsing and before route registration. It uses the typed `Validator` in `validationMiddleware.ts` with schemas from `validationSchemas.ts`, validates defined method/path pairs, supports `:id` route patterns, sequentially validates declared `request.params`, `request.body`, and `request.query` sections, writes sanitized values back to the request, and skips undefined paths.

Schemas expose any applicable combination of `params`, `query`, and `body`. The middleware validates each declared section independently.

## Verification

- `npm run build` passes after the direct vtag Axios change, including backend TypeScript compilation and the production React build.
- `npx tsc --noEmit` passes.
- `git diff --check` passes.
- `npm install axios` completed; npm reported 22 audit findings in the dependency tree.
- Vehicle-tagging sample payloads from `Workspace.postman_collection.json` pass their Joi schemas; the vehicle lookup and type routes correctly require no body schema.
- The React build reports existing `react-hooks/exhaustive-deps` warnings in `editparty.tsx`, `newentry.tsx`, `parties.tsx`, `processed.tsx`, and `queued.tsx`.
- The root `npm test` remains an intentional failing placeholder; no backend test framework is configured.

## End-of-Day State

- Typed `errorsBycode` as `Record<number, string>` and removed the lookup cast from `src/backend/common/utils.ts`; unknown statuses still use the generic fallback.
- Renamed the encryption service to `src/backend/services/keyvault.ts` and added `src/backend/operations/keyvault.ts` for encrypted KeyVault persistence. It exposes `initializeDatabase`, `getSecret`, `setSecret`, and `updateSecret`; `getSecret` returns `null` for a missing key and only decrypted values leave the operation. `src/index.ts` attempts KeyVault initialization before starting the other services and HTTP server, logs failures, and continues startup.
- `src/index.ts` now initializes the KeyVault, dispatch, and expense databases at startup. Oakter Remote loads its saved catalog or synchronizes it from the remote service during startup; initialization failures are logged without blocking the remaining startup sequence.

- Receipt parsers `parseNinerReceipt` and `parseGatepassReceipt` were removed.
- Gatepass and Niner document requests support `latest`, `id`, or direct HTML data with `party`, `tables: string[]`, and `qr`.
- `driverMobile` was removed from gatepass and Niner document requests; document sharing uses the eMandi group directly.
- Niner JSON rendering now passes `EMandiNiner` directly to its EJS template; `NinerPdfData` and `renderNinerByJson` were removed.
- Rendered-HTML callbacks, diagnostic HTML persistence, and the legacy generic `/api/files/html` flow were removed.
- The generic HTML EJS template renders `NEM SINGH` for `व्यापारी का पूरा नाम`; document operations still pass the request party, and JSON requests continue rendering the record’s `trader_name`.
- Direct document HTML requests use `template_niner_html.ejs` or `template_gatepass_html.ejs`; JSON requests use `template_niner_json.ejs` or `template_gatepass_json.ejs`.
- `template_emandi.ejs`, `fileService.generatePdfFromHtml`, `files.createAndSharePdf`, the `POST /api/files/html` route, and its validation schema have been removed. `CreatePdfRequest` remains for the dedicated document HTML renderers.
- `HtmlDocumentData` contains only `tables: string[]` and `qr`; it is used by `generateNinerPdfFromHtml` and `generateGatepassPdfFromHtml`.
- HTML document requests now contain only `party`, `tables`, and `qr`; `party` is used separately for WhatsApp captions.
- `emandi.getGatepassHtml`, `emandi.getLatestGatepassHtml`, and `eMandiPortal.gatepassPrint` were removed as leftovers from the former server-side portal-HTML parsing flow.
- `getRecordQuery` retains its `normalizePortalDate` guard because it validates actual calendar dates and protects direct/internal callers, even though route schemas require the date field and format.
- Dispatch route names, operation method names, validation schemas, frontend push URL, README, and handoff documentation now use the same contract, including `GET /api/dispatches/pop`.
- `PATCH /api/dispatches/finalize` accepts optional string fields `gatepassId`, `ninerId`, and `rate`; it always moves the oldest queued record to processed and merges only supplied fields.
- `FinalizeDispatchRequest` is defined at `src/backend/common/types/inbound/request/Dispatch.ts` and is used by `operations/dispatches.ts`.
- Every public method in `operations/dispatches.ts` currently has a route binding; no dead public dispatch operation was found.
- Repository conventions now document the dedicated four-template document rendering flow, lean HTML payloads, request-type placement, and the current dispatch route/finalization contract.
- Vision functionality is exposed through `POST /api/vision/captcha`; eMandi login uses `visionService.resolveCaptcha`, and document QR generation uses `vision.generateQR`.
- Vehicle-tagging requests use dedicated request types, a thin route/operation layer, and `vehicleTaggingService` to send requests directly with Axios. The GET tagging filter preserves the collection’s JSON body, including string `InstrumentType`.
- `getErrorResponse` in `src/backend/common/utils.ts` now recognizes Axios errors, preserves upstream HTTP statuses, and maps transport failures to `502`.
- vtag request handling uses async/await without a local catch, allowing Axios errors and validation errors to reach the shared route error handler.
- `API_ROUTES.md` documents all currently registered API routes and their functionality.
- Vehicle-tagging endpoint constants keep `/api/VehicleTaggingAPI` in `eMandiPortal.vehicleTagging.baseRoute`; each operation stores only its remaining path and the service composes the full upstream URL.
- Vehicle lookup uses the concise `getVehicle` operation/service method and hardcodes upstream `InstrumentType: 1`; other vtag internals use `getTaggingData`, `getVehicleTypes`, and `insertTaggingData`.
- Express vehicle-tagging payloads are defined in `src/backend/common/types/inbound/request/VehicleTagging.ts`; the distinct upstream vehicle lookup payload is defined in `src/backend/common/types/outbound/request/VehicleTagging.ts`.
- Matching tagging collection and creation payloads reuse the inbound `GetTaggedVehicleRequest` and `TagVehicleRequest` models directly; only transformed backend API payloads have separate outbound models.
- Oakter remote service calls use `oakterRemoteRoutes.sendCommand` and `oakterRemoteRoutes.deviceCatalog`; the renewal URL remains environment-configured as a complete URL.
- `operations/documents.ts` now selects HTML or JSON creation explicitly through separate Gatepass/Niner helper methods; download, print, and WhatsApp delivery are handled by one shared completion method.
- The HTML guard in `resolveGatepass`/`resolveNiner` remains because the current `Exclude<...>` type does not narrow nested `source` unions sufficiently for TypeScript; it is unreachable through valid callers but protects direct misuse and preserves compilation.
- `completeDocumentRequest` now accepts `share` and sends via WhatsApp only when `share === true`; download and print remain separate actions.
- Next document UI change: add Print, Download, and Share Via WhatsApp checkboxes, default Share Via WhatsApp to selected, submit all selected actions together, redirect on a returned download link, and notify separately for failed print/share actions.
- `CreateDocumentResponse` is defined at `src/backend/common/types/inbound/response/Documents.ts`; it reports print/share/download statuses and an optional `downloadUrl`.
- Document creation attempts selected actions independently, returns JSON for both document endpoints, and uses the static PDF URL for downloads; the old in-memory PDF response path and unused `readPdf()` helper were removed.
- Document requests may select any combination of print, download, and share actions, provided at least one is selected. Each action returns `success`, `failed`, or `not_requested`; partial failures use HTTP `207` and include per-action error messages.
- Successful download actions return `downloadUrl: /api/files/<fileName>` for frontend redirection.
- Document validation now reports `At least one of print, download, or share must be true` when all actions are false.
- Emandi gatepass and niner query validation now report `id and date must be provided together` when only one paired parameter is supplied.
- Current working preferences: keep functions responsibility-focused, separate HTML/JSON document creation helpers, execute independent document actions without early returns, return structured per-action statuses, and use explicit business-oriented validation messages.
- Current architecture preference: keep route handlers thin, operations responsible for workflows, services responsible for integrations, Express request/response types under `common/types/inbound/{request,response}`, and backend API request/response types under `common/types/outbound/{request,response}`.
- Remote controls now load from `GET /api/oakterremote/devices`, which reads backend `static/oak-devices.json`; `POST /api/oakterremote/syncdevices` updates that file, then the frontend renders the sync response.
- `src/backend/static/oak-devices.json` is intentionally untracked runtime state. `GET /devices` checks for the file through `getCatalog()` and calls `syncCatalog()` when it is missing; `syncCatalog()` uses `fetchCatalogFromRemote()` to hydrate and store the upstream catalog. Later reads reuse the saved file, while explicit refresh uses the sync response directly.
- Verification after the remote catalog flow update: `npx tsc --noEmit` passed, `npm run build` passed with only the existing React hook warnings, and `git diff --check` passed.
- The obsolete tracked `src/frontends/emandi/src/static/commands.json` copy was removed; the backend runtime catalog is now the only source.
- Verification after the catalog cleanup: `npx tsc --noEmit` passed, `npm run build` passed with only the existing React hook warnings, and `git diff --check` passed.
- Remote-control rendering still assumes every device has a valid `CommandList` array and renders no empty/error state when the catalog is empty or malformed; consider adding guarded normalization and an explicit empty state.
- Remote command buttons repeat every command while held because `press()` starts a 500ms interval for all commands; this is intentional for hold controls but may be undesirable for one-shot commands such as power, input, or play.
- The frontend follow-up remains in `todo`: add the three action checkboxes, default Share Via WhatsApp to selected, submit the combined payload, redirect to `downloadUrl`, and notify for failed print/share actions.
- Remote contract review: `/devices`, `/syncdevices`, and `/isconnected` match the frontend assumptions. Global `validationMiddleware` applies the `/command` request schema before the route runs. `commandId` is now string-only in backend validation and service signatures; the frontend normalizes catalog command IDs with `String(...)` before sending them. The frontend still assumes forwarded remote fields `Status` and `Response` without a backend response type or normalization.
- The remote page now shows an initial skeleton and maintains a minimum-height outer panel while `/devices` loads; manual refresh keeps the existing catalog visible.
- Existing unrelated worktree changes remain uncommitted and must be preserved.

## Follow-up Considerations

### eMandi service audit TODO

- [x] Re-authenticate and retry the original request once when the portal reports an expired session, while preventing retry loops.
- [x] Await `purgeCurrentSession()` in authentication-failure cleanup paths.
- [x] Accepted trusted eMandi route constants without adding same-origin URL validation.
- [x] Handle non-captcha login failures immediately and preserve the portal’s failure message/status.
- [x] Treat a missing OCR code as empty instead of the string `"undefined"`, and validate captcha digits before login.
- [ ] Map non-timeout network failures to the appropriate `502` error for the global handler.
- [x] Clear stale cookies before starting a new authentication attempt.
- [x] Coordinate `/init` with in-flight authentication so old credentials cannot recreate a session after credentials change.
- [ ] Make the two credential writes atomic, or define rollback behavior when one write fails.
- [x] Remove the unused `ObjectUtils` import from `src/backend/services/emandi.ts`.
- [x] Correct the eMandi service error-message typos and wording.

- Add API-level tests for session, dispatch status transitions, party updates, and document outcomes.
- Decide whether to retain or remove temporary eMandi cookie persistence before production.
- Protect raw-HTML document generation and print/share side effects with authentication and authorization.
- Add cleanup for generated PDFs in `src/backend/static`.
- Make the operation atomic in `updateAtHead`.
- Add API-level coverage for invalid path parameters and query/body combinations.
- Stored PDF HTML may expose QR data and personal information; restrict access or add cleanup outside debugging.
- Niner and gatepass JSON document rendering use their dedicated EJS templates with typed record mappings, QR generation, and download/print/share handling.
- The portal is responsible for matching `search[value]`; the backend returns the sole result from the `limit=1` response.
- Axios is a runtime dependency used by vtag because native Node `fetch` rejects GET requests with bodies; the collection’s GET tagging payload is now sent through Axios.
- `EMandiQuery` includes optional `id` and `date`; operations decide between single-record and collection retrieval.
- Niner JSON rendering passes the eMandi record directly to `template_niner_json.ejs`.
- QR payload builders intentionally preserve the portal’s punctuation, spacing, missing separators, and static URL suffix.
- QR generation uses byte mode, error correction Q, mask 2, margin 4, and opaque black/white RGBA colors; niner output is version 8/1140px and gatepass output is version 14/1620px.
- Document HTML sources now use `party`, `tables: string[]`, and `qr`; `driverMobile` was removed from gatepass and niner document requests, and WhatsApp sharing uses the eMandi group directly.
- Niner JSON PDFs now pass `EMandiNiner` directly to the EJS template; `NinerPdfData` and `renderNinerByJson` were removed.
- PDF generation no longer exposes rendered HTML callbacks or saves diagnostic HTML files.
- Direct HTML document sources use dedicated document templates; latest/ID sources use the corresponding JSON templates.
- Latest eMandi PDF operation methods and routes were removed; use the document endpoints and JSON-backed rendering flows instead.
- Document requests support `latest`, `id`, or direct `html` data for both gatepasses and niners. Direct HTML data contains `party`, `tables: string[]`, and `qr`; receipt parsers were removed.
- `EMandiRecord` is the union of `EMandiGatepass` and `EMandiNiner`.
- Recheck external clients because legacy `/api/mandiproxy` and old `/api/emandi/*` dispatch paths were intentionally removed without compatibility aliases.
- On the next session, review the final document request schemas and manually exercise gatepass/Niner `latest`, `id`, and direct-HTML requests if endpoint-level verification is needed.

## Completion Rule

After every future operation, update this file and advance the review note in `AGENTS.md`, even when no production code or repository guidance changed. Include the latest activity and verification result.
