# Route Migration

This document records the endpoint changes required after replacing the UnityHub backend with NodeExpress. The backend replacement is complete; frontend route and contract migration remains separate.

## Dispatches to Gatepasses

| UnityHub | NodeExpress | Change |
| --- | --- | --- |
| `GET /api/dispatches/status` | Removed | No replacement; the old status endpoint was intentionally removed. |
| `GET /api/dispatches/queued` | `GET /api/gatepasses/queued` | Prefix renamed. |
| `GET /api/dispatches/processed` | `GET /api/gatepasses/processed` | Prefix renamed. |
| `GET /api/dispatches/peek` | `GET /api/gatepasses/peek` | Prefix renamed. |
| `GET /api/dispatches/pop` | `GET /api/gatepasses/pop` | Prefix renamed. |
| `POST /api/dispatches/push` | `POST /api/gatepasses/push` | Prefix renamed; multipart image input is supported by NodeExpress. |
| `PATCH /api/dispatches/finalize` | `PATCH /api/gatepasses/finalize` | Prefix renamed; request schema must be migrated. |
| `GET /api/dispatches/requeue/:id` | `GET /api/gatepasses/requeue/:id` | Prefix renamed. |
| `DELETE /api/dispatches/:id` | `DELETE /api/gatepasses/:id` | Prefix renamed. |
| `GET /api/dispatches/parties` | `GET /api/gatepasses/parties` | Prefix renamed. |
| `POST /api/dispatches/parties` | `POST /api/gatepasses/parties` | Prefix renamed. |
| `PATCH /api/dispatches/parties/:id` | `PATCH /api/gatepasses/parties/:id` | Prefix renamed. |
| `DELETE /api/dispatches/parties/:id` | `DELETE /api/gatepasses/parties/:id` | Prefix renamed. |

## E-Mandi and Documents

| UnityHub | NodeExpress | Change |
| --- | --- | --- |
| `POST /api/emandi/init` | `POST /api/emandi/init` | Same path; request and response envelopes use NodeExpress contracts. |
| `GET /api/emandi/session` | `GET /api/emandi/session` | Same path; NodeExpress creates a new session instead of checking the existing one. |
| `GET /api/emandi/gatepasses` | `POST /api/emandi/gatepasses` | Method and request shape changed. Use `source` with `latest`, `id`, or `payload`. |
| `GET /api/emandi/gatepasses/latest` | `POST /api/emandi/gatepasses` | Latest retrieval is selected through the request body. |
| `GET /api/emandi/niners` | `POST /api/emandi/niners` | Method and request shape changed. |
| `GET /api/emandi/niners/latest` | `POST /api/emandi/niners` | Latest retrieval is selected through the request body. |
| `POST /api/documents/gatepasses` | `POST /api/emandi/gatepasses` | Document generation and actions are merged into the E-Mandi route. |
| `POST /api/documents/niners` | `POST /api/emandi/niners` | Document generation and actions are merged into the E-Mandi route. |

For E-Mandi document requests, `actions` controls download, share, and print. `source: 'latest'` and `source: 'id'` query E-Mandi; `source: 'payload'` renders the supplied data directly.

## Files

| UnityHub | NodeExpress | Change |
| --- | --- | --- |
| `POST /api/files` | `POST /api/files` | Same path; NodeExpress accepts the typed multipart file contract. |
| `GET /api/files/:fileName` | `GET /api/files/:fileName` | Same path; NodeExpress serves PDF files. |
| `POST /api/files/printable` | Removed | Printing is handled as a document action and is currently a placeholder. |

## Imaging

| UnityHub | NodeExpress | Change |
| --- | --- | --- |
| `POST /api/vision/captcha` | `POST /api/imaging/captcha` | Module and prefix renamed; operation extracts text rather than exposing a vision module. |

## Vehicle Tagging

| UnityHub | NodeExpress | Change |
| --- | --- | --- |
| `GET /api/vtag/vehicles/types` | `GET /api/vehicle-tagging/vehicles/types` | Prefix renamed. |
| `GET /api/vtag/vehicles/:gatepassId` | `GET /api/vehicle-tagging/vehicles?gatepassId=...` | Path parameter changed to a query parameter because gatepass IDs can contain `/`. |
| `GET /api/vtag/entries` | `GET /api/vehicle-tagging/entries` | Prefix renamed; query parameters replace the old JSON GET body. |
| `POST /api/vtag/entries` | `POST /api/vehicle-tagging/entries` | Prefix renamed; mobile number falls back to environment configuration. |

