-- ============================================
-- Migration 005: Add schedule-viewer release to telemetry_events
-- ============================================
-- Purpose: Store the optional frontend release identifier emitted with telemetry events
-- Date: 2026-04-28

ALTER TABLE telemetry_events
  ADD COLUMN IF NOT EXISTS schedule_viewer_release TEXT;

CREATE INDEX IF NOT EXISTS idx_telemetry_schedule_viewer_release
  ON telemetry_events(schedule_viewer_release)
  WHERE schedule_viewer_release IS NOT NULL;

COMMENT ON COLUMN telemetry_events.schedule_viewer_release IS
  'Optional release identifier supplied by the schedule-viewer telemetry emitter';

CREATE OR REPLACE VIEW analytics_feature_usage_release_daily
WITH (security_invoker = true)
AS
SELECT
  date_trunc('day', "timestamp")::timestamptz AS period,
  feature,
  schedule_viewer_release,
  count(*)::bigint AS count
FROM telemetry_events
WHERE feature IS NOT NULL
GROUP BY 1, 2, 3;

COMMENT ON VIEW analytics_feature_usage_release_daily IS
  'Daily feature usage counts segmented by schedule viewer release';
