# Architecture

## Repository Structure

```text
.
├── src/
│   ├── backend/
│   │   ├── app.ts
│   │   ├── main.ts
│   │   ├── assets/
│   │   │   ├── anek-deva-bold.ttf
│   │   │   ├── anek-deva-regular.ttf
│   │   │   ├── logo_emandi.png
│   │   │   └── oak-devices.json
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── core/
│   │   │   ├── constants.ts
│   │   │   ├── di/
│   │   │   ├── errors/
│   │   │   ├── http/
│   │   │   ├── logging/
│   │   │   ├── tracing/
│   │   │   ├── utils/
│   │   │   └── validation/
│   │   ├── modules/
│   │   │   ├── cronJobs/
│   │   │   ├── emandi/
│   │   │   ├── file/
│   │   │   ├── gatepass/
│   │   │   ├── imaging/
│   │   │   ├── keyvault/
│   │   │   ├── mongo/
│   │   │   ├── oakterRemote/
│   │   │   ├── s3storage/
│   │   │   ├── vehicleTagging/
│   │   │   └── whatsapp/
│   │   ├── shared/
│   │   │   └── types/
│   │   └── static/
│   └── frontends/
│       └── emandi/
├── dist/
├── postman/
├── AGENTS.md
├── Architecture.md
├── HandOff.md
├── README.md
├── TODO.md
├── route-migration.md
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## Backend Pattern

The backend follows:

```text
Route → Operation → Service → Database or external API
```

- Routes bind HTTP endpoints only.
- Operations orchestrate use cases and return typed operation responses.
- Services own persistence, domain behavior, and external API integration.
- Long-running listeners and background jobs are owned by services and follow the application lifecycle.

## Module Shape

Each module keeps related files together:

```text
module/
├── module.operations.ts
├── module.routes.ts
├── module.schema.ts
├── module.service.ts
└── module.types.ts
```

Some modules omit schema/types files when not needed.

## Current Backend Routes

```text
POST   /api/gatepasses/push
GET    /api/gatepasses/queued
GET    /api/gatepasses/processed
GET    /api/gatepasses/peek
GET    /api/gatepasses/pop
PATCH  /api/gatepasses/finalize
GET    /api/gatepasses/requeue/:id
DELETE /api/gatepasses/:id
GET    /api/gatepasses/parties
POST   /api/gatepasses/parties
PATCH  /api/gatepasses/parties/:id
DELETE /api/gatepasses/parties/:id

GET    /api/mongo/setup

POST   /api/files
GET    /api/files/:fileName

POST   /api/imaging/captcha

POST   /api/emandi/init
GET    /api/emandi/session
POST   /api/emandi/gatepasses
POST   /api/emandi/niners

POST   /api/whatsapp/sendtext/emandi
POST   /api/whatsapp/sendtext/unityhub
POST   /api/whatsapp/sendfile/emandi
POST   /api/whatsapp/sendfile/unityhub

GET    /api/vehicle-tagging/vehicles/types
GET    /api/vehicle-tagging/vehicles?gatepassId=...
GET    /api/vehicle-tagging/entries
POST   /api/vehicle-tagging/entries

GET    /api/oakter-remote/status
GET    /api/oakter-remote/devices
GET    /api/oakter-remote/sync
POST   /api/oakter-remote/commands
```

## Validation and Errors

- Validation schemas are defined per module and merged into the global validation dictionary.
- Validation runs before route handlers.
- Response wrapping is centralized (`ActionResponse` + `traceId`).
- `204` and `404` return no response body.
- 404s log `Route not found!` without structured payload fields.

## Frontend Serving

- Backend serves the built React app at `/emandi` and `/remote`.
- Frontend source remains at `src/frontends/emandi`.
- The active frontend uses the migrated `/api/gatepasses` and `/api/oakter-remote` routes.
- Successful frontend API responses unwrap the centralized `ActionResponse.content` envelope.
- The frontend currently does not consume the E-Mandi document, vehicle-tagging, file, or WhatsApp file routes.

## Runtime and Build

- Dev mode:
  - `npm run dev` runs backend + frontend.
  - Backend runs live TypeScript on port `8080`.
  - Frontend runs CRA dev server on port `3000` with proxy to backend.
- Production build:
  - `tsup` builds backend to `dist/backend`.
  - Frontend build is copied to `dist/frontends/emandi`.

## Configuration

- Environment parsing and defaults live in `src/backend/config/env.ts`.
- Shared constants live in `src/backend/core/constants.ts`.
- Services read settings via `Configuration.GetSetting` or `Configuration.TryGetSetting`.

## Pending Migration Scope

Current backend intentionally excludes UnityHub legacy modules not yet ported:

- Expenses
- Splitwise
- MQTT route surface
- WhatsApp webhook/inbound flow

Track these in `TODO.md` and `route-migration.md`.