## Oakter Remote

| UnityHub | NodeExpress | Change |
| --- | --- | --- |
| `GET /api/oakterremote/isconnected` | `GET /api/oakter-remote/status` | Prefix and endpoint renamed. |
| `GET /api/oakterremote/devices` | `GET /api/oakter-remote/devices` | Prefix renamed; successful content is returned directly. |
| `POST /api/oakterremote/syncdevices` | `POST /api/oakter-remote/sync` | Prefix and endpoint renamed. |
| `POST /api/oakterremote/command` | `POST /api/oakter-remote/commands` | Prefix and endpoint renamed; successful `Response` is returned directly. |

## WhatsApp

| UnityHub | NodeExpress | Change |
| --- | --- | --- |
| `POST /api/whatsapp/webhook` | Not implemented | Remains pending. |
| `POST /api/whatsapp/sendtext/emandi` | Same path | Uses the NodeExpress response contract. |
| `POST /api/whatsapp/sendtext/unityhub` | Same path | Uses the NodeExpress response contract. |
| `POST /api/whatsapp/sharetext/unityhub/:number` | Removed | Temporary participant-based sharing is no longer supported. |
| `POST /api/whatsapp/sharefile` | Removed | Use the explicit E-Mandi or UnityHub send-file routes. |
| `POST /api/whatsapp/sendfile` | `POST /api/whatsapp/sendfile/emandi` or `/unityhub` | Destination is explicit in the route. URL and multipart file flows use the NodeExpress body contract. |

## MongoDB

| UnityHub | NodeExpress | Change |
| --- | --- | --- |
| Startup database initialization | `GET /api/mongo/setup` | Initialization is non-blocking at startup and can be triggered explicitly. |

## Missing NodeExpress Routes

These UnityHub routes have no NodeExpress replacement yet:

- `/api/expenses/*`
- `/api/splitwise/*`
- `/api/mqtt/printer/status`

MQTT printing remains deferred. WhatsApp webhook/inbound processing also remains deferred.

## Frontend Impact

The existing frontend currently calls old paths such as `/api/dispatches`, `/api/vtag`, and `/api/oakterremote`. It will still be served at `/emandi` and `/remote`, but those API calls will fail until the frontend route constants and request payloads are migrated.

## Frontend-Consumed Route Matrix

These are the routes actually called by the current React frontend. Routes listed as available have the same purpose in NodeExpress, but may still require frontend path, method, payload, or response handling changes.

| Frontend request | NodeExpress route | Status | Required change |
| --- | --- | --- | --- |
| `GET /api/dispatches/queued` | `GET /api/gatepasses/queued` | Available under new path | Change `Url.Queued`; unwrap `content` from `ActionResponse`. |
| `GET /api/dispatches/processed` | `GET /api/gatepasses/processed` | Available under new path | Change `Url.Processed`; unwrap `content`. |
| `GET /api/dispatches/requeue/:id` | `GET /api/gatepasses/requeue/:id` | Available under new path | Change base URL; update response handling. |
| `DELETE /api/dispatches/:id` | `DELETE /api/gatepasses/:id` | Available under new path | Change base URL; update response handling. |
| `GET /api/dispatches/parties` | `GET /api/gatepasses/parties` | Available under new path | Change `Url.Parties`; unwrap `content`. |
| `POST /api/dispatches/parties` | `POST /api/gatepasses/parties` | Available under new path | Change URL; verify lowercase NodeExpress field names and response handling. |
| `PATCH /api/dispatches/parties/:id` | `PATCH /api/gatepasses/parties/:id` | Available under new path | Change URL; verify request schema and response handling. |
| `DELETE /api/dispatches/parties/:id` | `DELETE /api/gatepasses/parties/:id` | Available under new path | Change URL; update response handling. |
| `POST /api/dispatches/push` | `POST /api/gatepasses/push` | Available under new path | Change URL; verify multipart field names and response handling. |
| `POST /api/whatsapp/sendtext/unityhub` | Same route | Path available | Frontend sends `Message`; NodeExpress expects `message`. Unwrap `content`. |
| `GET /api/oakterremote/devices` | `GET /api/oakter-remote/devices` | Available under new path | Change URL; NodeExpress returns the catalog in `content`. |
| `POST /api/oakterremote/syncdevices` | `POST /api/oakter-remote/sync` | Available under new path | Change URL; update response handling. |
| `POST /api/oakterremote/command` | `POST /api/oakter-remote/commands` | Available under new path | Change URL; verify `commandId` and `remoteId` types; unwrap `content`. |
| `GET /api/oakterremote/isconnected` | `GET /api/oakter-remote/status` | Available under new path | Change URL; update response field handling. |

