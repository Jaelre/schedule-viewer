# ADR 0005: Introduce Conditional Row Virtualization

- Status: Accepted
- Date: 2025-02-22
- Supersedes: None

## Context
- The monthly schedule grid currently virtualizes every roster render via `@tanstack/react-virtual`, even when we only show a small handful of clinicians.
- Full virtualization forces each row cell (names and shift columns) to rely on `translate3d` transforms. The transforms block native CSS sticky behaviour for our fixed name column and introduce extra compositing work that users notice as minor visual lag on short rosters.
- Most rota views for individual units list far fewer than 40 clinicians. Rendering them all without virtualisation is cheaper than paying the complexity tax of transforms, scroll synchronisation, and layout bookkeeping.
- We already size rows deterministically via the density presets, so static rendering will not trigger layout thrashing for small datasets.

## Decision
We will gate the use of `@tanstack/react-virtual` behind a row-count threshold (`ROW_VIRTUALIZATION_THRESHOLD`, initial value 40). When the roster length is at or below the threshold we render rows directly, allowing the browser to manage layout and sticky positioning without transforms. Above the threshold we continue to rely on virtualisation to guarantee scroll performance for large schedules.

Key details:
- The threshold lives with `ScheduleGrid` and can be tuned as we collect performance data.
- We retain the overlay architecture for the name column; the static path simply avoids per-row transforms while still syncing vertical scroll via a single container transform.
- Both code paths reuse the existing density presets and rendering helpers so the shift chips, weekend/holiday styling, and horizontal compaction behaviour remain identical.

## Consequences
- Small rosters regain native sticky responsiveness and avoid the 1-2 frame lag we see with forced virtualisation.
- Large rosters continue to render efficiently because the virtualised path is untouched aside from gating.
- The component complexity increases modestly: we now maintain two rendering branches (virtualised and static) that must stay behaviourally aligned, so changes to row markup require updates in both paths.
- We introduce a new constant that product/design may want to tweak; we should document any adjustments in release notes to keep QA expectations aligned.

## Status & Follow-up
- Implement conditional rendering in `src/app/_components/ScheduleGrid.tsx`, including the shared scroll sync that flips between virtualised and static branches.
- Monitor runtime performance and correctness in staging; if we observe lag returning under 40 rows we can lower the threshold or disable virtualisation entirely for specific density modes.
- Future enhancements (e.g., density-aware thresholds or viewport-sized heuristics) can build on this ADR and should note whether they supersede it.
