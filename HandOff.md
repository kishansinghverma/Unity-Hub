# Project Handoff

Last updated: 2026-09-23

Latest operation: added a case-insensitive Base64 data URL header check for JPG/JPEG to both optional image fields. Supplied values must start with `data:image/jpeg;base64,` or `data:image/jpg;base64,`; omit unselected images rather than sending empty strings. Image payload content and size are not checked by the schema. Frontend resizing below 1.5 MiB remains unchanged.

## Current State

The repository remains on `main` at `8d493f9`. The earlier documentation edits were preserved; photo UI, request/validation/type changes, focused checks, and documentation updates are now uncommitted. No dependencies or environment variables were added.

## New Entry Photos

- `newentry.tsx` now provides two numbered, independently optional photo cards with previews, replace/remove controls, processing/error states, and mobile stacking. Saving is disabled while a photo is being prepared; failed saves retain images, successful saves clear them.
- The compact photo section retains its accessible region name and input labels; error descriptions are linked only when present. Removed helper-text styles and the unused camera icon.
- Native browser decoding/canvas accepts JPG/PNG/WebP files up to 20 MiB and initially produces JPEG data URLs at up to 1600px on the longest edge (quality 0.85). If output is too large, both dimensions shrink by 20% and the original image is redrawn until the JPEG is strictly below 1.5 MiB before Base64 encoding. Invalid/undecodable inputs and encoder failures still show an error; oversized output is never returned. Two prepared photos remain within the existing 5 MB JSON request limit.
- `createNewEntry` sends optional `vehicleImage` and `numberPlateImage` with the entry to `POST /api/dispatches/push`. The backend checks string datatype and the JPG/JPEG Base64 data URL header, rejects empty strings, and has no payload-content or per-image length checks. `CreateDispatchRequest` types the queue operation. MongoDB stores the image strings with the record.
- Bulk queued/processed queries project out both image fields. `/peek` and record moves preserve complete records. Finalization currently retains Base64 data.
- `todo` and a comment at `finalize` track replacing each image field with a URL fetched from the external system after finalization. External endpoint/lookup mapping is still needed; keep image data until URL retrieval and persistence succeed, and support retries. This follow-up is not implemented.
- Photo-feature verification stubs database and notification I/O; the later obsolete-field cleanup did connect to the configured MongoDB database. Chromium browser checks use local production assets and mocked APIs, validating submitted payloads with the real backend schema.

## Architecture and Naming

- `src/backend/routes/emandi.ts`, `operations/emandi.ts`, and `services/emandi.ts` handle authenticated communication with the external eMandi portal.
- `src/backend/routes/dispatches.ts` and `operations/dispatches.ts` handle locally queued/processed dispatches and parties stored in MongoDB.
- `src/backend/routes/documents.ts` and `operations/documents.ts` generate gatepass PDFs for download, MQTT printing, or WhatsApp sharing.
- The React frontend remains under `src/frontends/emandi` and now calls `/api/dispatches` for local workflow data.

## Current API Contract

- eMandi credentials: `POST /api/emandi/init` with only `username` and `password`; the `{ username, password }` JSON is stored as one encrypted KeyVault secret named `EmandiCredentials`. `GET /api/emandi/session` returns the active session or creates one from KeyVault, and `DELETE /api/emandi/session` clears it.
- Portal records: `GET /api/emandi/gatepasses` and `GET /api/emandi/niners`
- Captcha OCR: `POST /api/vision/captcha`
- Vehicle tagging: `GET /api/vtag/vehicles/:gatepassId`, `GET /api/vtag/vehicles/types`, and `GET|POST /api/vtag/entries`
- Dispatch lists: `GET /api/dispatches/queued` and `GET /api/dispatches/processed`
- Dispatch management: `GET /api/dispatches/status`, `GET /api/dispatches/peek`, `GET /api/dispatches/pop`, `POST /api/dispatches/push`, `PATCH /api/dispatches/finalize`, `GET /api/dispatches/requeue/:id`, and `DELETE /api/dispatches/:id`
- Parties: `GET|POST /api/dispatches/parties` and `PATCH|DELETE /api/dispatches/parties/:id`
- Gatepass documents: `POST /api/documents/gatepasses`
- eMandi records: `GET /api/emandi/gatepasses/latest`, single-record `GET /api/emandi/gatepasses?id=...&date=DD/MM/YYYY`, and filtered `GET /api/emandi/gatepasses?fromDate=...&toDate=...&limit=...`; equivalent query-based routes exist for `/niners`.

