# R2 Configuration Migration - PR #34 Modernized

This document describes the modernization of PR #34's configuration approach using Cloudflare R2 storage.

## What Changed

### Original PR #34 Approach
- Moved config files to `public/config` for runtime loading
- Had build issues (Next.js offline font download failures)
- Still required rebuilding frontend for config changes

### New R2 Approach
- Config files stored in Cloudflare R2 (cloud object storage)
- Worker fetches configs from R2 with 5-minute caching
- Frontend fetches configs via Worker API endpoints
- **Zero rebuilds** needed for config updates
- Fully runtime-dynamic configuration

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ GET /api/config/shift-display
       │ GET /api/config/shift-styling
       ↓
┌─────────────────┐
│  Rust Worker    │ ← R2 bucket binding
│  (with 5min     │   CONFIG_BUCKET
│   cache)        │
└──────┬──────────┘
       │ R2 object fetch
       │ (cached 5min)
       ↓
┌──────────────────────────────┐
│  Cloudflare R2 Bucket        │
│  schedule-viewer-config      │
│                              │
│  - shift-display.config.json │
│  - shift-styling.config.json │
└──────────────────────────────┘
```

## New Files

### Backend (Worker)
- `worker/src/config.rs` - R2 config fetching module with caching
  - `get_shift_display_config()` - Fetch display config from R2
  - `get_shift_styling_config()` - Fetch styling config from R2
  - `handle_get_config()` - API endpoint handler
  - Cache management with 5-minute TTL

### Frontend
- `src/lib/config-client.ts` - Config fetching utilities
  - `useShiftDisplayConfig()` - React Query hook for display config
  - `useShiftStylingConfig()` - React Query hook for styling config
  - `normalizeDisplayToken()` - Token normalization helper
  - `getConfiguredLabel()` - Label override helper

### Scripts
- `scripts/upload-config-to-r2.sh` - Upload configs to R2 buckets
- `scripts/README.md` - Configuration management guide

## Modified Files

### Backend
- `worker/wrangler.toml` - Added R2 bucket binding and CONFIG_CACHE_TTL_SECONDS
- `worker/src/lib.rs` - Updated to use R2 configs instead of static files
  - Removed static config structs (moved to config.rs)
  - Updated `handle_shifts()` to fetch config from R2
  - Updated `transform_to_month_shifts()` to accept config parameter
  - Updated `extract_shift_code()` to accept config parameter
  - Added `/api/config/:name` endpoint route

### Frontend
- `src/app/_components/ScheduleGrid/ShiftCell.tsx` - Use dynamic config hook
- `src/lib/shift-format.ts` - Accept optional config parameter
- `src/lib/shift-labels.ts` - Accept optional config parameter

### Documentation
- `CLAUDE.md` - Updated with R2 config management workflow
- `R2_CONFIG_MIGRATION.md` - This file

## Deployment Guide

### One-Time Setup

1. **Create R2 Buckets**:
   ```bash
   wrangler r2 bucket create schedule-viewer-config
   wrangler r2 bucket create schedule-viewer-config-preview
   ```

2. **Upload Initial Config**:
   ```bash
   ./scripts/upload-config-to-r2.sh
   ```

3. **Deploy Worker**:
   ```bash
   cd worker && wrangler deploy
   ```

### Updating Configs (Ongoing)

1. **Edit Config Files**:
   - `src/config/shift-display.config.json`
   - `src/config/shift-styling.config.json`

2. **Upload to R2**:
   ```bash
   # Production
   ./scripts/upload-config-to-r2.sh

   # Preview (for testing)
   ./scripts/upload-config-to-r2.sh --preview
   ```

3. **Changes Take Effect**:
   - Worker cache: 5 minutes (CONFIG_CACHE_TTL_SECONDS)
   - Frontend cache: 5 minutes (React Query staleTime)
   - No rebuild or redeploy needed!

## API Endpoints

### GET /api/config/shift-display
Returns shift display configuration (aliases and label overrides).

**Response**:
```json
{
  "aliases": {
    "night": "N",
    "nights": "N"
  },
  "labels": {
    "N": "Night Shift"
  }
}
```

**Headers**:
- `Content-Type: application/json`
- `Cache-Control: public, max-age=300`
- `Access-Control-Allow-Origin: *`

### GET /api/config/shift-styling
Returns shift styling configuration (conditional underline rules).

**Response**:
```json
{
  "conditionalUnderline": {
    "shiftCode": "RATP",
    "weekdays": [1, 3, 5]
  }
}
```

## Configuration Format

### shift-display.config.json
```json
{
  "aliases": {
    "night": "N",
    "nights": "N",
    "day shift": "D"
  },
  "labels": {
    "N": "Night Shift",
    "D": "Day Shift",
    "RATP": "Reperibilità ATP"
  }
}
```

- `aliases`: Map raw shift names to normalized codes (case-insensitive)
- `labels`: Override display labels for shift codes

### shift-styling.config.json
```json
{
  "conditionalUnderline": {
    "shiftCode": "RATP",
    "weekdays": [1, 3, 5],
    "weekdaysComment": "0=Sunday, 1=Monday, ..., 6=Saturday"
  }
}
```

- `conditionalUnderline.shiftCode`: Shift code to style
- `conditionalUnderline.weekdays`: Days to apply overline (0-6)

## Caching Strategy

### Worker-Side (R2 Config)
- **TTL**: 5 minutes (300 seconds)
- **Implementation**: In-memory HashMap with timestamps
- **Key**: Config filename
- **Invalidation**: Automatic on TTL expiry

### Frontend-Side (API Config)
- **TTL**: 5 minutes (300 seconds)
- **Implementation**: React Query with staleTime
- **Key**: `['config', 'shift-display']` or `['config', 'shift-styling']`
- **Invalidation**: Automatic on staleTime expiry

### Total Propagation Time
- **Maximum**: 10 minutes (5min worker + 5min frontend)
- **Typical**: 2-5 minutes depending on cache states

## Fallback Behavior

### Worker
- If R2 fetch fails → Returns empty config `{}`
- Worker logs error and continues with empty defaults
- Schedule data still works, just without config overrides

### Frontend
- Primary: Fetch from `/api/config/:name` (R2-backed)
- Fallback: Static config files from build (backward compatible)
- If both fail: React Query error handling, retry logic

## Benefits Over PR #34

1. **No Build Issues**: No dependency on build-time resources
2. **True Runtime Config**: Update without any deployment
3. **Scalable**: R2 is designed for high-throughput object storage
4. **Versioned**: Can maintain multiple environments (prod/preview)
5. **Cacheable**: Efficient caching at both Worker and Frontend levels
6. **Observable**: Can monitor R2 access logs and cache hit rates

## Testing

### Local Development
```bash
# Terminal 1: Run worker with R2 (requires wrangler login)
cd worker && wrangler dev

