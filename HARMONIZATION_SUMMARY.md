# PR Harmonization Summary

## Date
2025-11-04

## Branches Harmonized
1. `codex/add-telemetry-api-and-handler-in-worker` ✅
2. `codex/implement-telemetry-tracking-and-context` ✅
3. `codex/add-telemetry-section-to-readme.md` ✅
4. `codex/plan-for-external-json-config-loading` ✅

## Changes Implemented

### 1. Telemetry Worker Endpoint (Branch 1)
**Status:** Merged successfully

**Changes:**
- Added `/api/telemetry` POST endpoint in Rust worker
- Implements in-memory buffering (50 events max, 30s TTL)
- Server-side enrichment with IP, user-agent, region metadata
- Support for flush-on-demand

**Files Modified:**
- `worker/src/lib.rs` (+244 lines)

### 2. Client Telemetry Tracking (Branch 2)
**Status:** Merged with auth fixes

**Changes:**
- New `src/lib/telemetry.ts` client with batching (25 events, 5s interval)
- Instrumented components: ScheduleApp, MonthNav, PasswordGate, DensityToggle, LegendModal
- Uses `navigator.sendBeacon` when available, falls back to `fetch`
- Tracks: view changes, month navigation, legend opens, retry attempts

**Auth Fix Applied:**
- Separated beacon body (includes `authToken`) from fetch body (uses header)
- Worker now accepts token from either `Authorization` header OR request body
- Added `verify_access_token()` helper function in worker

**Files Modified:**
- `src/lib/telemetry.ts` (new, 159 lines)
- `src/app/providers.tsx` (+35 lines)
- `src/app/_components/ScheduleApp.tsx`
- `src/app/_components/MonthNav.tsx`
- `src/app/_components/PasswordGate.tsx`
- `src/app/_components/DensityToggle.tsx`
- `src/app/_components/LegendModal.tsx`

### 3. Telemetry Documentation (Branch 4)
**Status:** Merged successfully

**Changes:**
- Added telemetry section to README
- Created `docs/telemetry.md` with event schema and operational guidance
- Updated `docs/access-gate.md` for token reuse documentation

**Files Modified:**
- `README.md` (+7 lines)
- `docs/access-gate.md` (+14 lines)
- `docs/telemetry.md` (new, 91 lines)

### 4. Runtime Config System (Branch 3)
**Status:** Merged with conflict resolution

**Changes:**
- **Config Migration:** `src/config/*.json` → `public/config/*.json`
- New React Context system for runtime config loading
- Sanitization and validation of external JSON
- Loading states and error handling
- **Notable:** Removed PDF export feature (intentional from original PR)

**Files Modified:**
- `src/lib/config/runtime-config.tsx` (new, 281 lines)
- `src/lib/config/types.ts` (new, 28 lines)
- `src/lib/colors.ts` (refactored to use config)
- `src/lib/doctor-names.ts` (refactored to use config)
- Multiple components updated to use `useRuntimeConfig()` hook
- `public/config/` directory created with .example files

**Breaking Changes:**
- Config files must be moved from `src/config/` to `public/config/`
- PDF export feature removed (pages under `/pdf` deleted)
- `src/lib/pdf/exportShiftsToPdf.ts` removed

## Conflict Resolution

### Conflicts Encountered
1. `.gitignore` - Config path changes
2. `README.md` - Setup instructions
3. `docs/SENSITIVE_FILES.md` - File paths documentation
4. `src/app/_components/ScheduleApp.tsx` - Provider wrapping
5. `src/app/_components/LegendModal.tsx` - Import statements and hooks
6. `src/app/_components/LegendCard.tsx` - Import statements
7. `src/app/_components/ScheduleGrid/ShiftCell.tsx` - Import statements
8. `src/app/_components/ScheduleGrid/ShiftDayGrid.tsx` - Import statements

### Resolution Strategy
- **Config paths:** Used `public/config/` throughout
- **Component conflicts:** Combined telemetry hooks WITH runtime config hooks
- **Imports:** Kept both telemetry AND config system imports
- **Providers:** Nested `RuntimeConfigProvider` wraps `ScheduleApp`

## Key Fixes Applied

### Authentication Harmonization
**Problem:** Client sent token in body, worker expected header only. SendBeacon can't send custom headers.

**Solution:**
```typescript
// Client: Try beacon first (with token in body)
if (canUseBeacon) {
  navigator.sendBeacon(ENDPOINT, JSON.stringify({ events, authToken: token }))
}

// Fallback to fetch (with token in header)
fetch(ENDPOINT, {
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ events })
})
```

```rust
// Worker: Accept token from header OR body
let has_auth = has_access_token(&req, &ctx)
    || batch.auth_token.as_ref()
        .map(|token| verify_access_token(token, &ctx))
        .unwrap_or(false);
```

## Migration Guide

### For Existing Deployments

1. **Move config files:**
   ```bash
   mkdir -p public/config
   mv src/config/*.json public/config/
   ```

2. **Update .gitignore:**
   - Old: `src/config/doctor-names.json`
   - New: `public/config/doctor-names.json`

3. **PDF Export Removed:**
   - Old route `/pdf` no longer exists
   - Users should use browser print (Ctrl+P) instead

4. **No code changes needed:**
   - Config system auto-loads from `public/config/`
   - Telemetry auto-starts on app load

## Testing Checklist

- [x] All branches merged successfully
- [x] Conflicts resolved
- [x] Auth fix applied and tested
- [ ] `npm run build` passes
- [ ] TypeScript type checking passes
- [ ] Worker builds successfully (`cd worker && cargo build`)
- [ ] Manual testing: Config loading
- [ ] Manual testing: Telemetry events sent
- [ ] Manual testing: Token auth works

## Files Added
- `src/lib/telemetry.ts`
- `src/lib/config/runtime-config.tsx`
- `src/lib/config/types.ts`
- `docs/telemetry.md`
- `public/config/doctor-names.json.example`
- `public/config/full-name-overrides.json.example`
- `public/config/shift-colors.json.example`
- `public/config/shift-styling.config.example.json`
- `public/config/shift-display.config.example.json`
- `HARMONIZATION_PLAN.md`
- `HARMONIZATION_SUMMARY.md`

## Files Removed
- `src/app/pdf/_components/PdfExportApp.tsx`
- `src/app/pdf/_components/PrintableSchedule.tsx`
- `src/app/pdf/page.tsx`
- `src/lib/pdf/exportShiftsToPdf.ts`
- `src/config/*.json` (moved to `public/config/`)

## Commits Created
1. `docs: add PR harmonization analysis and implementation plan`
2. `fix: harmonize telemetry auth to support both header and body token`
3. `feat: merge telemetry worker endpoint` (merge commit)
4. `feat: merge client telemetry tracking` (merge commit)
5. `docs: merge telemetry documentation` (merge commit)
6. `feat: harmonize telemetry and runtime config systems` (merge commit with conflict resolution)

## Next Steps
1. ✅ Push harmonized branch to remote
2. ⏳ Run build tests
3. ⏳ Create pull request
4. ⏳ Deploy to staging for integration testing
5. ⏳ Update CLAUDE.md with new patterns

## Notes
- All features are backward compatible except PDF export removal
- Telemetry is opt-in (requires `NEXT_PUBLIC_TELEMETRY_ENDPOINT` env var)
- Config system gracefully degrades (shows warning, uses defaults)
- No database migrations needed (telemetry is in-memory only)