### Frontend-Only External Request

`getDistance()` calls the external Bing Maps URL directly. It is not a UnityHub or NodeExpress backend route and does not require backend migration.

### Current Exact Availability

Without frontend changes, only `POST /api/whatsapp/sendtext/unityhub` has the same path. Its body casing is still incompatible. Every dispatch and Oakter request currently returns `404` because the old prefixes and route names are not registered by NodeExpress.

### Common Response Change

The existing frontend expects raw arrays or objects. NodeExpress wraps successful responses as:

```json
{
  "isError": false,
  "traceId": "...",
  "content": {}
}
```

The frontend response helper must unwrap `content` before existing pages consume the result.

## Detailed Contract Changes

### `POST /api/gatepasses/push`

The frontend currently sends multipart fields:

```text
date              DD-MM-YYYY string
seller            string
weight            numeric string
bags              numeric string
party             JSON string
vehicleNumber     string
vehicleType       numeric string
vehicleImage      file, optional
numberPlateImage  file, optional
```

NodeExpress expects:

```text
date          ISO date-time string with timezone offset
seller        string
weight        number or numeric string
bags          number or numeric string
party         party object or JSON string
vehicleNumber string
vehicleType   number or numeric string
vehicleImage  file, optional
plateImage    file, optional
```

Required frontend changes:

- Send `date` as an ISO date-time with timezone offset.
- Rename `numberPlateImage` to `plateImage`.
- Keep `weight`, `bags`, and `vehicleType` numeric values or numeric strings; NodeExpress normalizes them to numbers.
- Keep the existing party fields, but ensure the multipart `party` value is valid JSON.
- Read the successful response from `response.content`; the inserted ID is under `content.insertedId`.

### Party Routes

The party request fields are largely compatible:

```text
name, mandi, state, stateCode, distance, licenceNumber
```

Differences:

- NodeExpress validates strict object keys and rejects unknown fields.
- `stateCode` and `distance` must be numbers in JSON requests.
- `licenceNumber` may be omitted or an empty string; NodeExpress sanitizes an empty value.
- Create, update, and delete responses are wrapped in `ActionResponse`; the frontend currently expects the raw response.

### Queue and Processed Lists

- NodeExpress returns the array under `content`; UnityHub pages currently cast the root JSON value directly to an array.
- NodeExpress stores `weight`, `bags`, and `vehicleType` as numbers; the frontend types currently describe them as strings.
- `peek` returns `204` with no body when empty, while `pop`, `requeue`, and delete use `404` with no body when no record exists.

### `POST /api/whatsapp/sendtext/unityhub`

The frontend currently sends:

```json
{ "Message": "..." }
```

NodeExpress requires:

```json
{ "message": "..." }
```

The response is also wrapped under `content`.

### Oakter Remote

The command request fields remain conceptually the same:

```json
{ "commandId": "123", "remoteId": 505972 }
```

NodeExpress additionally requires positive numeric identifiers and rejects extra fields.

Response differences:

- `devices`: UnityHub consumes `response.Response`; NodeExpress exposes the catalog in `response.content`.
- `sync`: UnityHub consumes `response.Response`; NodeExpress exposes the synchronized catalog in `response.content`.
- `status`: UnityHub consumes root `isConnected`; NodeExpress exposes it under `response.content.isConnected`.
- `command`: UnityHub consumes root `Status` and `Response`; NodeExpress returns the upstream response message directly under `response.content` and throws when upstream `Status` is false.

### Query Parameters

The current React frontend does not consume any NodeExpress query-based route. The vehicle-tagging migration still requires query changes for future consumers:

- `GET /api/vtag/vehicles/:gatepassId` becomes `GET /api/vehicle-tagging/vehicles?gatepassId=...`.
- `GET /api/vtag/entries` becomes `GET /api/vehicle-tagging/entries` with query parameters instead of a JSON GET body.
