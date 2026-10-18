# TODO

## Pending Legacy UnityHub Migration
- Implement `GET /api/mqtt/printer/status` and wire MQTT printing for E-Mandi document actions.
- Implement `POST /api/whatsapp/webhook` and the WhatsApp inbound-message workflow.
- Port legacy Splitwise routes (`/api/splitwise/group/:id`, `/groups`, `/categories`, `/transactions`, `/settlement`).
- Port remaining legacy Expense routes if needed (statements, predictions, descriptions, and transaction processing; `POST /api/expenses/location` is already migrated).
- Ensure any future external vehicle-tagging consumers use query parameter `gatepassId` on `GET /api/vehicle-tagging/vehicles` and query parameters on `GET /api/vehicle-tagging/entries` (replacing legacy path parameter and JSON GET body).

## General Tasks
- Add shared external-response utilities equivalent to Unity-Hub's `GetJsonResponse` and `ValidateResponse`.
- Add vehicle-number minimum-length validation through the field-level validity pattern used by the form components.
- Resolve the frontend React Hook dependency warnings reported by ESLint.
