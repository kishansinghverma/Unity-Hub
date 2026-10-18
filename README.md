# Unity Hub

Unity Hub contains the NodeExpress Fastify backend and the existing E-Mandi React frontend.

## Documentation

- `Architecture.md` for detailed backend architecture, route map, and runtime behavior.
- `AGENTS.md` for coding conventions and repository working rules.
- `TODO.md` for pending tasks and unmigrated legacy endpoints.

## Development

```bash
npm install
npm run dev
```

The backend serves the frontend at `/emandi` and `/remote` when a production frontend build exists. Build both applications with:

```bash
npm run build
npm start
```

## Backend Structure

```text
src/
├── backend/
│   ├── app.ts
│   ├── main.ts
│   ├── assets/
│   ├── config/
│   ├── core/
│   ├── modules/
│   ├── shared/
│   └── static/
└── frontends/
    └── emandi/
```

## Current API Modules

- `/api/gatepasses`
- `/api/mongo`
- `/api/whatsapp`
- `/api/imaging`
- `/api/files`
- `/api/emandi`
- `/api/vehicle-tagging`
- `/api/oakter-remote`
- `/api/expenses`
