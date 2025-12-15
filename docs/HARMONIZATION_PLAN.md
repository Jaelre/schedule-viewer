# PR Harmonization Plan

## Executive Summary

**Branches to Harmonize:**
1. `codex/add-telemetry-api-and-handler-in-worker` - Worker telemetry endpoint
2. `codex/implement-telemetry-tracking-and-context` - Client telemetry instrumentation
3. `codex/plan-for-external-json-config-loading` - Runtime config system
4. `codex/add-telemetry-section-to-readme.md` - Telemetry documentation

**Relationship:** Branches 1, 2, and 4 form a cohesive telemetry feature. Branch 3 is independent but has overlapping component modifications.

**Merge Strategy:** Sequential merge with conflict resolution.

---

## Branch Analysis

### Branch 1: Worker Telemetry Endpoint
**Files Modified:** `worker/src/lib.rs` (+244, -24)

**Changes:**
- Adds `/api/telemetry` POST endpoint
- Implements in-memory event buffering (max 50 events, 30s TTL)
- Enriches events with server-side metadata (IP, user-agent, region)
- Supports flush-on-demand and automatic flushing
- Authentication via bearer token reuse

**Dependencies:** None
**Conflicts:** None

**Adequateness:** ✅ **GOOD**
- Proper buffering to avoid database spam
- Security via token reuse (no new auth mechanism)
- Structured logging support
- Follows Worker patterns already in codebase

### Branch 2: Client Telemetry Tracking
**Files Modified:** 8 files (+304, -31)

**Key Changes:**
- New `src/lib/telemetry.ts` - Client batching/beacon API
- Instruments: ScheduleApp, MonthNav, PasswordGate, DensityToggle, LegendModal
- Tracks: view changes, month navigation, legend opens, retry attempts
- Uses localStorage token for auth
- Batches events (max 25, 5s interval)
- Uses `navigator.sendBeacon` when available

**Dependencies:** Branch 1 (needs `/api/telemetry` endpoint)
**Conflicts:** Overlaps with Branch 3 in component modifications

**Adequateness:** ✅ **GOOD**
- Proper batching prevents network spam
- Beacon API for reliability during page unload
- Token reuse aligns with existing auth
- Non-blocking (errors swallowed)
- Event schema is flexible

**Issues to Address:**
- ⚠️ Auth token field mismatch: client sends `authToken`, worker expects `Authorization` header
- ⚠️ Event schema: client uses flat objects, worker expects array under `events` key

### Branch 3: Runtime Config Loading
**Files Modified:** 34 files (+479, -868)

**Major Changes:**
- **Moves configs:** `src/config/*.json` → `public/config/*.json`
- **New system:** `src/lib/config/runtime-config.tsx` (281 lines)
- **Removes:** PDF export feature entirely (`src/app/pdf/`, `src/lib/pdf/`)
- **Updates:** Multiple components to use new config context
- **Benefits:** No rebuild needed for config changes

**Dependencies:** None
**Conflicts:** Modifies same components as Branch 2

**Adequateness:** ⚠️ **MIXED**

**Good:**
- Runtime config loading is more flexible
- Proper sanitization of external JSON
- React Context pattern is idiomatic
- Config validation prevents crashes

**Concerns:**
- **REMOVES PDF EXPORT** - Major feature removal not mentioned in commit message
- Large diff (-868 lines) suggests aggressive refactoring
- Moves from build-time to runtime (increases initial load complexity)
- Error handling is soft (shows warning but continues)

**Critical Issue:**
- PDF export removal should be a separate decision/PR
- No migration guide for config files
- Breaking change for existing deployments

### Branch 4: Documentation
**Files Modified:** 3 docs (+91 lines)

**Changes:**
- Adds telemetry section to README
- Creates `docs/telemetry.md` with detailed event schema
- Updates `docs/access-gate.md` for token reuse

**Dependencies:** Branches 1 & 2
**Conflicts:** None

**Adequateness:** ✅ **EXCELLENT**
- Comprehensive event schema documentation
- Operational guidance (inspecting output, R2 storage)
- Security considerations documented

---

## Conflict Matrix

| File | Branch 2 (Telemetry) | Branch 3 (Config) | Conflict Type |
|------|---------------------|-------------------|---------------|
| `src/app/_components/ScheduleApp.tsx` | Adds telemetry hooks | Adds RuntimeConfigProvider wrapper | **MODERATE** - Both modify structure |
| `src/app/_components/MonthNav.tsx` | Adds tracking calls | Minor refactoring | **MINOR** |
| `src/app/_components/LegendModal.tsx` | Adds tracking | Uses new config context | **MINOR** |
| `src/app/providers.tsx` | Adds TelemetryProvider | - | None |
| `src/lib/config/*` | - | Complete rewrite | None (new system) |

