# Monthly Shift Viewer

A production-ready web application for visualizing monthly work schedules. Built with Next.js, React, and a Rust Cloudflare Worker backend.

## Features

- 📅 **Monthly Calendar View**: Grid layout showing shifts for all personnel
- 🔒 **Secure API Proxy**: Rust Cloudflare Worker keeps API tokens server-side
- ⚡ **High Performance**: Row virtualization supports 100+ people smoothly
- 🎨 **Accessible Design**: WCAG AA compliant with deterministic colors
- 🇮🇹 **Italian Locale**: Europe/Rome timezone with Italian holidays
- 📱 **Responsive**: Works on desktop and mobile devices
- 🔄 **Auto-Refresh**: Background data updates every 10 minutes

## Tech Stack

### Frontend
- **Next.js 15** (App Router, Static Export)
- **React 19** with TypeScript
- **Tailwind CSS** + shadcn/ui
- **TanStack Query** (React Query)
- **TanStack Virtual** (row virtualization)

### Backend
- **Rust** Cloudflare Worker
- **worker-rs** crate for Workers runtime
- **serde** for JSON serialization

## Project Structure

```
schedule-viewer/
├── src/
│   ├── app/
│   │   ├── _components/       # React components
│   │   ├── api/shifts/        # Mock API for local dev
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx
│   └── lib/
│       ├── api-client.ts      # React Query hooks
│       ├── colors.ts          # Color generation
│       ├── date.ts            # Rome timezone utilities
│       └── types.ts           # TypeScript types
├── worker/                    # Rust Cloudflare Worker
│   ├── src/
│   │   ├── lib.rs            # Main worker logic
│   │   └── utils.rs
│   ├── Cargo.toml
│   └── wrangler.toml
├── docs/
│   ├── ARCHITECTURE.md        # Architecture decisions
│   └── project-instructions.md
├── package.json
├── tsconfig.json
└── README.md
```

## Local Development

### Prerequisites

- **Node.js** 18+ (npm or pnpm)
- **Rust** 1.70+ (for Worker development)
- **wrangler** (Cloudflare CLI)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jaelre/schedule-viewer.git
   cd schedule-viewer
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Install Rust toolchain** (for Worker)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   ```

5. **Install wrangler**
   ```bash
   npm install -g wrangler
   ```

6. **Set up Worker secrets** (for real API)
   ```bash
   cd worker
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars and add your MetricAid API token
   ```

### Running Locally

#### Frontend with Mock Data

```bash
npm run dev
```

Visit http://localhost:3000

The frontend will use the mock API endpoint at `/api/shifts` for local development.

#### Rust Worker (Development)

```bash
cd worker
wrangler dev
```

The worker will run at http://localhost:8787

To test the worker locally with the real MetricAid API:

```bash
cd worker
# Set the API token
wrangler secret put API_TOKEN
# Enter your token when prompted

# Run dev server
wrangler dev
```

Then update frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8787/api
```

## Deployment

### Cloudflare Pages (Frontend)

#### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect in Cloudflare Pages dashboard**
   - Build command: `npm run build`
   - Build output directory: `out` (Next.js static export)
   - Framework preset: Next.js

3. **Configure environment variables** in Cloudflare Pages:
   ```
   NEXT_PUBLIC_API_URL=https://schedule-viewer-worker.your-account.workers.dev/api
   NEXT_PUBLIC_SHIFT_CODE_DICT={"D":{"label":"Day"},...}
   ```

#### Option 2: Manual Deploy with Wrangler

1. **Build the static export**
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare Pages**
   ```bash
   npx wrangler pages deploy out --project-name schedule-viewer
   ```

   **IMPORTANT**: Deploy `out/` directory, not `.next/` (with `output: 'export'` in next.config.ts)

### Cloudflare Worker (Backend)

1. **Deploy the Worker**
   ```bash
   cd worker
   wrangler deploy
   ```

2. **Set environment secrets**
   ```bash
   wrangler secret put API_TOKEN
   # Enter your MetricAid API token when prompted
   ```

