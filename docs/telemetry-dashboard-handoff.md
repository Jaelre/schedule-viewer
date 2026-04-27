# Supabase telemetry database handoff

This note summarizes how telemetry events land in Supabase so another agent can build the analytics dashboard without re-reading the whole codebase.

## Data flow
- Browser captures events via `src/lib/telemetry.ts` → Worker endpoint `POST /api/telemetry` (`worker/src/lib.rs`) → Supabase REST insert into `telemetry_events`.
- R2 archival remains a secondary sink, but it is now exported once per day from Supabase rather than written on every telemetry flush.
- Auth: telemetry now rides on the first-party viewer session cookie issued by `/api/access`. Existing bearer-token logins are intentionally invalidated so returning viewers re-enter through the cookie flow and pick up the long-lived visitor id.

## Supabase setup
- Project: `schedule-viewer-telemetry` (region: Europe West). URL + service-role key live in `docs/supabase/.env.local` (git-crypt).
- Worker secrets required: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`; optional `SUPABASE_TELEMETRY_TABLE` (defaults to `telemetry_events`).
- Run migrations in order via the Supabase SQL editor:
  1) `docs/supabase-migrations/001_create_telemetry_table.sql`
  2) `docs/supabase-migrations/002_create_cleanup_cron.sql`
  3) `docs/supabase-migrations/004_add_viewer_identity_to_telemetry.sql` for existing databases created before visitor/session ids were added
  4) `docs/supabase-migrations/005_add_schedule_viewer_release_to_telemetry.sql` for existing databases created before release tracking was added
- Useful canned queries: `docs/supabase-migrations/003_useful_queries.sql`

## Table schema: telemetry_events
| column | type | notes |
| --- | --- | --- |
| id | bigserial pk | auto increment |
| timestamp | timestamptz | client event time (from browser) |
| feature | text | component namespace (e.g. `schedule_app`) |
| action | text | verb (e.g. `page_view`) |
| value | text | optional detail; non-strings are JSON stringified |
| ym | text | month identifier (`YYYY-MM`) |
| url | text | current in-site path (`pathname + search`), not a full cross-site URL |
| user_agent | text | from request header |
| viewport_width / viewport_height | integer | from client `viewport` block |
| language | text | browser language |
| timezone | text | IANA zone |
| referrer | text | previous in-site path only; external referrers are dropped |
| ip_address | text | `CF-Connecting-IP` |
| region | text | Cloudflare region |
| visitor_id | text | stable first-party viewer id from the long-lived cookie |
| session_id | text | rotating authenticated session id |
| stream | text | optional batch stream id |
| schedule_viewer_release | text | optional release identifier supplied by the schedule-viewer emitter |
| created_at | timestamptz | defaults to `now()` |

Indexes: timestamp desc, feature+action, created_at desc, ym (partial), action, visitor_id (partial), session_id (partial), schedule_viewer_release (partial). RLS: service_role full access; authenticated users can `SELECT`.

## Event shape and mapping
- Client payload (`src/lib/telemetry.ts`) enriches each event with: `timestamp`, sanitized same-site `url`, `language`, `viewport.{width,height}`, `timezone`, same-site `referrer`, optional `schedule_viewer_release` from `NEXT_PUBLIC_SCHEDULE_VIEWER_RELEASE`, plus the caller-supplied fields (`feature`, `action`, optional `value`, `ym`, etc.).
- Worker (`worker/src/lib.rs`) flattens the event JSON into the columns above. Missing fields become NULL; `value` is coerced to string if it is not already a string.
- The worker also injects `visitor_id` and `session_id` from the signed session cookie, so unique-visitor stats can use first-party ids instead of IP address alone.
- Metadata not written to Supabase: `received_at` (Worker-only) and the full nested objects beyond the mapped fields.

### Current emitters (feature → actions → value)
- `schedule_app`: `page_view` (ym), `toggle_view` (next view mode), `open_legend` (ym), `retry_fetch` (ym)
- `month_nav`: `change_month` (target ym)
- `density_toggle`: `change_density` (density), `open_legend` (current density)
- `legend_modal`: `open` / `close` (count of codes)
- `doctor_icon`: `click` (doctor id in `value`)
- `password_gate`: `submit` (`filled`/`empty`), `submit_result` (`success`/`invalid`/`error`)
- `pdf_export`: `export_start` / `export_success` / `export_error` (ym)

## Retention and maintenance
- pg_cron job deletes records older than 90 days (`002_create_cleanup_cron.sql`).
- Supabase is the authoritative 90-day window; R2 keeps lower-frequency daily JSONL archives if needed.

## Querying tips for dashboard work
- Use Supabase SQL or a service-role client. RLS permits read access to authenticated users; dashboards running server-side should prefer the service-role key.
- Common slices: date bucketing on `timestamp`, month filters on `ym`, feature/action breakdowns, viewport or region segmentation. Prefer `COALESCE(visitor_id, ip_address)` when you need a “unique user” fallback while older rows are still present. Start from `docs/supabase-migrations/003_useful_queries.sql`.
- Release-aware feature usage can query `analytics_feature_usage_release_daily` once `schedule_viewer_release` is emitted by the app.
- Example (events per day for current month):
```sql
SELECT DATE(timestamp) AS day, COUNT(*) AS events
FROM telemetry_events
WHERE ym = to_char(NOW(), 'YYYY-MM')
GROUP BY day
ORDER BY day DESC;
```

## References
- Worker ingestion: `worker/src/lib.rs` (`handle_telemetry`)
- Client emitter: `src/lib/telemetry.ts`
- Migrations and canned queries: `docs/supabase-migrations/*`
- Migration overview: `docs/telemetry-supabase-migration.md`
