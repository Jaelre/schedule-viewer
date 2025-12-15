# Supabase telemetry database handoff

This note summarizes how telemetry events land in Supabase so another agent can build the analytics dashboard without re-reading the whole codebase.

## Data flow
- Browser captures events via `src/lib/telemetry.ts` → Worker endpoint `POST /api/telemetry` (`worker/src/lib.rs`) → Supabase REST insert into `telemetry_events`.
- R2 archival remains enabled as a secondary sink; Supabase is the primary source for dashboard queries.
- Auth: reuse the password-gate token (`Authorization: Bearer <token>` header). `sendBeacon` calls include `authToken` in the body as a fallback.

## Supabase setup
- Project: `schedule-viewer-telemetry` (region: Europe West). URL + service-role key live in `docs/supabase/.env.local` (git-crypt).
- Worker secrets required: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`; optional `SUPABASE_TELEMETRY_TABLE` (defaults to `telemetry_events`).
- Run migrations in order via the Supabase SQL editor:
  1) `docs/supabase-migrations/001_create_telemetry_table.sql`
  2) `docs/supabase-migrations/002_create_cleanup_cron.sql`
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
| url | text | page URL |
| user_agent | text | from request header |
| viewport_width / viewport_height | integer | from client `viewport` block |
| language | text | browser language |
| timezone | text | IANA zone |
| referrer | text | document referrer |
| ip_address | text | `CF-Connecting-IP` |
| region | text | Cloudflare region |
| stream | text | optional batch stream id |
| created_at | timestamptz | defaults to `now()` |

Indexes: timestamp desc, feature+action, created_at desc, ym (partial), action. RLS: service_role full access; authenticated users can `SELECT`.

## Event shape and mapping
- Client payload (`src/lib/telemetry.ts`) enriches each event with: `timestamp`, `url`, `userAgent`, `language`, `viewport.{width,height}`, `timezone`, `referrer`, plus the caller-supplied fields (`feature`, `action`, optional `value`, `ym`, etc.).
- Worker (`worker/src/lib.rs`) flattens the event JSON into the columns above. Missing fields become NULL; `value` is coerced to string if it is not already a string.
- Metadata not written to Supabase: `received_at` (Worker-only) and the full nested objects beyond the mapped fields.

### Current emitters (feature → actions → value)
- `schedule_app`: `page_view` (ym), `toggle_view` (next view mode), `open_legend` (ym), `retry_fetch` (ym)
- `month_nav`: `change_month` (target ym)
- `density_toggle`: `change_density` (density), `open_legend` (current density)
- `legend_modal`: `open` / `close` (count of codes)
- `password_gate`: `submit` (`filled`/`empty`), `submit_result` (`success`/`invalid`/`error`)
- `pdf_export`: `export_start` / `export_success` / `export_error` (ym)

## Retention and maintenance
- pg_cron job deletes records older than 90 days (`002_create_cleanup_cron.sql`).
- Supabase is the authoritative 90-day window; R2 keeps long-term JSONL archives if needed.

## Querying tips for dashboard work
- Use Supabase SQL or a service-role client. RLS permits read access to authenticated users; dashboards running server-side should prefer the service-role key.
- Common slices: date bucketing on `timestamp`, month filters on `ym`, feature/action breakdowns, viewport or region segmentation. Start from `docs/supabase-migrations/003_useful_queries.sql`.
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