3. **Configure wrangler.toml variables** (already in file):
   ```toml
   [vars]
   API_BASE_URL = "https://api.metricaid.com"
   API_TIMEOUT_MS = "8000"
   CACHE_TTL_SECONDS = "300"
   ```

4. **Update frontend** to use Worker URL:
   - Create `.env.production` with:
     ```bash
     NEXT_PUBLIC_API_URL=https://schedule-viewer-worker.your-account.workers.dev/api
     ```
   - Or set in Cloudflare Pages dashboard environment variables

### Routing Setup

The Worker handles `/api/*` routes. Configure routing in one of two ways:

**Option 1: Cloudflare Functions** (Recommended)
- Worker automatically handles `/api/*` when deployed
- No additional configuration needed

**Option 2: Manual Route**
- In Cloudflare Workers dashboard
- Add route: `your-domain.com/api/*`
- Point to `schedule-viewer-worker`

## Environment Variables

### Frontend (.env.local)

```bash
# Display name for the unit
NEXT_PUBLIC_DEFAULT_UNIT_NAME="Emergency Department"

# Shift code labels (JSON)
NEXT_PUBLIC_SHIFT_CODE_DICT='{"D":{"label":"Day"},"N":{"label":"Night"},"O":{"label":"Off"}}'

# Worker URL (production only)
NEXT_PUBLIC_API_URL=https://your-worker.workers.dev/api
```

### Worker (wrangler.toml + secrets)

**Public variables** (wrangler.toml):
```toml
API_BASE_URL = "https://api.metricaid.com/api/v1"
API_TIMEOUT_MS = "8000"
CACHE_TTL_SECONDS = "300"
```

**Secret** (via wrangler CLI):
```bash
wrangler secret put API_TOKEN
```

## API Contract

### Worker Endpoint

**GET /api/shifts?ym=YYYY-MM**

**Response**:
```json
{
  "ym": "2025-10",
  "people": [
    { "id": "1", "name": "Mario Rossi" }
  ],
  "rows": [
    ["D", "D", "N", "N", "O", ...]
  ],
  "codes": ["D", "N", "O"]
}
```

**Error Response**:
```json
{
  "error": {
    "code": "INVALID_YM",
    "message": "Invalid ym format. Expected YYYY-MM"
  }
}
```

## Performance

- **Target**: <300ms render time with 100 people
- **Optimization**: Row virtualization (only renders visible rows)
- **Caching**: 5-minute Worker cache + 10-minute client cache
- **Bundle**: Code splitting for optimal load times

## Accessibility

- ✅ Semantic HTML structure
- ✅ ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ WCAG AA color contrast
- ✅ Screen reader friendly

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development Notes

### TODO: Multi-Unit Support (V2)

Current version uses a single unit via environment variable. Future enhancement:
- Add `?unitId=XXX` to URL routing
- Support multiple unit tokens in Worker
- See `docs/ARCHITECTURE.md` for details

### Locale Settings

- **Timezone**: Europe/Rome (UTC+1/+2)
- **Locale**: it-IT
- **First day of week**: Monday
- **Date format**: DD/MM/YYYY

### Italian Public Holidays

Implemented in `src/lib/date.ts`:
- Fixed dates (New Year, Christmas, etc.)
- Easter-based (Easter Sunday, Easter Monday)
- Civil holidays (April 25, May 1, June 2, etc.)

## Testing

```bash
# Type checking
npm run build

# Lint
npm run lint
```

## Troubleshooting

### "API Token not found"
- Run `wrangler secret put API_TOKEN` in worker directory
- Verify token is correct in Cloudflare dashboard

### "Invalid ym format"
- Ensure URL has `?ym=YYYY-MM` format
- Check year is between 2000-2100, month 01-12

### Worker not receiving requests
- Verify `NEXT_PUBLIC_API_URL` points to correct Worker URL
- Check Cloudflare Pages routing configuration
- Test Worker directly: `https://your-worker.workers.dev/api/shifts?ym=2025-10`

### Build errors
- Clear `.next` and `node_modules`, reinstall: `rm -rf .next node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.
