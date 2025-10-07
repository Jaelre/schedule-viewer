
## ROLE
You are a senior full-stack engineer delivering a small, production-deployable web app. The app is a read-only monthly shift viewer built with Next.js (App Router) + React + shadcn/ui + Tailwind + TanStack React Query, deployed on Cloudflare Pages with a Cloudflare Worker proxy to keep a secret API token server-side.

## GOAL
Implement a dynamically updated webpage that displays working shifts month-by-month in a grid: people = rows, days of the selected month = columns. Data comes from a public-facing API that REQUIRES a secret token; the browser must never see the token. The app is read-only (no editing). Focus on clean architecture, good performance up to 100 people, and a pleasant, accessible UI.

## NON-NEGOTIABLE DECISIONS
- Read/Only: No interactions beyond navigation (no editing, no tooltips, no per-row totals).
- Locale/timezone: Europe/Rome (it-IT). Monday is the first day of week. Gregorian calendar.
- Month navigation & URL: Query param `ym=YYYY-MM` (e.g., `/?ym=2025-10`). No `unitId` in the URL for now (see TODO).
- API access: All upstream requests go through a Cloudflare Worker at `/api/shifts?ym=YYYY-MM` (and any other params you determine from docs). The Worker injects the secret token from env, sets CORS, handles timeouts/retries, and can set cache headers. The browser only calls the Worker.
- Frontend stack: Next.js (App Router), React 18, shadcn/ui, Tailwind, TanStack React Query.
- Data fetching: React Query with cache key `['shifts', ym]`. Background refetch every 10 minutes and on window focus.
- Grid: CSS Grid; sticky header row (days) and sticky first column (people). Deterministic color mapping for shift codes via a dictionary provided at build time. Weekend and Italian public holiday highlighting. Row virtualization for performance when rows > ~40 (target worst-case 100).
- Accessibility: Basic ARIA/semantic roles, keyboard focus order, WCAG-conscious color contrast.
- Extras explicitly out-of-scope for V1: CSV/PDF export, filters/search, per-row totals, cell tooltips/popovers, telemetry.

## OPEN POINTS TO HANDLE (design + implement sensible defaults)
- The upstream API schema is unknown here. You will receive API docs separately. Infer the minimal adapter layer on the Worker + a typed client in the frontend. Keep the browser type-safe and decoupled from upstream quirks.
- Whether a `unitId` should be part of routing is TBD. For V1, treat it as an internal configuration value loaded from an env var or a constants file. Expose a single “Unit” in the UI. Leave a clear TODO to re-introduce `unitId` into the URL/query in V2 if needed.

## UI/UX REQUIREMENTS
- Header: App title (“Monthly Shift Viewer”), month selector (Prev / Next / Month picker), density toggle (Compact / Comfortable).
- Legend: A small card mapping shift codes → labels/colors. Colors must be deterministic by code and accessible.
- Grid:
  - Columns: one per day of selected month (1..28/29/30/31), plus a frozen first column for the person name.
  - Rows: one per person. Render the shift code in each cell.
  - Sticky header & first column; smooth horizontal scroll for days.
  - Weekend background shading; Italian public holidays highlighted (client side).
- Empty states & errors:
  - Loading skeleton for grid and legend.
  - “No shifts found for this month” empty state.
  - Error banner with retry button when the Worker or upstream fails.
- Performance:
  - Memoized cells; virtualization for rows using `@tanstack/react-virtual` or `react-virtual`.
  - O(1) lookup for assignments (precompute a map `personId -> dayIndex -> code`).
  - Avoid re-renders on hover/scroll; keep derived data in `useMemo`.