Validation keys now include the HTTP method where one resource path supports multiple operations.

The eMandi `/init` body rejects unknown fields. It stores no session or cookie state on disk, does not use environment credentials, and does not refresh active sessions. `GET /session` reuses the in-memory session when active and creates one from KeyVault only when the session is absent or expired. Authenticated portal requests follow the same reuse behavior. Remote authentication failures clear the session and retry the original request once. There is no separate `POST /session` warm-up route.

`EMandiService.buildRequestOptions` accepts only the active portal request shape: `POST`, headers, and a pre-encoded string body. It does not serialize arbitrary objects or support unused body types.

Coding preference: keep implementations lean and use arrow-function class fields for service and operation methods.

`validator.middleware` runs after body parsing and before route registration. It uses the typed `Validator` in `validationMiddleware.ts` with schemas from `validationSchemas.ts`, validates defined method/path pairs, supports `:id` route patterns, sequentially validates declared `request.params`, `request.body`, and `request.query` sections, writes sanitized values back to the request, and skips undefined paths.

Schemas expose any applicable combination of `params`, `query`, and `body`. The middleware validates each declared section independently.

## Verification

- JPG/JPEG header follow-up: `node scripts/check-dispatch-images.cjs`, `npx tsc --noEmit`, `npm run build`, and `git diff --check` passed. Checks cover optional fields, both header spellings, case-insensitivity, malformed/missing headers, and large prefixed strings without a schema size limit. Database I/O was stubbed. Existing build warnings remain; no frontend behavior changed.
- Image validation simplification: `npx tsc --noEmit`, `npm run build`, `node scripts/check-dispatch-images.cjs`, and `git diff --check` passed. The targeted frontend Jest command passed all 4 tests, including automatic retries at/above the size limit, strict-below-limit output, and cleanup on encoder/decoder failure. Existing build warnings remain. Browser checks were not rerun; frontend canvas behavior was verified with mocked encodes, and database I/O was stubbed.
- Obsolete-field cleanup: `npx tsc --noEmit`, `npm run build`, `node scripts/check-dispatch-images.cjs`, and `git diff --check` passed. Existing React hook/Browserslist warnings remain. Direct Joi checks accepted normal queue/gatepass/niner requests and rejected the retired field as unknown.
- Database audit/cleanup ran via `/private/tmp/unity-remove-legacy-contact.cjs audit` and `apply`, using the configured connection outside the sandbox after sandbox access was refused. One queued document was updated with `$unset`; no document values or credentials were printed. All three eMandi collections now have zero matching documents, and their validators do not reference the retired field. Existing backend processes must reload the updated code to enforce the new request contract.
- Repository search found no remaining source/documentation references. Ignored, untracked historical artifacts under `src/frontends/dist` retain old compiled copies; they are outside the active root build and were left untouched per the generated-file guideline. The active root build was regenerated.
- Weight/bags revert: `npm run build` passed and refreshed the served production assets, with existing hook/Browserslist warnings. `git diff --check` passed. Restored the prior JSX structure; no new tests or browser checks were run.
- Weight/bags layout follow-up: `npm test --prefix src/frontends/emandi -- --watchAll=false --runInBand --watchman=false --runTestsByPath src/pages/newentry.test.tsx` passed both tests; `npm run build` passed with existing warnings; `git diff --check` passed. Confirmed Semantic UI's `unstackable` group excludes its mobile stacking rules. Browser checks were not rerun for this layout-only change.
- Photo wording follow-up: reran the targeted frontend Jest command; all 4 tests passed after giving the overall upload region a distinct accessible name (“वाहन और नंबर प्लेट की फोटो”). `git diff --check` passed. No build/browser rerun for this text-only change.
- Final color adjustment: changed only the edit-button background to light blue; `git diff --check` passed. Build/tests/browser results below precede this final color-only tweak.
- Edit/remove positioning follow-up: targeted frontend tests passed (4 total; reran the 2 New Entry tests after adding an edit-picker assertion). `npm run build` passed with existing warnings. Chromium confirmed the pencil opens the correct picker, edit/remove occupy top-right/bottom-right respectively, removal does not open a picker, and save/reset behavior still works. Refreshed the selected-photo screenshot; `git diff --check` passed.
- Selected-photo styling follow-up: the targeted frontend Jest command passed all 4 tests; `npm run build` passed with existing warnings. The Chromium check passed and confirmed green borders on hover, no ready text, icon-only removal without opening the picker, and unchanged save/reset behavior. Reviewed the refreshed selected-photo screenshot. `git diff --check` passed.
- Hover styling follow-up: `npm run build` and `git diff --check` passed. Existing hook/Browserslist warnings remain. Tests and browser checks were not rerun for this CSS-only adjustment.
- Compact layout follow-up: reran the same targeted frontend Jest command (4 tests passed), `npm run build` (passed with existing warnings), and the Chromium check (passed with mocked APIs). Reviewed refreshed desktop/mobile screenshots; all upload controls remain functional. `git diff --check` passed. No backend logic changed in this follow-up.
- `npx tsc --noEmit` passed for the photo changes.
- `npm run build` passed, including backend TypeScript and the production frontend. Existing hook warnings remain; Browserslist also reports outdated `caniuse-lite` data.
- `npm test --prefix src/frontends/emandi -- --watchAll=false --runInBand --watchman=false --runTestsByPath src/pages/newentry.test.tsx src/operations/images.test.ts` passed: 4 tests cover optional uploads, preparation, replacement/removal, invalid/oversized input, payloads, retry retention, and reset. The unrelated legacy `App.test.tsx` was not run.
- `node scripts/check-dispatch-images.cjs` checks optional string fields, rejection of non-strings/empty strings/invalid headers, acceptance of JPG/JPEG headers and large prefixed strings, queue persistence, finalization retention, and list projections. Database and notification I/O are stubbed.
- `node /private/tmp/unity-entry-ui-check.cjs` passed using Chromium outside the sandbox: desktop/mobile cards, real PNG-to-JPEG resize (3200x2000 to 1600x1000), backend-schema acceptance, failed-save retention, and successful reset. Screenshots are at `/private/tmp/unity-entry-desktop.png`, `/private/tmp/unity-entry-selected.png`, and `/private/tmp/unity-entry-mobile.png`. Mobile page width has a pre-existing 1px overflow unchanged when the photo section is hidden; the photo section fits the viewport.
- `git diff --check` passed. Prior verification notes follow:
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
- Document sharing uses the eMandi group directly.
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
- `PATCH /api/dispatches/finalize` accepts optional `gatepassId` and `ninerId` strings, including empty strings, plus a non-empty string `rate` or numeric `0`; it always moves the oldest queued record to processed and merges only supplied fields.
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
- The production build reports existing `react-hooks/exhaustive-deps` warnings in `editparty.tsx`, `newentry.tsx`, `parties.tsx`, `processed.tsx`, and `queued.tsx`.

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
- [x] Consolidate the EMandi username and password into one encrypted `EmandiCredentials` KeyVault secret.
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
- EMandi no longer reads the legacy `emandi.username` or `emandi.password` KeyVault entries; existing legacy entries, if present, are stale and unused.
- Niner JSON rendering passes the eMandi record directly to `template_niner_json.ejs`.
- QR payload builders intentionally preserve the portal’s punctuation, spacing, missing separators, and static URL suffix.
- QR generation uses byte mode, error correction Q, mask 2, margin 4, and opaque black/white RGBA colors; niner output is version 8/1140px and gatepass output is version 14/1620px.
- Document HTML sources now use `party`, `tables: string[]`, and `qr`; WhatsApp sharing uses the eMandi group directly.
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
