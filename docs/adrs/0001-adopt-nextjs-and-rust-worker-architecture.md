# ADR 0001: Adopt Next.js Frontend with Rust Cloudflare Worker Backend

- Status: Accepted
- Date: 2025-02-14

## Context
- The product is a read-only monthly shift viewer that must remain fast and accessible for datasets up to 100 people across 31 days.
- The upstream MetricAid API requires a secret bearer token, meaning the browser cannot contact it directly and all traffic must be proxied securely.
- The experience must highlight Italian locale rules (Europe/Rome timezone, Monday-first calendar, Italian public holidays) while remaining deployable to Cloudflare Pages + Workers.
- The grid needs sticky headers/columns, deterministic colour mapping for shift codes, and virtualization to preserve performance on large data sets.

## Decision
We will build the user interface with **Next.js 15 (App Router) + React 19** styled by **Tailwind CSS** and shadcn/ui components, backed by **TanStack Query** and **TanStack Virtual** for client data management and virtualization. All upstream API calls will be served through a dedicated **Rust Cloudflare Worker** that owns the secret token and performs request validation, transformation, caching, retry logic, and CORS handling. The application will be deployed as a static export to Cloudflare Pages with the Worker bound to `/api/*` routes.

## Consequences
- **Performance & Reliability**: React Query caching, memoised cell rendering, and row virtualization enable smooth scrolling and rapid page loads even for the 100-row target, while the Worker’s caching and retries shield the UI from upstream instability.
- **Security**: The API token lives exclusively in the Worker environment. The browser only talks to `/api/shifts`, eliminating exposure of secrets.
- **Maintainability**: TypeScript across the frontend and strongly typed Rust on the proxy provide confidence when evolving the API adapter, at the cost of a steeper learning curve and longer Worker compilation times.
- **Deployment Fit**: Cloudflare Pages handles the static Next.js output and the Worker integrates naturally with Cloudflare’s routing model, simplifying infrastructure while requiring coordination across the two deployment targets.

## Implementation Notes
- `/app/_components` hosts the MonthNav, DensityToggle, LegendCard, and ScheduleGrid components composed by the `/app/page.tsx` entry point.
- `/lib` gathers shared utilities for date calculations (Italian holidays, Rome timezone), deterministic colour generation, API clients, and shared types.
- The Worker normalises upstream payloads into a `MonthShifts` structure with `people`, `rows`, and optional `codes`, and sets cache headers derived from `CACHE_TTL_SECONDS`.
- Environment variables: `API_BASE_URL`, `API_TOKEN`, `API_TIMEOUT_MS`, `CACHE_TTL_SECONDS` for the Worker; `NEXT_PUBLIC_DEFAULT_UNIT_NAME` and `NEXT_PUBLIC_SHIFT_CODE_DICT` for the frontend.
