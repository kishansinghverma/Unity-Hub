# Unity Hub

Unity Hub hosts multiple remote services and frontends under one domain.

## API resources

- `/api/emandi`: authenticated access to the external eMandi portal. Manage the session through `/session`; retrieve latest, identified, or filtered `/gatepasses` and `/niners`; filter collections with `fromDate`, `toDate`, and `limit`.
- `/api/dispatches`: locally queued and processed dispatch records. Status and initialization are available at `/status` and `/init`; collections are available at `/queued` and `/processed`; records can be inspected at `/peek`, moved with `/pop`, added with `/push`, finalized with `/finalize`, requeued with `/requeue/:id`, or deleted with `/:id`; parties are available under `/parties`.
- `/api/documents/gatepasses`: create a gatepass PDF from `latest`, `id`, or direct HTML data for download, MQTT printing, or WhatsApp sharing.
- `/api/documents/niners`: create a niner PDF from `latest`, `id`, or direct HTML data for download, MQTT printing, or WhatsApp sharing.
- `/api/vision/captcha`: resolve captcha digits from a Base64 image.
- `/api/vtag`: authenticated vehicle-tagging access through `GET /vehicles/:gatepassId`, `GET /vehicles/types`, and `GET|POST /entries`.

Use resource-oriented HTTP methods: `GET` reads, `POST` creates, `PATCH` changes state, `PUT` replaces or initializes an idempotent resource, and `DELETE` removes it.

Defined request schemas are enforced centrally by backend middleware. Schemas may define `query`, `body`, or both; undefined paths pass through without validation.
