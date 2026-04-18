-- ============================================
-- Migration 004: Add viewer identity columns
-- ============================================
-- Purpose: Store first-party visitor/session identifiers so analytics can
-- distinguish returning viewers without relying on IP churn.

ALTER TABLE telemetry_events
  ADD COLUMN IF NOT EXISTS visitor_id TEXT,
  ADD COLUMN IF NOT EXISTS session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_telemetry_visitor_id
  ON telemetry_events(visitor_id)
  WHERE visitor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_telemetry_session_id
  ON telemetry_events(session_id)
  WHERE session_id IS NOT NULL;

COMMENT ON COLUMN telemetry_events.visitor_id IS
  'Stable first-party viewer identifier from the long-lived tracking cookie';

COMMENT ON COLUMN telemetry_events.session_id IS
  'Rotating browser session identifier from the authenticated viewer session cookie';
