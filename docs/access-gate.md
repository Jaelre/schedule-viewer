# Access Gate Overview

The schedule UI is protected by a lightweight password gate that only renders the
application after the server has issued an access cookie. This document explains how
the flow works and how to configure it for local development and deployments.

## How the gate works

1. Visitors land on `/` and see a password form when the `schedule_viewer_access`
   cookie is missing.
2. Submitting the form triggers a `POST` request to `/api/access`.
3. The API route runs on the server and compares the submitted password against the
   `ACCESS_PASSWORD` environment variable using a timing-safe comparison.
4. When the password matches, the server returns success and sets the
   `schedule_viewer_access` cookie with `HttpOnly`, `SameSite=strict`, and a long
   expiration so future visits bypass the gate.
5. The page refreshes and the server component verifies the cookie before rendering
   the full schedule.

If the password is wrong or the environment variable is not configured, the API
returns an error and the password form shows the validation message.

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
2. Invalidate the existing cookie by changing its value: either remove the cookie
   manually from the browser or redeploy after updating the variable. The cookie is
   named `schedule_viewer_access` and deleting it will force the gate to prompt for
   the new password.

## Troubleshooting

| Symptom | Resolution |
| --- | --- |
| Password form keeps showing even after entering the correct password | Ensure `ACCESS_PASSWORD` is set and matches what you expect. Check server logs for `/api/access` responses. |
| API route returns a 500 error stating "Password non configurata." | `ACCESS_PASSWORD` is missing in the environment. Add it to `.env.local` (development) or your deployment's environment variables. |
| You need to reset access for everyone | Rotate the password and clear the `schedule_viewer_access` cookie in affected browsers. |

