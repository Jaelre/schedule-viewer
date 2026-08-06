# Repository Guidelines

## Project

Schedule Viewer is a read-only Next.js monthly schedule UI backed by a Rust
Cloudflare Worker. The Worker keeps `API_TOKEN` private, fetches MetricAid data,
loads configuration from R2, and returns the normalized schedule used by the UI.

- `src/app/` — Next.js App Router and page components
- `src/lib/` — API, auth, date, color, and configuration helpers
- `src/config/` — runtime configuration uploaded to R2
- `worker/src/` — Rust Worker implementation
- `public/`, `docs/`, `claudedocs/` — static assets and documentation

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npx wrangler dev --config worker/wrangler.toml
```

Run `npm run lint` and `npm run build` for changes affecting the app. Add
co-located tests when a test setup is introduced; until then, document manual
QA for behavior changes.

## Conventions

- Use TypeScript, React function components, and named exports for shared code.
- Use 2-space indentation, single quotes, trailing commas, and Tailwind classes.
- Name components in PascalCase and hooks/utilities in camelCase.
- Prefer explicit error propagation and diagnosable failures; do not silently
  swallow errors or add implicit fallback behavior.
- Keep changes focused. Update relevant documentation when behavior changes.

## Configuration and secrets

- Never commit API keys or expose `API_TOKEN` to the browser. Manage it with
  `wrangler secret put API_TOKEN`.
- Keep sensitive files in `src/config/`; upload them with
  `./scripts/upload-config-to-r2.sh` rather than moving them to `public/`.
- Review the applicable `wrangler.toml` before deploying, especially API URLs,
  cache settings, and preview/production bindings.

## Git

Use imperative Conventional Commit subjects such as `fix: guard invalid month
param`. Keep unrelated work separate. PRs should include a summary, relevant
visuals for UI changes, and lint/build or test results.