---

## Harmonization Strategy

### Phase 1: Telemetry Foundation (Branches 1, 2, 4)
1. **Merge Branch 1** (worker endpoint) - Clean, no conflicts
2. **Merge Branch 2** (client tracking) - Fix auth/schema issues first
3. **Merge Branch 4** (docs) - Clean, no conflicts

**Order Rationale:** Build foundation (worker) → add client → document

### Phase 2: Config System (Branch 3) - REQUIRES REVIEW
**Recommendation:** Split into two PRs:
- **PR 3a:** Runtime config system (keep PDF export)
- **PR 3b:** Remove PDF export (separate decision)

**If proceeding as-is:**
1. Merge after Phase 1 complete
2. Manually resolve conflicts in ScheduleApp, MonthNav, LegendModal
3. Ensure telemetry hooks preserved during merge

---

## Required Fixes Before Merge

### Branch 2 Client Telemetry
**Fix 1: Auth Token Format**
```typescript
// Current (WRONG):
const body = JSON.stringify({ events, authToken: token ?? undefined, ... })

// Should be:
const headers: HeadersInit = { 'Content-Type': 'application/json' }
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}
fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ events }), ... })
```

**Fix 2: Event Payload Structure**
Ensure client sends:
```json
{
  "events": [...],
  "flush": false,
  "stream": "optional-stream-name"
}
```
Worker expects `TelemetryBatch` with `events: Vec<TelemetryEvent>`

### Branch 3 Config Loading
**Fix 1: Document PDF Export Removal**
Add migration note to README:
```markdown
## Breaking Changes in vX.X
- PDF export removed in favor of browser print dialog
- Config files moved from `src/config/` to `public/config/`
- See MIGRATION.md for upgrade path
```

**Fix 2: Add Config Migration Script**
```bash
#!/bin/bash
# migrate-configs.sh
mv src/config/*.json public/config/ 2>/dev/null || true
echo "Configs migrated. Update your .gitignore if needed."
```

---

## Testing Plan

### Telemetry (Post-Phase 1)
1. ✅ Events batch correctly (check Network tab)
2. ✅ Beacon API used on page unload
3. ✅ Worker logs show enriched events
4. ✅ Token auth works (401 without token)
5. ✅ Retry on failure works

### Config System (Post-Phase 2)
1. ✅ App loads with default config (no JSON files)
2. ✅ App loads with custom config (valid JSON)
3. ✅ App shows error but continues (invalid JSON)
4. ✅ Config changes work without rebuild
5. ✅ Build-time env vars still work

### Integration
1. ✅ Telemetry works with new config system
2. ✅ No console errors on fresh install
3. ✅ Existing deployments upgrade smoothly

---

## Recommendation

### Immediate Actions
1. ✅ **Merge telemetry branches (1, 2, 4)** with auth/schema fixes
2. ⚠️ **Hold Branch 3** pending:
   - Clarification on PDF export removal intent
   - Split into two PRs (config system vs feature removal)
   - Migration documentation

### Alternative: Merge All Now
If PDF export removal is intentional:
1. Fix auth issues in Branch 2
2. Merge Branch 1 → Branch 2 → Branch 3 → Branch 4
3. Manually resolve component conflicts
4. Add migration docs
5. Test thoroughly (breaking changes)

---

## Adequateness Rating

| Branch | Rating | Justification |
|--------|--------|---------------|
| 1 (Worker telemetry) | ⭐⭐⭐⭐⭐ | Production-ready, follows best practices |
| 2 (Client telemetry) | ⭐⭐⭐⭐☆ | Good design, needs auth/schema fixes |
| 3 (Config loading) | ⭐⭐⭐☆☆ | Good system, but mixes concerns (config + PDF removal) |
| 4 (Documentation) | ⭐⭐⭐⭐⭐ | Excellent, comprehensive |

**Overall:** Telemetry features are solid. Config system is good but needs separation of concerns.

---

## Implementation Checklist

- [ ] Fix auth header in `src/lib/telemetry.ts`
- [ ] Fix event payload structure in `src/lib/telemetry.ts`
- [ ] Merge Branch 1 (worker telemetry)
- [ ] Merge Branch 2 (client telemetry) with fixes
- [ ] Merge Branch 4 (docs)
- [ ] Test telemetry end-to-end
- [ ] Decision point: Proceed with Branch 3?
  - [ ] If YES: Add migration docs, merge with conflict resolution
  - [ ] If NO: Request PR split (config vs PDF removal)
- [ ] Final integration testing
- [ ] Update CLAUDE.md with new patterns

---

**Prepared by:** Claude Code
**Date:** 2025-11-04
**Status:** Awaiting approval to proceed with implementation
