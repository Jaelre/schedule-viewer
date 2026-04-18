# Access Gate Overview

The schedule UI is protected by a lightweight password gate backed by the
Cloudflare Worker. Successful logins now issue first-party cookies directly from
the Worker: a short-lived authenticated session cookie plus a long-lived visitor
cookie used for pseudonymous analytics correlation. This document explains the
flow and how to configure it for local development and deployments.

## Worker-managed cookie flow

1. Visitors land on `/` and see a password form when no valid authenticated
   session cookie is present.
2. Submitting the form triggers a `POST` request to `/api/access` handled by the
   Worker.
3. The Worker compares the submitted password against the `ACCESS_PASSWORD`
   environment variable using a timing-safe comparison.
4. When the password matches, the Worker signs a new browser session cookie and
   refreshes the long-lived `schedule_viewer_vid` visitor cookie.
5. The browser immediately retries `/api/check-access`; cookies are sent
   automatically with same-origin requests.
6. Valid sessions receive a 200 response and the app proceeds to fetch
   schedules; invalid or expired sessions trigger a logout and the password form
   is displayed again.

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

## Rotating the session mechanism

Existing bearer/localStorage logins are intentionally no longer honored. That
forces every active viewer back through `/api/access` without requiring a
password change, which ensures the new first-party visitor tracking cookie is
present for subsequent telemetry.

## Telemetry and cookie reuse

Telemetry uploads reuse the same authenticated session cookie issued by
`/api/access`. The Worker also reads the long-lived visitor cookie so telemetry
events can carry a stable first-party visitor id. Administrators can monitor or
revoke access by:

- Rotating `ACCESS_PASSWORD`, which invalidates the session signing fallback and
  forces re-authentication.
- Watching Worker logs (`wrangler tail`) for anomalous telemetry volume tied to a
  specific visitor or session id.
- Auditing persisted batches as described in [docs/telemetry.md](telemetry.md).

## Troubleshooting

| Symptom | Resolution |
| --- | --- |
| Password form keeps showing even after entering the correct password | Ensure `ACCESS_PASSWORD` is set and matches what you expect. Check Worker logs for `/api/access` responses and confirm the browser accepts first-party cookies for the site. |
| API route returns a 500 error stating "Password non configurata." | `ACCESS_PASSWORD` is missing in the environment. Add it to `.env.local` (development) or your deployment's environment variables. |
| You need to reset access for everyone | Redeploy the new worker/session flow or rotate `ACCESS_PASSWORD`; clients will be forced to re-authenticate without needing a manual localStorage cleanup. |

These checks ensure that the worker remains the single source of truth for
password validation and that every downstream request proves authorization via
its first-party session cookie.
