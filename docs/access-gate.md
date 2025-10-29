# Access Gate Overview

The schedule UI is protected by a lightweight password gate backed by the
Cloudflare Worker. Clients request a short-lived token and keep it in browser
storage, while the Worker validates the token before allowing access to the
schedule API. This document explains how the flow works and how to configure it
for local development and deployments.

## Worker-managed client token flow

1. Visitors land on `/` and see a password form when no valid access token is
   present in `localStorage`.
2. Submitting the form triggers a `POST` request to `/api/access` handled by the
   Worker.
3. The Worker compares the submitted password against the `ACCESS_PASSWORD`
   environment variable using a timing-safe comparison.
4. When the password matches, the Worker responds with a JSON payload containing
   the access token and its expiration timestamp.
5. The browser stores the token in `localStorage` and immediately retries
   `/api/check-access` with an `Authorization: Bearer <token>` header.
6. Valid tokens receive a 200 response and the app proceeds to fetch schedules;
   invalid or expired tokens trigger a logout and the password form is displayed
   again.

If the password is wrong or the environment variable is not configured, the Worker
returns an error and the password form surfaces the validation message.

## Configuration

The access password is **never** bundled into client-side JavaScript. Set it with a
runtime environment variable so that both local development and production builds can
validate submissions server-side.

```bash
# .env.local (Next.js automatically loads this file in development)
ACCESS_PASSWORD="choose-a-strong-password"
```

For production deployments, follow the hosting provider's secret management flow to
set `ACCESS_PASSWORD` (for example, Cloudflare Pages project settings → Environment
Variables).

## Rotating the password

1. Update the `ACCESS_PASSWORD` environment variable to the new secret.
2. Invalidate existing tokens by changing the password and redeploying. Users will
   be forced to re-authenticate the next time the token is checked.

## Telemetry and token reuse

Telemetry uploads reuse the same bearer token issued by `/api/access`. The
browser attaches `Authorization: Bearer <token>` to calls against
`/api/telemetry`, so rotating `ACCESS_PASSWORD` automatically invalidates both
schedule reads and telemetry writes. Administrators can monitor or revoke access
by:

- Rotating `ACCESS_PASSWORD`, which forces the client helper to request a new
  token before sending additional events.
- Watching Worker logs (`wrangler tail`) for anomalous telemetry volume tied to a
  specific token.
- Auditing persisted batches as described in [docs/telemetry.md](telemetry.md).

## Troubleshooting

| Symptom | Resolution |
| --- | --- |
| Password form keeps showing even after entering the correct password | Ensure `ACCESS_PASSWORD` is set and matches what you expect. Check Worker logs for `/api/access` responses. |
| API route returns a 500 error stating "Password non configurata." | `ACCESS_PASSWORD` is missing in the environment. Add it to `.env.local` (development) or your deployment's environment variables. |
| You need to reset access for everyone | Rotate the password and inform users to clear `localStorage` entries for the access token, or wait for the previous token to expire. |

These checks ensure that the worker remains the single source of truth for
password validation and that every downstream request proves authorization via
its `Authorization` header.
