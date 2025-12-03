-- ============================================
-- Useful Telemetry Queries
-- ============================================
-- Copy-paste these into Supabase SQL Editor for analysis

-- ============================================
-- 1. Page Views by Day (Last 30 Days)
-- ============================================
SELECT
  DATE(timestamp) as date,
  COUNT(*) as views
FROM telemetry_events
WHERE action = 'page_view'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- ============================================
-- 2. Top Actions (Last 7 Days)
-- ============================================
SELECT
  feature,
  action,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM telemetry_events
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY feature, action
ORDER BY count DESC
LIMIT 20;

-- ============================================
-- 3. Monthly Schedule Views (by ym field)
-- ============================================
SELECT
  ym,
  COUNT(*) as views,
  COUNT(DISTINCT DATE(timestamp)) as days_viewed
FROM telemetry_events
WHERE action = 'page_view'
  AND ym IS NOT NULL
GROUP BY ym
ORDER BY ym DESC;

-- ============================================
-- 4. Regional Distribution (Last 30 Days)
-- ============================================
SELECT
  region,
  COUNT(*) as events,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM telemetry_events
WHERE region IS NOT NULL
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY region
ORDER BY events DESC;

-- ============================================
-- 5. Hourly Activity Pattern (Last 7 Days)
-- ============================================
SELECT
  EXTRACT(HOUR FROM timestamp) as hour_utc,
  COUNT(*) as events,
  COUNT(DISTINCT DATE(timestamp)) as days
FROM telemetry_events
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY hour_utc
ORDER BY hour_utc;

-- ============================================
-- 6. User Journey (by feature/action sequence)
-- ============================================
SELECT
  feature,
  action,
  COUNT(*) as occurrences,
  AVG(EXTRACT(EPOCH FROM (
    LEAD(timestamp) OVER (PARTITION BY ip_address ORDER BY timestamp) - timestamp
  ))) as avg_seconds_to_next_action
FROM telemetry_events
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY feature, action
ORDER BY occurrences DESC
LIMIT 20;

-- ============================================
-- 7. Data Quality Check
-- ============================================
SELECT
  'Total Events' as metric,
  COUNT(*) as value
FROM telemetry_events

UNION ALL

SELECT
  'Events Last 24h',
  COUNT(*)
FROM telemetry_events
WHERE timestamp >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'Events with ym',
  COUNT(*)
FROM telemetry_events
WHERE ym IS NOT NULL

UNION ALL

SELECT
  'Oldest Event Age (days)',
  EXTRACT(DAY FROM NOW() - MIN(timestamp))
FROM telemetry_events

UNION ALL

SELECT
  'Storage Size (MB)',
  pg_total_relation_size('telemetry_events') / 1024.0 / 1024.0
FROM telemetry_events
LIMIT 1;

-- ============================================
-- 8. Check Cleanup Job Status
-- ============================================
SELECT
  j.jobid,
  j.jobname,
  j.schedule,
  j.active,
  r.start_time as last_run,
  r.status as last_status
FROM cron.job j
LEFT JOIN LATERAL (
  SELECT start_time, status
  FROM cron.job_run_details
  WHERE jobid = j.jobid
  ORDER BY start_time DESC
  LIMIT 1
) r ON true
WHERE j.jobname = 'cleanup_old_telemetry';
