# API Routes

All routes are served under the `/api` prefix.

## eMandi

| API route | Functionality |
| --- | --- |
| `GET /api/emandi/session` | Check eMandi session status |
| `POST /api/emandi/session` | Initialize eMandi session |
| `DELETE /api/emandi/session` | Clear eMandi session |
| `GET /api/emandi/gatepasses` | Fetch gatepass records |
| `GET /api/emandi/gatepasses/latest` | Fetch the latest gatepass |
| `GET /api/emandi/niners` | Fetch 9R records |
| `GET /api/emandi/niners/latest` | Fetch the latest 9R record |

## Dispatches

| API route | Functionality |
| --- | --- |
| `GET /api/dispatches/status` | Check dispatch database status |
| `PUT /api/dispatches/init` | Initialize dispatch database |
| `GET /api/dispatches/queued` | List queued dispatches |
| `GET /api/dispatches/processed` | List processed dispatches |
| `GET /api/dispatches/peek` | View oldest queued dispatch |
| `GET /api/dispatches/pop` | Remove oldest queued dispatch |
| `POST /api/dispatches/push` | Add a dispatch to the queue |
| `PATCH /api/dispatches/finalize` | Finalize a queued dispatch |
| `GET /api/dispatches/requeue/:id` | Requeue a dispatch |
| `DELETE /api/dispatches/:id` | Delete a queued dispatch |
| `GET /api/dispatches/parties` | List parties |
| `POST /api/dispatches/parties` | Add a party |
| `PATCH /api/dispatches/parties/:id` | Update a party |
| `DELETE /api/dispatches/parties/:id` | Delete a party |

## Expenses

| API route | Functionality |
| --- | --- |
| `GET /api/expenses/locations` | List expense locations |
| `GET /api/expenses/init` | Initialize expense database |
| `GET /api/expenses/reviewedon` | Get review date |
| `GET /api/expenses/predictions` | List expense predictions |
| `GET /api/expenses/descriptions` | List expense descriptions |
| `GET /api/expenses/statement/bank` | Fetch bank statement |
| `GET /api/expenses/statement/paymentapp` | Fetch payment-app statement |
| `POST /api/expenses/locations` | Add expense location |
| `POST /api/expenses/description` | Add expense description |
| `POST /api/expenses/predictions` | Add expense prediction |
| `POST /api/expenses/statement/bank` | Add bank statement entry |
| `POST /api/expenses/statement/paymentapp` | Add payment-app entry |
| `POST /api/expenses/finalize` | Finalize an expense transaction |
| `POST /api/expenses/process/bank/:id` | Process bank transaction |
| `POST /api/expenses/process/paymentapp/:id` | Process payment-app transaction |
| `POST /api/expenses/process/location/:id` | Process location transaction |

## Files

| API route | Functionality |
| --- | --- |
| `POST /api/files/` | Upload a file |
| `POST /api/files/printable` | Handle printable-file request |
| `GET /api/files/:filename` | Download a generated file |

## Documents

| API route | Functionality |
| --- | --- |
| `POST /api/documents/gatepasses` | Generate a gatepass document |
| `POST /api/documents/niners` | Generate a 9R document |

## Vision

| API route | Functionality |
| --- | --- |
| `POST /api/vision/captcha` | Resolve a captcha image |

## Vehicle Tagging

| API route | Functionality |
| --- | --- |
| `GET /api/vtag/vehicles/:gatepassId` | Find a vehicle by gatepass |
| `GET /api/vtag/vehicles/types` | Get vehicle types |
| `GET /api/vtag/entries` | Get vehicle-tagging entries |
| `POST /api/vtag/entries` | Create a vehicle-tagging entry |

## MQTT

| API route | Functionality |
| --- | --- |
| `GET /api/mqtt/printer/status` | Get printer status |

## Oakter Remote

| API route | Functionality |
| --- | --- |
| `GET /api/oakterremote/isconnected` | Check Oakter connection |
| `GET /api/oakterremote/devices` | Get Oakter devices |
| `POST /api/oakterremote/syncdevices` | Synchronize Oakter devices |
| `POST /api/oakterremote/command` | Send an Oakter command |

## Splitwise

| API route | Functionality |
| --- | --- |
| `GET /api/splitwise/group/:id` | Get a Splitwise group |
| `GET /api/splitwise/groups` | List Splitwise groups |
| `GET /api/splitwise/categories` | List Splitwise categories |
| `PATCH /api/splitwise/groups` | Update Splitwise group information |
| `POST /api/splitwise/transactions` | Add a Splitwise transaction |
| `POST /api/splitwise/settlement` | Settle Splitwise expenses |

## WhatsApp

| API route | Functionality |
| --- | --- |
| `POST /api/whatsapp/webhook` | Receive WhatsApp webhook events |
| `POST /api/whatsapp/sendtext/emandi` | Send text to the eMandi group |
| `POST /api/whatsapp/sendtext/unityhub` | Send text to the Unity Hub group |
| `POST /api/whatsapp/sharetext/unityhub/:number` | Share text with a number |
| `POST /api/whatsapp/sharefile/unityhub/:number` | Share a file with a number |

The server returns `404` for unmatched routes. The `GET /api/vtag/entries` endpoint accepts its upstream filter payload in the request body.
