# Same-Origin Deployment Architecture

## Problem

When the frontend (Cloudflare Pages) and backend (Cloudflare Worker) are deployed on different domains, telemetry POST requests appear as cross-site tracking to script blockers:

```
Frontend:  https://schedule-viewer.pages.dev
Worker:    https://schedule-viewer-worker.jaelre.workers.dev
Result:    🚫 Script blockers flag POST /api/telemetry as tracking
```

Popular privacy tools (uBlock Origin, Privacy Badger, Brave Shields) block these requests by default.

## Solution

Use **Cloudflare Pages Functions** with **Service Bindings** to proxy all `/api/*` requests from the Pages domain to the Worker. This makes all requests same-origin:

```
Browser → https://schedule-viewer.pages.dev/api/telemetry
         ↓ (Pages Function proxy)
         → Worker service (internal)
Result:  ✅ Same-origin request - not blocked
```

## Implementation

### 1. Pages Function Proxy

File: `functions/api/[[path]].ts`

This catch-all function intercepts all `/api/*` requests and forwards them to the Worker via service binding:

```typescript
export const onRequest = async (context) => {
  const { request, env } = context
  return env.WORKER.fetch(request)
}
```

The `[[path]]` syntax creates a catch-all route matching `/api/*` patterns.

### 2. Service Binding Configuration

In Cloudflare Pages dashboard:
- **Settings** > **Functions** > **Service bindings**
- Add binding: `WORKER = schedule-viewer-worker`

This gives the Pages Function access to call the Worker as an internal service (not via public HTTP).

### 3. Relative API URLs

`.env.production`:
```bash
NEXT_PUBLIC_API_URL=/api  # Relative path - stays on same domain
```

Frontend calls become:
- ❌ Before: `https://schedule-viewer-worker.jaelre.workers.dev/api/shifts`
- ✅ After: `https://schedule-viewer.pages.dev/api/shifts` → proxied to Worker

## Request Flow

```
┌─────────┐
│ Browser │
└────┬────┘
     │ GET /api/shifts?ym=2025-12
     │ (same-origin: schedule-viewer.pages.dev)
     ▼
┌──────────────────┐
│ Cloudflare Pages │
│  (Static Files)  │
└────┬─────────────┘
     │ Matches /api/* route
     ▼
┌──────────────────────────┐
│ Pages Function           │
│ functions/api/[[path]].ts│
└────┬─────────────────────┘
     │ Service binding: env.WORKER.fetch()
     │ (internal call, not HTTP)
     ▼
┌────────────────────┐
│ Cloudflare Worker  │
│ (Rust backend)     │
└────┬───────────────┘
     │ Proxies to MetricAid API
     │ OR handles telemetry
     │ OR serves R2 configs
     ▼
┌──────────────┐
│   Response   │
└──────────────┘
```

## Benefits

1. **Privacy-Friendly**: Same-origin requests aren't flagged as tracking
2. **Telemetry Works**: Users with script blockers can still contribute usage data
3. **Cleaner URLs**: No exposed Worker URLs in frontend code
4. **Better Security**: Worker credentials never exposed to browser
5. **Simpler Config**: Single domain for frontend + API

## Trade-offs

1. **Slight Latency**: Pages Function adds ~5-10ms proxy overhead (negligible)
2. **Binding Required**: Must configure service binding in dashboard (one-time setup)
3. **Pages Functions**: Uses Cloudflare Pages Functions feature (free tier sufficient)

## Verification

Test same-origin deployment:

```bash
# 1. Check frontend calls use relative paths
curl https://schedule-viewer.pages.dev/api/config/shift-display

# 2. Verify telemetry endpoint responds
curl -X POST https://schedule-viewer.pages.dev/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{"events":[]}' \
  # Should return 401 (auth required) - proves routing works

# 3. Check browser DevTools Network tab
# All /api/* requests should show same origin as page
```

## Migration from Cross-Origin Setup

If you previously deployed with separate domains:

1. **Update .env.production**:
   ```diff
   - NEXT_PUBLIC_API_URL=https://schedule-viewer-worker.jaelre.workers.dev/api
   + NEXT_PUBLIC_API_URL=/api
   ```

2. **Redeploy frontend** (picks up new env var):
   ```bash
   npm run build
   npx wrangler pages deploy out
   ```

3. **Configure service binding** in Pages dashboard (see above)

4. **Worker stays the same** - no changes needed

## Files Modified

- `public/_routes.json` - Pages routing config
- `functions/api/[[path]].ts` - Proxy function (NEW)
- `.env.production` - API URL changed to relative path
- `docs/PRODUCTION_SETUP.md` - Added Step 8 for service binding

## References

- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Service Bindings](https://developers.cloudflare.com/pages/functions/bindings/#service-bindings)
- [Catch-all routes](https://developers.cloudflare.com/pages/functions/routing/#dynamic-routes)
