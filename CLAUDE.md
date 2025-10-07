# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monthly Shift Viewer - A read-only web app displaying work schedules in a monthly grid format. Built with Next.js + React frontend and Rust Cloudflare Worker backend.

**Key Architecture**: Browser → Cloudflare Pages (Next.js) → Rust Worker (API proxy) → MetricAid API

The Rust Worker is critical: it keeps the API token server-side and transforms upstream data into the frontend's `MonthShifts` format.

## Development Commands

### Frontend (Next.js)
```bash
# Development with mock data
npm run dev                 # → http://localhost:3000

# Build for production
npm run build              # Compiles TypeScript, builds Next.js

# Type checking
npm run build              # Also validates TypeScript

# Linting
npm run lint
```

### Backend (Rust Worker)
```bash
cd worker

# Local development
wrangler dev               # → http://localhost:8787

# Set API token (required for real API)
wrangler secret put API_TOKEN

# Deploy to Cloudflare
wrangler publish

# Build only (without deploy)
cargo build --release
```

### Local Development with Real Worker
```bash
# Terminal 1: Run worker with real API
cd worker && wrangler dev

# Terminal 2: Run frontend pointing to worker
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:8787/api
npm run dev
```

## Core Architecture

### Data Flow Pattern
1. **URL State**: Month selection via `?ym=YYYY-MM` query parameter
2. **React Query**: Caches with key `['shifts', ym]`, refetches every 10min
3. **Worker Transform**: MetricAid API response → `MonthShifts` type
4. **Grid Rendering**: Virtualized rows (TanStack Virtual) with sticky header/column

### Type Contract: `MonthShifts`
```typescript
{
  ym: "2025-10",              // Month identifier
  people: Person[],           // Array of {id, name}
  rows: (string[]|null)[][],  // Matrix: rows[personIdx][dayIdx-1] = shiftCodes[]
  codes: string[]             // Unique shift codes for legend
}
```

**Critical**: `rows` is pre-computed for O(1) lookup. `rows[i][d]` gives array of shift codes for person `i` on day `d+1` (zero-indexed array, 1-indexed days). Each cell can contain multiple shifts (e.g., morning + afternoon) which are displayed stacked vertically in the grid.

### Worker Responsibilities
- **Security**: Inject `API_TOKEN` from env (never exposed to browser)
- **Validation**: Check `ym` format (YYYY-MM), year 2000-2100, month 01-12
- **Transform**: Upstream shifts → normalized `rows` matrix + `people` array
- **Caching**: Set `Cache-Control: public, max-age=300` (5 minutes)
- **Retry**: Up to 2 retries on 5xx errors
- **CORS**: `Access-Control-Allow-Origin: *` for public data

## Key Libraries & Patterns

### Date/Time (Europe/Rome timezone)
- **File**: `src/lib/date.ts`
- **Functions**: `getCurrentYM()`, `getDaysInMonth()`, `isWeekend()`, `isItalianHoliday()`
- **Holidays**: Fixed dates + Easter-based (computus algorithm)
- **Locale**: it-IT, Monday first day of week

### Color System (Deterministic & Accessible)
- **File**: `src/lib/colors.ts`
- **Pattern**: Hash shift code → HSL color with WCAG AA contrast
- **Predefined**: Common codes (D, N, O, SM) have specific colors
- **Function**: `getShiftColor(code) → {background, text}`

### Grid Performance
- **Virtualization**: `@tanstack/react-virtual` when `people.length > 40`
- **Memoization**: Cells wrapped in `useMemo` to prevent re-renders
- **CSS Grid**: Sticky positioning for header row and first column
- **Target**: <300ms initial render with 100 people × 31 days

### React Query Configuration
```typescript
queryKey: ['shifts', ym]
staleTime: 5 * 60 * 1000      // 5 minutes
refetchInterval: 10 * 60 * 1000  // Background every 10 min
refetchOnWindowFocus: true
```

## Critical Implementation Details

### Grid CSS (Sticky Headers)
- `.grid-header`: `position: sticky; top: 0; z-index: 20`
- `.grid-first-col`: `position: sticky; left: 0; z-index: 10`
- `.grid-header.grid-first-col`: `z-index: 30` (corner cell)
- Days column: `minmax(2.25rem, 1fr)` with horizontal scroll

### Worker Date Calculation
Rust worker converts `ym` → `startDate`/`endDate` for MetricAid API:
- `startDate`: `YYYY-MM-01`
- `endDate`: `YYYY-MM-DD` (last day of month via chrono crate)

