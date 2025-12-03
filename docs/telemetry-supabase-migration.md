# Telemetry Migration: R2 → Supabase + R2 Hybrid

**Last Updated**: 2025-12-03
**Status**: Implementation Ready

## Overview

This document describes the migration of telemetry storage from R2-only to a hybrid approach using Supabase PostgreSQL (queryable data, 90 days) + R2 (long-term archival).

## Architecture

**Data Flow:**
```
Frontend (telemetry.ts)
  → Worker (handle_telemetry)
    → PRIMARY: Supabase PostgreSQL (INSERT via REST API)
    → SECONDARY: R2 (JSONL archival, unchanged)
```

**Query Path:** Supabase Dashboard → SQL Editor → Run queries manually

**Cleanup:** Supabase pg_cron → Weekly deletion of records >90 days old

## Supabase Configuration

**Project**: `schedule-viewer-telemetry`
**Region**: Europe West (closest to Worker)
**Credentials**: See `docs/supabase/.env.local`

## Database Schema

See `docs/supabase-migrations/001_create_telemetry_table.sql`

## Rust Worker Integration

The Worker uses Supabase REST API to insert events:
- Endpoint: `POST /rest/v1/telemetry_events`
- Auth: Service role key (from secrets)
- Payload: JSON array of enriched events

## Querying Telemetry

Use Supabase Dashboard → SQL Editor. Example queries:

**Page views by day:**
```sql
SELECT DATE(timestamp) as date, COUNT(*) as views
FROM telemetry_events
WHERE action = 'page_view'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

**Top actions:**
```sql
SELECT feature, action, COUNT(*) as count
FROM telemetry_events
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY feature, action
ORDER BY count DESC
LIMIT 20;
```

## Cost

- **Supabase Free Tier**: 500MB DB, unlimited API requests → $0/month
- **R2 Storage**: ~10MB/month → $0.15/month
- **Total**: ~$0.15/month at 10K events/day

## Troubleshooting

**Worker errors but R2 still works:**
- Check Cloudflare logs: `wrangler tail`
- Verify secrets: `wrangler secret list`
- Check Supabase Dashboard → Logs for API errors

**No data in Supabase:**
- Verify table exists: `SELECT COUNT(*) FROM telemetry_events;`
- Check Worker is sending: Look for "Successfully inserted" in logs
- Test manually: See Phase 4 in implementation plan

**Cleanup not running:**
- Check cron jobs: `SELECT * FROM cron.job;`
- View job history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`

## References

- Worker Code: `worker/src/lib.rs` (lines 406-503)