## ARCHITECTURE & FILE STRUCTURE (App Router)
- `/app/(routes)/page.tsx` → Home page reading `ym` from `searchParams`, defaulting to current month in Europe/Rome.
- `/app/_components/MonthNav.tsx` → Prev/Next/month picker wired to `ym` query param.
- `/app/_components/DensityToggle.tsx`
- `/app/_components/LegendCard.tsx`
- `/app/_components/ScheduleGrid.tsx` → The virtualized grid.
- `/lib/api-client.ts` → Frontend client calling `/api/shifts?ym=...` with React Query hooks.
- `/lib/date.ts` → helpers for month boundaries, Rome timezone, weekend/holiday detection.
- `/lib/colors.ts` → deterministic color mapping by shift code (accept a dictionary injected at build time).
- `/lib/types.ts` → shared front-end types (see CONTRACTS).
- `/app/globals.css` → Tailwind + CSS for sticky grid.
- `/app/api/shifts/route.ts` → **Only if not using Cloudflare Worker.** But we **are** using a Worker. So omit this in production build; keep a local dev fallback if helpful.
- Cloudflare Worker:
  - `/worker/src/index.ts` → `GET /api/shifts`, reads `env.API_TOKEN`, calls upstream, forwards JSON, sets `Cache-Control`, handles CORS, timeouts, retries, and error shaping.

## ENV & CONFIG
- Cloudflare Worker:
  - `API_BASE_URL` (string): upstream base URL from the docs.
  - `API_TOKEN` (string): secret token.
  - `API_TIMEOUT_MS` (number, default 8000).
  - `CACHE_TTL_SECONDS` (number, default 300).
- Frontend (public):
  - `NEXT_PUBLIC_DEFAULT_UNIT_NAME` (string) for header display, optional.
  - `NEXT_PUBLIC_SHIFT_CODE_DICT` (JSON string) → mapping `{ [code: string]: { label: string } }`. Colors are derived deterministically in `lib/colors.ts` from the code key.
- Feature flags (constants file):
  - `UNIT_ROUTING_ENABLED = false` // TODO: evaluate re-adding `unitId` to the URL in V2.

## CONTRACTS (Frontend internal types; adapt Worker adapter to fit these)
```ts
// lib/types.ts
export type Person = { id: string; name: string };
export type DayCell = { day: number; code: string | null }; // null = no assignment
export type MonthShifts = {
  ym: string; // "YYYY-MM"
  people: Person[];
  // For performance, also include a normalized matrix form:
  // rows[i][d] gives the code for person i at day d (1-indexed day mapped to 0-based index)
  rows: string[][]; 
  // Optional metadata (e.g., codes seen this month)
  codes?: string[];
};
```

## REACT QUERY CONTRACT

* Query key: `['shifts', ym]`
* Hook:

```ts
export function useMonthShifts(ym: string) {
  return useQuery({
    queryKey: ['shifts', ym],
    queryFn: () => apiClient.getMonthShifts({ ym }),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000, // background
    refetchOnWindowFocus: true,
  });
}
```

## WORKER REQUIREMENTS (Cloudflare)

* Route: `GET /api/shifts?ym=YYYY-MM`
* Behavior:

  * Validate `ym`.
  * Build upstream URL from `API_BASE_URL` + mapped params.
  * Add `Authorization`/token header per docs.
  * Timeout after `API_TIMEOUT_MS`.
  * Retry (up to 2) on network or 5xx.
  * Map upstream payload → `MonthShifts` shape (normalize into `rows: string[][]`, and a flat `people` array).
  * CORS: `Access-Control-Allow-Origin: *` (or restrict if needed), `Vary: Origin`.
  * Caching: set `Cache-Control: public, max-age=CACHE_TTL_SECONDS` if upstream is cacheable.
  * Errors: return `{ error: { code, message } }` with appropriate status (4xx/5xx).

## GRID IMPLEMENTATION NOTES

* CSS Grid with fixed first column and sticky header:

  * First column width ~ 240px (responsive).
  * Columns for days auto-size to `minmax(2.25rem, 1fr)`; allow horizontal scroll.
* Virtualization:

  * Use `@tanstack/react-virtual` for rows when `people.length > 40`.
