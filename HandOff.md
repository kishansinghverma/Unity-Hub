# Project Handoff

Last updated: 2026-09-10

Latest operation: documented current route, type, and rendering conventions in `AGENTS.md`.

## Current State

The repository is on `main`, synchronized with `origin/main`, with all current work unstaged. The active change set combines a gatepass-document workflow, a REST-oriented API refactor, frontend caller updates, and contributor documentation. Preserve these uncommitted changes when continuing work.

## Architecture and Naming

- `src/backend/routes/emandi.ts`, `operations/emandi.ts`, and `services/emandi.ts` handle authenticated communication with the external eMandi portal.
- `src/backend/routes/dispatches.ts` and `operations/dispatches.ts` handle locally queued/processed dispatches and parties stored in MongoDB.
- `src/backend/routes/documents.ts` and `operations/documents.ts` generate gatepass PDFs for download, MQTT printing, or WhatsApp sharing.
- The React frontend remains under `src/frontends/emandi` and now calls `/api/dispatches` for local workflow data.

## Current API Contract

- Session: `POST`, `GET`, or `DELETE /api/emandi/session`
- Portal records: `GET /api/emandi/gatepasses` and `GET /api/emandi/niners`
- Captcha OCR: `POST /api/emandi/captcha-resolutions`
- Dispatch lists: `GET /api/dispatches/queued` and `GET /api/dispatches/processed`
- Dispatch management: `GET /api/dispatches/status`, `PUT /api/dispatches/init`, `GET /api/dispatches/peek`, `GET /api/dispatches/pop`, `POST /api/dispatches/push`, `PATCH /api/dispatches/finalize`, `GET /api/dispatches/requeue/:id`, and `DELETE /api/dispatches/:id`
- Parties: `GET|POST /api/dispatches/parties` and `PATCH|DELETE /api/dispatches/parties/:id`
- Gatepass documents: `POST /api/documents/gatepasses`
- eMandi records: `GET /api/emandi/gatepasses/latest`, single-record `GET /api/emandi/gatepasses?id=...&date=DD/MM/YYYY`, and filtered `GET /api/emandi/gatepasses?fromDate=...&toDate=...&limit=...`; equivalent query-based routes exist for `/niners`.

Validation keys now include the HTTP method where one resource path supports multiple operations.

`validator.middleware` runs after body parsing and before route registration. It uses the typed `Validator` in `validationMiddleware.ts` with schemas from `validationSchemas.ts`, validates defined method/path pairs, supports `:id` route patterns, sequentially validates declared `request.params`, `request.body`, and `request.query` sections, writes sanitized values back to the request, and skips undefined paths.

Schemas expose any applicable combination of `params`, `query`, and `body`. The middleware validates each declared section independently.

## Verification

- `npm run build` passes, including backend TypeScript compilation and the production React build.
- `npx tsc --noEmit` passes.
- `git diff --check` passes.
- The React build reports existing `react-hooks/exhaustive-deps` warnings in `editparty.tsx`, `newentry.tsx`, `parties.tsx`, `processed.tsx`, and `queued.tsx`.
- The root `npm test` remains an intentional failing placeholder; no backend test framework is configured.

## End-of-Day State

- Receipt parsers `parseNinerReceipt` and `parseGatepassReceipt` were removed.
- Gatepass and Niner document requests support `latest`, `id`, or direct HTML data with `name`, `party`, `tables: string[]`, and `qr`.
- `driverMobile` was removed from gatepass and Niner document requests; document sharing uses the eMandi group directly.
- Niner JSON rendering now passes `EMandiNiner` directly to its EJS template; `NinerPdfData` and `renderNinerByJson` were removed.
- Rendered-HTML callbacks, diagnostic HTML persistence, and the legacy generic `/api/files/html` flow were removed.
- The generic HTML EJS template renders `NEM SINGH` for `व्यापारी का पूरा नाम`; document operations still pass the request party, and JSON requests continue rendering the record’s `trader_name`.
- Direct document HTML requests use `template_niner_html.ejs` or `template_gatepass_html.ejs`; JSON requests use `template_niner_json.ejs` or `template_gatepass_json.ejs`.
- `template_emandi.ejs`, `fileService.generatePdfFromHtml`, `files.createAndSharePdf`, the `POST /api/files/html` route, and its validation schema have been removed. `CreatePdfRequest` remains for the dedicated document HTML renderers.
- `HtmlDocumentData` contains only `tables: string[]` and `qr`; it is used by `generateNinerPdfFromHtml` and `generateGatepassPdfFromHtml`.
- HTML request `name` remains part of the public request contract, while `party` is used separately for WhatsApp captions.
- `emandi.getGatepassHtml`, `emandi.getLatestGatepassHtml`, and `eMandiPortal.gatepassPrint` were removed as leftovers from the former server-side portal-HTML parsing flow.
- `getRecordQuery` retains its `normalizePortalDate` guard because it validates actual calendar dates and protects direct/internal callers, even though route schemas require the date field and format.
- Dispatch route names, operation method names, validation schemas, frontend push URL, README, and handoff documentation now use the same contract, including `GET /api/dispatches/pop`.
- `PATCH /api/dispatches/finalize` accepts optional string fields `gatepassId`, `ninerId`, and `rate`; it always moves the oldest queued record to processed and merges only supplied fields.
- `FinalizeDispatchRequest` is defined at `src/backend/common/types/request/FinalizeDispatchRequest.ts` and is used by `operations/dispatches.ts`.
- Every public method in `operations/dispatches.ts` currently has a route binding; no dead public dispatch operation was found.
- Repository conventions now document the dedicated four-template document rendering flow, lean HTML payloads, request-type placement, and the current dispatch route/finalization contract.
- Existing unrelated worktree changes remain uncommitted and must be preserved.

## Follow-up Considerations

- Add API-level tests for session, dispatch status transitions, party updates, and document outcomes.
- Decide whether to retain or remove temporary eMandi cookie persistence before production.
- Protect raw-HTML document generation and print/share side effects with authentication and authorization.
- Add cleanup for generated PDFs in `src/backend/static`.
- Make the operation atomic in `updateAtHead`.
- Add API-level coverage for invalid path parameters and query/body combinations.
- Stored PDF HTML may expose QR data and personal information; restrict access or add cleanup outside debugging.
- Niner and gatepass JSON document rendering use their dedicated EJS templates with typed record mappings, QR generation, and download/print/share handling.
- The portal is responsible for matching `search[value]`; the backend returns the sole result from the `limit=1` response.
- `EMandiQuery` includes optional `id` and `date`; operations decide between single-record and collection retrieval.
- Niner JSON rendering passes the eMandi record directly to `template_niner_json.ejs`.
- QR payload builders intentionally preserve the portal’s punctuation, spacing, missing separators, and static URL suffix.
- QR generation uses byte mode, error correction Q, mask 2, margin 4, and opaque black/white RGBA colors; niner output is version 8/1140px and gatepass output is version 14/1620px.
- Document HTML sources now use `name`, `party`, `tables: string[]`, and `qr`; `driverMobile` was removed from gatepass and niner document requests, and WhatsApp sharing uses the eMandi group directly.
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