### Upstream API Mapping
Worker extracts from MetricAid API response:
- `user.id` + `user.first_name` + `user.last_name` → `Person`
- `shift.abbreviation` (or `shift.name`) → shift code string
- `start_time` → day extraction (format: "YYYY-MM-DD HH:MM:SS")

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_DEFAULT_UNIT_NAME="Emergency Department"
NEXT_PUBLIC_SHIFT_CODE_DICT='{"D":{"label":"Day"},"N":{"label":"Night"},"O":{"label":"Off"}}'
NEXT_PUBLIC_API_URL=http://localhost:8787/api  # Dev: point to local worker
```

### Worker (wrangler.toml + secrets)
```toml
# wrangler.toml (public)
API_BASE_URL = "https://api.metricaid.com/api/v1"
API_TIMEOUT_MS = "8000"
CACHE_TTL_SECONDS = "300"

# Secret (via CLI)
wrangler secret put API_TOKEN  # Never commit this
```

## Common Development Patterns

### Adding a New Shift Code
1. Update `NEXT_PUBLIC_SHIFT_CODE_DICT` in `.env.local`
2. (Optional) Add predefined color in `src/lib/colors.ts` if needed
3. Worker automatically includes any code from upstream API

### Modifying Grid Behavior
- **Component**: `src/app/_components/ScheduleGrid.tsx`
- **Virtualization threshold**: Currently 40+ people (see `useVirtualizer`)
- **Cell rendering**: Each cell checks `rows[personIdx][dayIdx]` for shift code

### Adding API Parameters
1. Update Worker: `worker/src/lib.rs` → `handle_shifts()` function
2. Add to upstream URL construction
3. Update frontend: `src/lib/api-client.ts` if param is dynamic

## Known Constraints & TODOs

### V1 Limitations (By Design)
- ❌ No editing/tooltips/per-row totals
- ❌ No CSV/PDF export
- ❌ No filters/search
- ❌ Single unit only (no `unitId` in URL)

### V2 Planned Features
- **Multi-Unit Support**: Add `?unitId=XXX` to URL routing (TODO in `docs/ARCHITECTURE.md`)
- Worker would need to support multiple unit tokens
- UI would need unit selector component

### Technical Notes
- **Next.js Config**: Standard build (not static export) - API routes need server
- **Tailwind**: Using v3 (v4 had PostCSS compatibility issues with Next.js 15)
- **Mock API**: `/api/shifts` route is for local dev only; production uses Worker

## Deployment Checklist

### Frontend (Cloudflare Pages)
1. Push to GitHub
2. Connect repo in Cloudflare dashboard
3. Build: `npm run build`, Output: `.next`
4. Set env vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SHIFT_CODE_DICT`

### Worker (Cloudflare)
1. `cd worker && wrangler publish`
2. Set secret: `wrangler secret put API_TOKEN`
3. Verify route `/api/*` binds to worker
4. Update frontend env to point to worker URL

## Troubleshooting

### Build Failures
- Clear cache: `rm -rf .next node_modules && npm install`
- Check Node version: `node --version` (requires 18+)
- Check TypeScript errors: Type issues fail the build

### Worker Not Receiving Requests
- Verify `NEXT_PUBLIC_API_URL` in frontend env
- Test worker directly: `curl https://worker-url/api/shifts?ym=2025-10`
- Check Cloudflare routing configuration

### "API Token not found"
- Run `wrangler secret put API_TOKEN` in worker directory
- Verify in Cloudflare dashboard → Workers → Settings → Variables

### Date/Timezone Issues
- All date logic uses Europe/Rome timezone (UTC+1/+2)
- Italian holidays are hardcoded in `src/lib/date.ts`
- Month boundaries calculated server-side in Rust worker

## File Reference

**Critical Files** (most frequently modified):
- `src/app/_components/ScheduleGrid.tsx` - Grid rendering & virtualization
- `src/lib/api-client.ts` - React Query hooks & API calls
- `worker/src/lib.rs` - Worker logic & data transformation
- `src/lib/types.ts` - TypeScript contracts (MonthShifts)

**Configuration**:
- `next.config.ts` - Next.js build settings
- `worker/wrangler.toml` - Worker deployment config
- `tailwind.config.ts` - Tailwind CSS setup

**Documentation**:
- `docs/ARCHITECTURE.md` - Architecture decisions & rationale
- `docs/project-instructions.md` - Original requirements
- `README.md` - Setup & deployment guide
