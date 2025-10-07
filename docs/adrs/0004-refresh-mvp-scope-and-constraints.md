# ADR 0004: Refresh MVP Scope and Constraints

- Status: Accepted
- Date: 2025-02-21
- Supersedes: ADR 0003 - Establish MVP Scope and Constraints

## Context
- The MVP remains a read-oriented monthly shift viewer targeted at Italian clinical teams who prioritise deterministic behaviour over authoring features.
- We proxy the upstream MetricAid schedule feed through our Cloudflare Worker so the frontend can rely on a stable `MonthShifts` contract while keeping tokens server-side.
- UX expectations centre on Rome-aware defaults, sticky grid ergonomics for large staffing rosters, deterministic colour coding, and resilient loading/error/empty states.

## Decision
We continue to ship a tightly scoped MVP with the following clarified constraints:
- **Read-only product surface**: Month navigation, density toggle, legend modal, and virtualised grid remain the only interactive controls. Editing, CSV export, filtering, analytics, and telemetry stay out of scope for V1.
- **Italy-first defaults**: Europe/Rome timezone, Italian locale strings, Monday-first calendars, weekend/holiday highlighting, and deterministic colour mapping drive all date and UI utilities.
- **Routing contract**: The only supported deep link is `ym=YYYY-MM`. Multi-unit selection is deliberately deferred and no longer guarded by a `UNIT_ROUTING_ENABLED` flag; future work will introduce explicit unit-aware routes when requirements solidify.
- **Data access via Worker**: All live data requests go through the Rust Cloudflare Worker at `/api/shifts`, which validates the `ym` parameter, expands it to month boundaries, signs the upstream call with `API_TOKEN`, retries transient upstream failures, applies `Cache-Control: public, max-age=CACHE_TTL_SECONDS`, and returns the normalised `MonthShifts` payload with per-day multi-shift support. The Worker relies on Cloudflare's execution timeout today, with a TODO to wire the configurable timeout value.
- **Frontend implementation stack**: Next.js 15 (App Router) + React 19 with Tailwind/shadcn UI components, TanStack Query for data fetching (`['shifts', ym]` keys, 5 minute stale time, 10 minute background refetch, focus refetch, 2 retries), and `@tanstack/react-virtual` for row virtualisation above ~40 clinicians.
- **Local development parity**: A Next.js Route Handler mocks `/api/shifts` to unblock UI work without the Worker, mirroring the error envelope and caching headers.

## Consequences
- **Scope discipline**: By explicitly excluding multi-unit routing and authoring tools, teams can iterate quickly on performance and ergonomics without backend schema changes.
- **Consistent contracts**: Shared `Person`, `DayCell`, and `MonthShifts` types guarantee both Worker and frontend transform upstream data into the same deterministic matrix model with optional monthly code metadata.
- **Operational clarity**: Deployment requires binding `API_BASE_URL`, `API_TIMEOUT_MS`, `CACHE_TTL_SECONDS`, and the `API_TOKEN` secret on the Worker, plus `NEXT_PUBLIC_API_URL` (defaulting to `/api`) on the frontend. Token secrecy and caching strategy remain centralised in the Worker.
- **Future hooks**: Documented TODOs—manual timeout enforcement in the Worker and eventual unit-aware routing—are captured for the next planning cycle without blocking the MVP launch.

## Reference Details
- UI checklist includes: header with compact month navigation, density toggle defaults to "comfortable", legend modal fed by deterministic colour map, skeleton/error/empty states, and WCAG-AA-aware shift chips.
- The Worker exposes `/api/shifts?ym=YYYY-MM`, computing `startDate`/`endDate`, adapting MetricAid responses into sorted people arrays, deterministic IDs, multiple shifts per day, and sorted code metadata while returning permissive CORS headers.
- `useMonthShifts(ym)` lives in `src/lib/api-client.ts`, backed by TanStack Query with `staleTime: 5 * 60 * 1000`, `refetchInterval: 10 * 60 * 1000`, `refetchOnWindowFocus: true`, and `retry: 2` for resiliency.