# Terminal 2: Run frontend
npm run dev
```

**Note**: For local testing, you need to:
1. Upload configs to preview bucket: `./scripts/upload-config-to-r2.sh --preview`
2. Worker will use `preview_bucket_name` from wrangler.toml in dev mode

### Verify Config Endpoint
```bash
# Check if config is accessible
curl http://localhost:8787/api/config/shift-display
curl http://localhost:8787/api/config/shift-styling

# Verify cache headers
curl -I http://localhost:8787/api/config/shift-display
```

## Migration Notes

### Backward Compatibility
- Static config files (`src/config/*.json`) are kept in repo
- Frontend functions accept optional config parameter
- If R2 fails, fallback to static configs works seamlessly
- No breaking changes for existing deployments

### Deprecation Path
Future versions may:
1. Remove static config files from repo
2. Make R2 config mandatory
3. Add config versioning/rollback features
4. Add config validation/schema enforcement

## Troubleshooting

### "CONFIG_BUCKET not found" Error
- **Cause**: R2 bucket binding not configured
- **Solution**: Check `worker/wrangler.toml` has correct `[[r2_buckets]]` section
- **Verify**: `wrangler r2 bucket list` shows your buckets

### "Failed to fetch config" in Browser
- **Cause**: Worker can't access R2 or config doesn't exist
- **Solution**: Run `./scripts/upload-config-to-r2.sh` to upload configs
- **Verify**: `wrangler r2 object list schedule-viewer-config`

### Config Changes Not Appearing
- **Cause**: Cache TTL hasn't expired
- **Solution**: Wait 5 minutes or restart worker to clear cache
- **Verify**: Check Worker logs for cache hit/miss messages

### Build Fails with "Cannot find module '@/lib/config-client'"
- **Cause**: TypeScript compilation issue
- **Solution**: Ensure file exists and paths are correct in tsconfig.json
- **Verify**: `ls src/lib/config-client.ts` exists

## Future Enhancements

Potential improvements for future PRs:

1. **Config Versioning**: Store configs with version tags in R2
2. **Config Validation**: JSON schema validation before upload
3. **Config Editor UI**: Web interface to edit configs directly
4. **Config History**: Track config changes over time
5. **Multi-Environment**: Different configs per deployment stage
6. **Cache Warming**: Pre-load configs on Worker startup
7. **Config Analytics**: Track which configs are actually used

## References

- Original PR #34: Configuration in `public/config` (build issues)
- Cloudflare R2: https://developers.cloudflare.com/r2/
- Worker R2 Bindings: https://developers.cloudflare.com/workers/runtime-apis/r2/
- React Query: https://tanstack.com/query/latest
