# Unity Hub

Unity Hub hosts multiple remote services and frontends under one domain.

## API resources

- `/api/emandi`: authenticated access to the external eMandi portal. Store credentials through `POST /init`; sessions are created lazily for portal requests and can be inspected or cleared through `/session`; retrieve latest, identified, or filtered `/gatepasses` and `/niners`; filter collections with `fromDate`, `toDate`, and `limit`.
- `/api/dispatches`: locally queued and processed dispatch records. Status is available at `/status`; database initialization runs at startup. Collections are available at `/queued` and `/processed`; records can be inspected at `/peek`, moved with `/pop`, added with `/push`, finalized with `/finalize`, requeued with `/requeue/:id`, or deleted with `/:id`; parties are available under `/parties`.
- `/api/documents/gatepasses`: create a gatepass PDF from `latest`, `id`, or direct HTML data for download, MQTT printing, or WhatsApp sharing.
- `/api/documents/niners`: create a niner PDF from `latest`, `id`, or direct HTML data for download, MQTT printing, or WhatsApp sharing.
- `/api/vision/captcha`: resolve captcha digits from a Base64 image.
- `/api/vtag`: authenticated vehicle-tagging access through `GET /vehicles/:gatepassId`, `GET /vehicles/types`, and `GET|POST /entries`.

Use resource-oriented HTTP methods: `GET` reads, `POST` creates, `PATCH` changes state, `PUT` replaces or initializes an idempotent resource, and `DELETE` removes it.

Request schemas define `query` and/or `body` and are enforced by global backend middleware, including on parameterized routes. Path parameters are not validated by Joi. Missing required path segments return 404 unless another route matches; supplied parameters pass unchanged to handlers. Undefined schemas pass through without validation.

New Entry supports optional vehicle and number-plate photos. The browser accepts JPG, PNG, or WebP files up to 20 MiB, initially resizes them to at most 1600px on the longest edge, and reduces dimensions further as needed until the JPEG is below 1.5 MiB before Base64 encoding. It sends JPEG data URLs as `vehicleImage` and `numberPlateImage` in `POST /api/dispatches/push`. The backend checks string datatype and a `data:image/jpeg;base64,` or `data:image/jpg;base64,` header (case-insensitive), with no image-content or per-image size validation; the overall JSON request limit remains 5 MB. Both fields are stored with the queued MongoDB record; omit unselected fields. Bulk queued/processed lists exclude the images, while `/peek` returns the complete queued record. Finalization currently preserves the image data; replacing it with external image URLs is tracked in `todo`.
