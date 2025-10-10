# Repository Guidelines

## Project Structure & Module Organization
- `src/app` hosts the Next.js App Router; `_components/` contains composable UI, and `api/` wraps server routes.
- `src/lib` centralizes data fetching, auth helpers, and JSON lookup tables (`doctor-names.json`, `shift-colors.json`).
- `public/` serves static assets; `docs/` and `claudedocs/` hold product notes and generated references—update them with behavior changes.
- `worker/` encapsulates the Cloudflare Worker (Rust + `wrangler`) with sources in `worker/src` and build outputs in `worker/build`.

## Build, Test, and Development Commands
- `npm install` – sync JavaScript dependencies after cloning or editing `package.json`.
- `npm run dev` – launch the local app with hot reload on `http://localhost:3000`.
- `npm run build` – compile the production bundle; run this before tagging a release.
- `npm run lint` – execute ESLint/TypeScript checks; resolve warnings rather than suppressing them.
- `npx wrangler dev --config worker/wrangler.toml` – emulate the Worker (requires `cargo` and an `API_TOKEN` secret).

## Coding Style & Naming Conventions
- Use TypeScript, React hooks, and function components; prefer named exports for shared utilities.
- Follow the repository default formatting (Prettier-style 2-space indent, single quotes, trailing commas) and rely on ESLint autofix.
- Components use PascalCase (`ScheduleGrid`), hooks/utilities use camelCase (`useMonthShifts`), config files stay kebab-case.
- Compose styling with Tailwind classes in JSX; reserve `globals.css` for design tokens or resets.

## Testing Guidelines
- Automated tests are not yet configured; add coverage alongside features via co-located `*.test.tsx` or a `src/__tests__` folder.
- Adopt React Testing Library with Vitest or Jest, then expose a `npm test` script so CI can run it.
- Until then, document manual QA steps in PR descriptions and prioritize regression tests when fixing bugs.

## Commit & Pull Request Guidelines
- Write imperative, present-tense commit subjects (e.g., `fix: guard invalid month param`), mirroring the existing Conventional-style prefixes.
- Squash unrelated work; reserve `chore:` for repo maintenance only.
- PRs should include a one-paragraph summary, linked issues, before/after visuals for UI changes, and lint/test output.

## Security & Configuration Tips
- Copy `.json.example` files in `src/lib` when adjusting doctor or shift metadata, and keep sensitive variants out of Git.
- Manage Worker secrets with `wrangler secret put API_TOKEN`; never hardcode keys in TypeScript or Rust.
- Review `worker/wrangler.toml` before deploying to confirm API endpoints, cache TTLs, and build commands remain correct.
