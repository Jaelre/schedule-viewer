# Deployment Options for Schedule Viewer

## Context

Schedule Viewer now ships as a fully static Next.js export. All data access, caching and the password gate are handled by the Rust Cloudflare Worker, so there is no longer a need to run the frontend with SSR or the Edge runtime. The default deployment therefore combines a static site host (Cloudflare Pages or any CDN bucket) with the Worker.

---

## Default Deployment: Cloudflare Worker + Static Frontend

### 1. Deploy the Worker

1. Install prerequisites if you have not already:
   - `rustup target add wasm32-unknown-unknown`
   - `npm install -g wrangler`
2. Configure environment variables:
   ```bash
   cd worker
   cp .dev.vars.example .dev.vars       # optional local defaults
   wrangler secret put API_TOKEN        # MetricAid token
   wrangler secret put ACCESS_PASSWORD  # Password shared with the frontend
   ```
3. (Optional) override defaults in `wrangler.toml` (`API_BASE_URL`, `API_TIMEOUT_MS`, `CACHE_TTL_SECONDS`).
4. Deploy:
   ```bash
   wrangler deploy
   ```
5. Note the public Worker URL (e.g. `https://schedule-viewer-worker.your-account.workers.dev`); the static site will call `/api/*` on this host.

### 2. Build and publish the static frontend

1. Set the public environment variables that are baked into the static export. These can be supplied via `.env.production` locally or via your Pages/CI configuration:
   - `NEXT_PUBLIC_API_URL` → the Worker origin plus `/api` (e.g. `https://schedule-viewer-worker.your-account.workers.dev/api`).
   - `NEXT_PUBLIC_DEFAULT_UNIT_NAME`
   - `NEXT_PUBLIC_SHIFT_CODE_DICT`
2. Build the export:
   ```bash
   npm install
   npm run build   # writes the static site to out/
   ```
3. Upload the `out/` directory to your static host:
   - **Cloudflare Pages**: create a Pages project, set the variables above, set build command `npm run build`, and specify `out` as the output directory.
   - **Other static hosts** (S3 + CloudFront, Netlify Drop, GitHub Pages, etc.): upload the contents of `out/` and ensure the site is served over HTTPS.

The static site consumes the Worker for everything non-static, so no additional server-side infrastructure is required.

---

## Worker Access Token Contract

The Worker exposes the following endpoints:

- `POST /api/access` – accepts `{ "password": "..." }` and returns `{ "success": true, "token": "..." }` when the password matches `ACCESS_PASSWORD`.
- `GET /api/check-access` – validates the caller by checking the `Authorization: Bearer <token>` header (and, for legacy clients, the old cookie).
- `GET /api/shifts?ym=YYYY-MM` – returns the month schedule, enforcing the same bearer-token check.

The static frontend stores the returned token (currently identical to the password) and includes it in the `Authorization` header for subsequent requests. Any alternative frontend or integration must follow the same contract: obtain the token via `/api/access`, then send it as a bearer token to `check-access` and `shifts`.

---

## Alternative Hosting Notes

You are free to host the static export anywhere, provided it can call the Worker over HTTPS and attach the bearer token header. Typical options include:

- **Vercel / Netlify / S3 + CDN**: run `npm run build`, upload `out/`, and configure public environment variables so the build knows which Worker URL to call. Ensure the Worker domain is allowed by your host's CORS settings if you introduce a custom domain.
- **Internal portals**: bundle the static assets into the existing site but preserve the fetches to the Worker and forward the bearer token header unmodified.

Regardless of host, never expose the MetricAid `API_TOKEN` to the frontend. All secrets stay inside the Worker, and the only shared secret is the password/token pair managed through `ACCESS_PASSWORD`.