* Color mapping:

  * `lib/colors.ts` should hash the shift code string to a hue and generate an accessible background/text pair. Also support overrides via a (future) color dict if needed.
* Holidays:

  * Implement Italian public holidays (fixed + Easter based) in `lib/date.ts` or use a tiny client-side list; mark cells with a subtle background.

## ACCEPTANCE CRITERIA

1. Navigating months via Prev/Next updates `ym` in the URL and re-fetches data. Default to the current month in Rome timezone.
2. With 40–100 people x 31 days, scrolling is smooth; initial render time is reasonable (<300ms on a modern laptop); no massive re-renders.
3. The grid header (days) and first column (people) remain sticky during scroll. Weekend and Italian holidays are visibly highlighted.
4. Shift cells display the provided code; colors are deterministic and readable (contrast AA for text over background or vice versa).
5. Errors from upstream or Worker show an inline error banner with a retry button; retry succeeds when upstream recovers.
6. The secret token is never present in browser network traffic except proxied requests to `/api/shifts`.
7. Lighthouse: no major a11y failures; document has landmark roles; interactive controls are keyboard reachable.
8. Codebase compiles and deploys on Cloudflare Pages + Worker with documented steps below.

## DELIVERABLES

* Complete Next.js project with the file structure above.
* Cloudflare Worker project (separate package or subfolder), wired to `/api/shifts`.
* Minimal README with:

  * Local dev (Pages + Miniflare for Worker).
  * Env var setup for Pages and Worker.
  * Deployment commands.
* A tiny test dataset & mock Worker handler for local development (bypass upstream).

## DEPLOYMENT NOTES (Cloudflare)

* Frontend: Deploy as Cloudflare Pages (build command `pnpm build`, output `.next` handled by adapter or static export if applicable).
* Worker: Deploy via `wrangler`. Bind route `/api/*` to the Worker; configure `API_BASE_URL`, `API_TOKEN`, `API_TIMEOUT_MS`, `CACHE_TTL_SECONDS`.
* In Pages project settings, add a Function/Worker that proxies `/api/*` to the Worker (or use Functions directly instead of a separate Worker—choose the cleanest CI).

## CODING CHECKLIST

* [ ] Scaffold shadcn/ui and Tailwind; add base theme.
* [ ] Implement `lib/date.ts` (Rome tz helpers, month days, weekend/holiday).
* [ ] Implement `lib/colors.ts` (deterministic color by code).
* [ ] Implement `lib/api-client.ts` + `useMonthShifts`.
* [ ] Build `LegendCard`, `MonthNav`, `DensityToggle`, `ScheduleGrid`.
* [ ] Cloudflare Worker with adapters from upstream payload → `MonthShifts`.
* [ ] Error/loading/empty states.
* [ ] README with Cloudflare Pages + Worker deployment steps.
* [ ] TODO comment in code: “Assess whether `unitId` should be in URL; current version uses a single configured unit.”

## OPTIONAL DEV CONVENIENCE

* Provide a `NEXT_PUBLIC_SHIFT_CODE_DICT` example:
  // Example (replace in env): {"D":{"label":"Day"},"N":{"label":"Night"},"O":{"label":"Off"},"SM":{"label":"Smonto"}}

## NOTES FOR UPSTREAM API INTEGRATION

* The API docs will be handed to you. Implement an adapter in the Worker to map the upstream format into `MonthShifts`. Prefer stable IDs for people; if not provided, derive stable hashes from names.
* Respect upstream rate limits; use caching headers as allowed.
* If the upstream exposes multiple units or departments, hard-code a single unit in V1 via Worker config; leave a clear TODO and a single code path to bring `unitId` into the URL in V2.
* Find the API documentation in docs/API

## QUALITY BAR
Ship production-ready code with clear folder structure, type safety, and comments where the upstream doc mapping occurs. Avoid heavy dependencies beyond those specified.

