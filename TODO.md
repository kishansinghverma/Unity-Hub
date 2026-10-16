# TODO

- Replace generated PDF random filenames with names derived from the Gatepass/Niner ID.
- Wire MQTT printing for E-Mandi document actions.
- [x] Handle expired E-Mandi session redirection & validate identity cookie: detect silent HTTP 200 HTML redirects on expired sessions and automatically re-authenticate.
- Detect expired E-Mandi credentials more authoritatively.
- Implement `POST /api/whatsapp/webhook`.
- Implement the WhatsApp inbound-message workflow.
- Add shared external-response utilities equivalent to Unity-Hub's `GetJsonResponse` and `ValidateResponse`.
- Update the distance calculation API.
- Add vehicle-number minimum-length validation through the field-level validity pattern used by the form components.
- Resolve the frontend React Hook dependency warnings reported by ESLint.
- Cleanup Supabase on cron (delete images with age >= 7 days).
- Capture coordinates from the browser Geolocation API and add backend support to receive and persist them on `POST /api/gatepasses/push`.
