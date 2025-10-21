# Monthly Shift Viewer

Monthly schedule explorer for emergency department shifts. The UI is built with Next.js 15 + React 19, while a Rust Cloudflare Worker signs requests to the MetricAid API, normalises the payload and caches results.

## Highlights
- Virtualised month grid renders 100+ clinicians smoothly, with multi-shift-per-day support and density toggle.
- Italian locale by default (Europe/Rome timezone, Italian labels and holidays).
- Deterministic, accessible colour palette with overrides in `public/config/shift-colors.json`.
- Configurable dictionary for shift labels via `NEXT_PUBLIC_SHIFT_CODE_DICT` and doctor name mapping via `public/config/doctor-names.json`.
- Cloudflare Worker proxies all data access, injects secrets, retries upstream failures and keeps a short-lived in-memory cache.
- Client refreshes data every 10 minutes and surfaces clear loading/error states.
- Schedule access is gated by a worker-managed password exchange: clients `POST /api/access`, stash the returned token in `localStorage` and send it as an `Authorization` header to `/api/check-access` before fetching schedules (see [docs/access-gate.md](docs/access-gate.md#worker-managed-client-token-flow)).

## Architecture at a Glance
- **Frontend**: Next.js App Router (static export) with Tailwind CSS and shadcn/ui primitives, TanStack Query for data fetching/cache and TanStack Virtual for row virtualisation.
- **Backend**: Rust worker deployed with Cloudflare Wrangler. It validates `ym` parameters, expands month bounds, talks to MetricAid using the `API_TOKEN`, merges multiple shifts per day and exposes a CORS-friendly `/api/shifts` endpoint.
- **Data flow**: Browser → Worker `/api/shifts?ym=YYYY-MM` → MetricAid `public/schedule` endpoint. Successful responses are cached for `CACHE_TTL_SECONDS` and returned alongside an `X-Cache-Status` header.
- **Docs**: Architecture decisions live in `docs/adrs`, with upstream API captures inside `.api-samples` and private operational notes under `docs/private/`.

## Repository Layout

```
schedule-viewer/
├── src/
│   ├── app/                # Next.js entrypoint, layout and UI components
│   └── lib/                # API client, date helpers, colours, doctor dictionary
├── worker/                 # Rust Cloudflare Worker + wrangler config
├── docs/                   # ADRs, API reference snapshots, sensitive-file guidance
├── public/
│   └── icons/              # Favicons and manifest assets
├── .api-samples/           # Captured MetricAid JSON for reference/testing
├── .env.example            # Frontend environment template
├── package.json
└── README.md
```

## Prerequisites
- Node.js 18+ and npm.
- Rust 1.70+ with the `wasm32-unknown-unknown` target (`rustup target add wasm32-unknown-unknown`).
- Cloudflare Wrangler CLI (`npm install -g wrangler`).
- A MetricAid API token for production/real-data usage.

## Quick Start

1. Clone & install:

   ```bash
   git clone https://github.com/Jaelre/schedule-viewer.git
   cd schedule-viewer
   npm install
   ```

2. Configure the frontend environment (used at build and runtime):

   ```bash
   cp .env.example .env.local
   # optionally set NEXT_PUBLIC_API_URL to point at a local/remote Worker
 ```

   Populate `NEXT_PUBLIC_SHIFT_CODE_DICT` if you want custom labels surfaced in the UI legend.

3. Set the access password used by the worker-managed gate:

   ```bash
   echo 'ACCESS_PASSWORD="choose-a-strong-password"' >> .env.local
   ```

   Refer to [docs/access-gate.md](docs/access-gate.md#worker-managed-client-token-flow) for details on how the token-based access gate works.

4. (Optional) adjust local dictionaries and styling overrides:
   - The static export reads JSON files from `public/config/*.json`. Update those files directly (or replace them in Cloudflare Pages) to change doctor names, colour palettes, or styling without rebuilding the site.
   - Reference the templates under `public/config` (e.g. `doctor-names.json.example`, `shift-styling.config.example.json`) when creating new runtime JSON files.

5. Start the Next.js dev server:

   ```bash
   npm run dev
   ```

   The UI opens at http://localhost:3000. If `NEXT_PUBLIC_API_URL` is unset it falls back to `/api`, so configure it to match the Worker endpoint when running against live data.

## Running the Cloudflare Worker Locally

1. Install dependencies (Rust, wrangler) and ensure the wasm target is added.
2. Seed secrets:

   ```bash
   cd worker
   cp .dev.vars.example .dev.vars
   # add API_TOKEN=<your_metricaid_token>
   ```

3. Run the Worker in dev mode:

   ```bash
   wrangler dev
   ```

   Wrangler serves the Worker at http://localhost:8787. When running the frontend locally against it, set `NEXT_PUBLIC_API_URL=http://localhost:8787/api` in `.env.local` and restart `npm run dev`.

## Deployment

- **Cloudflare Worker**:

  ```bash
  cd worker
  wrangler deploy
  wrangler secret put API_TOKEN   # supply the MetricAid token when prompted
  ```

  The default `wrangler.toml` exposes configurable `API_BASE_URL`, `API_TIMEOUT_MS` and `CACHE_TTL_SECONDS` variables.

- **Cloudflare Pages (frontend)**:
  - Build command: `npm run build` (Next.js static export writes to `out/`).
  - Output directory: `out`.
  - Environments need the same variables as `.env.local` (e.g. `NEXT_PUBLIC_DEFAULT_UNIT_NAME`, `NEXT_PUBLIC_SHIFT_CODE_DICT`, `NEXT_PUBLIC_API_URL` pointing at the Worker).

- **Worker secrets**:
  - `API_TOKEN`: MetricAid API authentication
  - `ACCESS_PASSWORD`: Password gate authentication (set via `wrangler secret put ACCESS_PASSWORD`)

## API Contract

`GET /api/shifts?ym=YYYY-MM`

Successful response:

```json
{
  "ym": "2025-10",
  "people": [
    { "id": "33935", "name": "SURNAME Name" }
  ],
  "rows": [
    [
      ["D"],
      ["D"],
      ["N"],
      null,
      ["O"]
    ]
  ],
  "codes": ["D", "N", "O"],
  "shiftNames": {
    "D": "D 8:00 - 14:00",
    "N": "N 20:00 - 08:00"
  }
}
```

Each `rows[i][day]` entry is either `null` (no assignment) or an array of one or more shift codes for that person on that day.

Error envelope:

```json
{
  "error": {
    "code": "INVALID_YM",
    "message": "Invalid ym format. Expected YYYY-MM"
  }
}
```

## Tooling & Scripts
- `npm run dev` – Next.js dev server.
- `npm run build` – Type checking and production build.
- `npm run lint` – Next.js / ESLint checks.
- Worker builds are handled automatically by `wrangler` via `worker/build`.

## Troubleshooting
- **Missing API token**: run `wrangler secret put API_TOKEN` in `worker/` and redeploy/restart.
- **Frontend shows empty grid**: verify the Worker URL in `.env.local` and check the browser console for errors from `/api/shifts`.
- **Upstream timeouts**: consider raising `API_TIMEOUT_MS` in `worker/wrangler.toml`; the Worker currently retries twice before surfacing `UPSTREAM_TIMEOUT`.
- **Styling issues after colour changes**: ensure HSL values in `public/config/shift-colors.json` maintain sufficient contrast; the fallback generator covers undefined codes.

## License

ISC License. See `LICENSE` for details.

## Contributing

Fork, branch, implement, open a PR. Issues and feature proposals are welcome in the tracker.
