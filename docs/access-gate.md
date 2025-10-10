# Access Gate Overview

The schedule UI is protected by the Cloudflare Worker that fronts every API call.
Instead of issuing an HTTP-only cookie from Next.js, the worker performs the
password check itself and returns a token that the browser stores in
`localStorage`. Subsequent requests send that token in the `Authorization`
header so the worker can validate access before returning any protected data.

## Worker endpoints and token flow

1. Visitors load `/` and the client-side password gate immediately looks for a
   `schedule_viewer_token` entry in `localStorage`.
2. When no token is present, the form submits a `POST` request to the worker’s
   `/api/access` endpoint with the password in the JSON body.
3. The worker retrieves the `ACCESS_PASSWORD` secret, compares it against the
   submitted password using a constant-time check, and responds with
   `{ success: true, token: "…" }` when it matches.
4. The browser stores the returned token in `localStorage` and uses it for all
   future requests.
5. Before rendering the schedule, the UI calls `GET /api/check-access`. The
   worker reads the `Authorization: Bearer <token>` header, compares it to the
   configured secret, and only reports success when the token is valid. (Legacy
   cookie checks remain in place solely for backward compatibility.)

Because the token is just the shared secret, rotating the password automatically
invalidates every stored token. The next visit will prompt for the new password
and the flow begins again.

## Configuration

- **Set the worker secret** – The worker must have the `ACCESS_PASSWORD` secret
  defined. Run `wrangler secret put ACCESS_PASSWORD` in the `worker/` directory
  (or add it to `.dev.vars` when using `wrangler dev`) and provide a strong
  password. Deployments need the same secret defined through the platform’s
  secret management UI.
- **Expose the worker to the client** – Ensure `NEXT_PUBLIC_API_URL` points to
  the worker origin (for example `http://localhost:8787/api` in development) so
  the password gate calls `/api/access` and `/api/check-access` on the worker.
- **Token lifecycle** – No cookies are issued. The token lives entirely in the
  browser’s `localStorage`. Rotating `ACCESS_PASSWORD` or running `wrangler
  secret put ACCESS_PASSWORD` with a new value immediately invalidates existing
  tokens; users will re-authenticate on their next request. To force an instant
  logout for a single browser, remove the `schedule_viewer_token` item from
  `localStorage`.

## Troubleshooting

| Symptom | Resolution |
| --- | --- |
| `POST /api/access` returns `Password not configured` | The worker is missing the `ACCESS_PASSWORD` secret.<br>Run `wrangler secret put ACCESS_PASSWORD` (or define it in `.dev.vars` when using `wrangler dev`) and redeploy. |
| `GET /api/check-access` responds `401` even after login | Confirm requests include `Authorization: Bearer <token>`.<br>The worker only grants access when that token matches the `ACCESS_PASSWORD` secret. Clear `localStorage` and log in again to refresh the token. |
| Users still see the old schedule after rotation | Tokens mirror the password.<br>After updating the secret, ask users to refresh; the first `/api/check-access` call will fail and the gate will prompt for the new password. |

These checks ensure that the worker remains the single source of truth for
password validation and that every downstream request proves authorization via
its `Authorization` header.
