# Telemetry Deep-Dive

This document explains how the telemetry client and Worker endpoint cooperate to
emit usage events. It supplements the high-level summary in the
[README](../README.md#telemetry) and provides operational notes for tuning,
storage, and verification.

## Event schema

Each browser event is enqueued as a flat first-party analytics object:

```json
{
  "feature": "schedule_app",
  "action": "page_view",
  "value": "2026-04",
  "ym": "2026-04",
  "timestamp": "2026-04-18T09:15:32.904Z",
  "url": "/?ym=2026-04",
  "referrer": "/?ym=2026-03",
  "language": "it-IT",
  "viewport": {
    "width": 1440,
    "height": 900
  },
  "timezone": "Europe/Rome",
  "schedule_viewer_release": "2026.04.28"
}
```

- `feature` / `action` – The explicit in-site interaction being tracked.
- `value` – Optional detail such as the selected month, density, or clicked doctor id.
- `url` – Sanitized in-site path plus query string; never a full cross-site URL.
- `referrer` – Previous in-site path when available; cross-site referrers are dropped.
- `language`, `viewport`, `timezone` – Environment context useful for UX analysis.
- `schedule_viewer_release` – Optional release identifier supplied by `NEXT_PUBLIC_SCHEDULE_VIEWER_RELEASE`.

## Batching and flush thresholds

The client helper appends events to an in-memory queue and evaluates the
following flush conditions:

| Trigger | Description | Config | Default |
| --- | --- | --- | --- |
| Batch size | Flush when the queue reaches the batch limit. | `TELEMETRY_MAX_BATCH_SIZE` (Worker) | 20 |
| Interval | Flush on a cadence even if the queue is not full. | `TELEMETRY_FLUSH_INTERVAL_MS` (Worker) | 5000 ms |
| Page lifecycle | Flush immediately when the document is hidden, the tab closes, or the browser fires `beforeunload`. | n/a | Always on |

The Worker returns HTTP 202 upon successful ingestion. Non-2xx responses leave
the queue intact and the helper retries on the next interval tick so that short
outages do not drop data.

## Storage and logging destinations

Incoming batches are handled by the Worker route at `/api/telemetry`:

1. Requests must include the first-party authenticated session cookie issued by
   `/api/access`; unauthenticated requests are rejected with 401.
2. The Worker also reads the long-lived `schedule_viewer_vid` cookie and stores
   it as `visitor_id` so returning viewers can be counted without depending only
   on IP address stability.
3. When `TELEMETRY_LOG_ONLY=true` (default), the Worker writes each event to
   structured logs (visible via `wrangler tail` or Cloudflare Dashboard) and
   returns immediately without persisting to R2.
4. When `TELEMETRY_LOG_ONLY=false`, the Worker still inserts telemetry into
   Supabase immediately, but R2 archival is deferred to a scheduled daily export
   from Supabase. This keeps R2 as a lower-frequency archive rather than a
   second real-time sink.

No raw telemetry is stored in the browser; once the flush promise resolves the
queue is cleared.

### R2 bucket configuration

To enable daily R2 archival for telemetry:

1. Create the R2 buckets (one-time setup):
   ```bash
   wrangler r2 bucket create schedule-viewer-telemetry
   ```

   Create `schedule-viewer-telemetry-preview` only if you also run a separate
   preview Worker environment.

2. The bucket is already configured in `wrangler.toml` with binding `TELEMETRY_BUCKET`.

3. Leave `TELEMETRY_ARCHIVE_MODE=daily` (default) and `TELEMETRY_LOG_ONLY=false` in `wrangler.toml`.

4. Deploy the worker. The built-in cron (`15 1 * * *`) exports the previous UTC day from Supabase into R2:
   ```bash
   cd worker && wrangler deploy
   ```

## Inspecting telemetry output

Use the following approaches to confirm telemetry delivery end-to-end:

- **Local development** – Run `cd worker && wrangler dev` and inspect console
  output; the Worker always prints a summary when flushing events. Full event
  payloads are logged when `TELEMETRY_LOG_ONLY=true`.
- **Tail production traffic** – Execute `wrangler tail` to stream structured
  logs from the live Worker in real-time.
- **Cloudflare Dashboard** – View logs in the Cloudflare dashboard under your
  Worker's "Logs" tab for historical access.
- **Review persisted batches** – If R2 archival is enabled, list objects with
  `wrangler r2 object list schedule-viewer-telemetry` and download the relevant
  daily JSONL files for offline analysis:
  ```bash
  # List all telemetry archive files
  wrangler r2 object list schedule-viewer-telemetry

  # Download a specific daily archive part
  wrangler r2 object get schedule-viewer-telemetry/<yyyymmdd>/daily-001.jsonl --file telemetry.jsonl
  ```

Refer back to [docs/access-gate.md](access-gate.md#telemetry-and-cookie-reuse)
for guidance on reusing the access gate cookies and rotating credentials.
