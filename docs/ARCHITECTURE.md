# Architecture Documentation

## Technology Stack Decision

### Frontend
- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Virtualization**: TanStack Virtual
- **Deployment**: Cloudflare Pages (Static Export)

### Backend/API Proxy
- **Language**: Rust
- **Runtime**: Cloudflare Workers
- **Purpose**: API proxy to keep MetricAid API token server-side

**Rationale for Rust Worker**:
1. **Performance**: Rust offers superior performance for API proxying and data transformation
2. **Type Safety**: Strong compile-time guarantees prevent runtime errors in production
3. **Memory Efficiency**: Zero-cost abstractions and no garbage collection
4. **Security**: Memory safety without runtime overhead, critical for handling API tokens
5. **Cloudflare Workers Compatibility**: Native support via `worker-rs` crate
6. **Maintainability**: Strong typing helps with long-term maintenance and refactoring

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Next.js App (Static Export)                 │    │
│  │  - React Components                                 │    │
│  │  - TanStack Query (client state)                    │    │
│  │  - Tailwind CSS + shadcn/ui                         │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           │ HTTPS                            │
│                           ▼                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                Cloudflare Pages                              │
│                           │                                  │
│                           │ /api/* routes                    │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │       Rust Cloudflare Worker                        │    │
│  │  - Token injection from env vars                    │    │
│  │  - Request validation                               │    │
│  │  - Upstream API calls                               │    │
│  │  - Response transformation                          │    │
│  │  - CORS handling                                    │    │
│  │  - Caching with Cache-Control headers              │    │
│  │  - Error handling & retry logic                     │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           │ HTTPS with Bearer token          │
│                           ▼                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                 MetricAid API                                │
│        https://api.metricaid.com/api/v1/public/schedule     │
│  - Returns shift data for date range                         │
│  - Requires secret token authentication                      │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User Navigation**: User changes month via UI controls, updating `?ym=YYYY-MM` query param
2. **Client Request**: React Query triggers fetch to `/api/shifts?ym=YYYY-MM`
3. **Worker Processing**:
   - Validates `ym` parameter format
   - Calculates month start/end dates
   - Injects API token from environment
   - Calls MetricAid API with proper authentication
   - Transforms upstream response to `MonthShifts` format
   - Sets appropriate cache headers
4. **Response Transform**: Worker normalizes data into frontend-friendly format:
   - Extracts unique people
   - Builds `rows` matrix for O(1) cell lookup
   - Extracts unique shift codes
5. **Client Rendering**:
   - React Query caches response
   - Grid component renders with virtualization
   - Background refetch every 10 minutes

## Security Model

### Token Protection
- **API token stored**: Cloudflare Worker environment variable (never in browser)
- **Token injection**: Rust worker adds token to upstream requests
- **Browser access**: No direct MetricAid API access from browser

### CORS Policy
- Worker sets `Access-Control-Allow-Origin: *` for public read-only data
- Consider restricting to specific domains in production

### Environment Variables
**Cloudflare Worker**:
- `API_BASE_URL`: `https://api.metricaid.com/api/v1`
- `API_TOKEN`: Secret bearer token (encrypted by Cloudflare)
- `API_TIMEOUT_MS`: Request timeout (default: 8000)
- `CACHE_TTL_SECONDS`: Cache duration (default: 300)

**Next.js Frontend** (public):
- `NEXT_PUBLIC_DEFAULT_UNIT_NAME`: Display name for UI
- `NEXT_PUBLIC_SHIFT_CODE_DICT`: JSON mapping of shift codes to labels

## Performance Optimization

### Frontend
- **Static Export**: Pre-rendered HTML for instant page load
- **Row Virtualization**: Only render visible rows (target 100 people support)
- **Memoized Cells**: Prevent unnecessary re-renders
- **O(1) Lookups**: Pre-computed matrix for shift code access
- **Background Refetch**: Non-blocking data updates every 10 minutes

### Backend (Rust Worker)
- **Response Caching**: 5-minute cache via `Cache-Control` headers
- **Request Timeout**: 8-second timeout with retry logic
- **Retry Strategy**: Exponential backoff for 5xx errors (max 2 retries)
- **Connection Pooling**: Reuse HTTP connections to MetricAid API

## Deployment Strategy

### Cloudflare Pages (Frontend)
```bash
npm run build
# Deploys static files to Cloudflare Pages
# Build output: .next/out (static export)
```

### Cloudflare Workers (Rust Backend)
```bash
cd worker
wrangler publish
# Deploys Rust worker
# Route: /api/* → worker
```

### Environment Configuration
- **Development**: Local `.env` files + Miniflare for worker
- **Production**: Cloudflare dashboard secrets management

## Future Considerations (V2)

### Multi-Unit Support
- Current: Single unit via environment variable
- Future: Add `?unitId=XXX` to URL routing
- Worker: Support multiple unit tokens

### Caching Strategy
- Current: Simple time-based cache (5 minutes)
- Future: Consider stale-while-revalidate pattern
- Potential: CloudFlare KV for distributed caching

### Monitoring
- Add observability for Worker performance
- Track API response times
- Monitor cache hit rates

## Trade-offs

### Rust vs TypeScript Worker
**Chosen: Rust**
- ✅ Better performance for data transformation
- ✅ Memory safety guarantees
- ✅ Stronger type system
- ❌ Higher learning curve
- ❌ Longer compile times during development

### Static Export vs Server-Side Rendering
**Chosen: Static Export**
- ✅ Better performance (CDN edge caching)
- ✅ Lower infrastructure complexity
- ✅ Cost-effective (Cloudflare Pages free tier)
- ❌ No server-side data fetching
- ❌ No ISR (Incremental Static Regeneration)
- Note: Data fetching handled by Worker instead

## API Contract

### Worker Endpoint: `GET /api/shifts`

**Query Parameters**:
- `ym` (required): `YYYY-MM` format

**Response** (`MonthShifts`):
```typescript
{
  ym: "2025-10",
  people: [
    { id: "1", name: "Mario Rossi" },
    { id: "2", name: "Luigi Bianchi" }
  ],
  rows: [
    ["D", "D", "D", "N", "N", ...],  // 31 codes for person 1
    ["N", "N", "O", "D", "D", ...]   // 31 codes for person 2
  ],
  codes: ["D", "N", "O"]
}
```

**Error Response**:
```typescript
{
  error: {
    code: "INVALID_YM" | "UPSTREAM_ERROR" | "TIMEOUT",
    message: "Human-readable error message"
  }
}
```

## Locale & Timezone

- **Timezone**: Europe/Rome (UTC+1/+2 with DST)
- **Locale**: it-IT (Italian)
- **First Day of Week**: Monday
- **Date Format**: DD/MM/YYYY
- **Month Names**: Italian (Gennaio, Febbraio, etc.)

## Acceptance Criteria Mapping

1. ✅ Month navigation updates URL and refetches data
2. ✅ Performance: <300ms render with 40-100 people via virtualization
3. ✅ Sticky header and first column with CSS Grid
4. ✅ Deterministic colors with WCAG AA contrast
5. ✅ Error handling with retry button
6. ✅ Token never exposed to browser (Rust Worker proxy)
7. ✅ Accessibility: semantic HTML, keyboard navigation, ARIA roles
8. ✅ Deployable to Cloudflare Pages + Workers

## File Structure

```
schedule-viewer/
├── src/
│   ├── app/
│   │   ├── _components/      # React components
│   │   │   ├── MonthNav.tsx
│   │   │   ├── DensityToggle.tsx
│   │   │   ├── LegendCard.tsx
│   │   │   └── ScheduleGrid.tsx
│   │   ├── globals.css        # Tailwind + sticky grid CSS
│   │   ├── layout.tsx         # Root layout with React Query provider
│   │   └── page.tsx           # Home page with searchParams
│   └── lib/
│       ├── types.ts           # TypeScript contracts
│       ├── date.ts            # Rome timezone helpers
│       ├── colors.ts          # Deterministic color mapping
│       └── api-client.ts      # React Query hooks
├── worker/                    # Rust Cloudflare Worker
│   ├── Cargo.toml
│   ├── wrangler.toml
│   └── src/
│       ├── lib.rs             # Worker entry point
│       └── adapter.rs         # MetricAid API → MonthShifts transform
├── docs/
│   ├── project-instructions.md
│   ├── ARCHITECTURE.md        # This file
│   └── API/                   # MetricAid API docs
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```
