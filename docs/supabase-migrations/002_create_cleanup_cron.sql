-- ============================================
-- Migration 002: Setup automatic cleanup
-- ============================================
-- Purpose: Delete telemetry events older than 90 days
-- Author: Claude Code
-- Date: 2025-12-03

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly cleanup job
-- Runs every Sunday at 2:00 AM UTC
SELECT cron.schedule(
  'cleanup_old_telemetry',                          -- Job name
  '0 2 * * 0',                                      -- Cron: Sunday 2 AM UTC
  $$
  DELETE FROM telemetry_events
  WHERE created_at < NOW() - INTERVAL '90 days';
  $$
);

-- Verify job was created
SELECT * FROM cron.job WHERE jobname = 'cleanup_old_telemetry';

-- Add helpful queries for monitoring

-- View job execution history:
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup_old_telemetry')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- Check oldest record (should never be >90 days old):
-- SELECT MIN(created_at) as oldest_event FROM telemetry_events;

-- Manually trigger cleanup (for testing):
-- DELETE FROM telemetry_events WHERE created_at < NOW() - INTERVAL '90 days';
