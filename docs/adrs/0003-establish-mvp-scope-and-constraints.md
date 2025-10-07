# ADR 0003: Establish MVP Scope and Constraints

- Status: Superseded
- Date: 2025-02-14
- Superseded by: ADR 0004 - Refresh MVP Scope and Constraints

## Context
- Stakeholders defined a focused V1 scope for a monthly shift viewer that favours read-only consumption, deterministic behaviour, and quick delivery.
- The upstream MetricAid API contract is only partially known ahead of time, requiring a proxy that can adapt responses into stable frontend types.
- UI expectations emphasise Italian localisation, sticky grid ergonomics, deterministic colour mapping, and graceful error/empty states.

## Decision
We anchored the implementation to the following non-negotiable constraints:
- Read-only experience with navigation, density toggle, and legend; no editing, exports, filters, or advanced analytics in V1.
- Europe/Rome timezone, Italian locale defaults, Monday-first calendars, weekend/holiday highlighting, and deterministic shift colouring.
- Routing uses the `ym=YYYY-MM` query parameter without `unitId` until future evaluation; `UNIT_ROUTING_ENABLED` remains `false` with a TODO to revisit.
- All data access flows through a Cloudflare Worker at `/api/shifts`, which injects the secret token, handles validation, timeouts, retries, CORS, caching, and response mapping.
- Frontend stack locked to Next.js (App Router), React, Tailwind, shadcn/ui, TanStack Query, and TanStack Virtual, with React Query configured for background refreshes and focus refetch.

## Consequences
- **Clarity of Scope**: Out-of-scope capabilities (multi-unit routing, exports, filters, tooltips, telemetry) are deferred to a future version, allowing V1 to ship confidently.
- **Technical Alignment**: Architecture, file layout, and typing contracts (`Person`, `DayCell`, `MonthShifts`) flow directly from these constraints, ensuring a consistent developer experience.
- **Operational Requirements**: Environment variables for both Worker and frontend are defined upfront, simplifying deployment and secret management.
- **Future Planning**: Documented TODOs (e.g., reintroducing `unitId` routing) and open design questions provide a clear starting point for iteration once V1 feedback is gathered.

## Reference Details
- UI checklist covers header composition, legend presentation, grid behaviour, skeleton/empty/error states, performance targets, and acceptance criteria for navigation, rendering speed, a11y, and token secrecy.
- Worker responsibilities include schema adaptation, caching policy (`Cache-Control: public, max-age=CACHE_TTL_SECONDS`), and consistent error envelopes.
- Frontend contract exposes `useMonthShifts(ym)` built atop React Query with `['shifts', ym]` keys, 10-minute refetch intervals, and Rome-aware defaults.
