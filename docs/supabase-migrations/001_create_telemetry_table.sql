-- ============================================
-- Migration 001: Create telemetry_events table
-- ============================================
-- Purpose: Store telemetry events from schedule-viewer
-- Author: Claude Code
-- Date: 2025-12-03

-- Create telemetry_events table
CREATE TABLE IF NOT EXISTS telemetry_events (
  id BIGSERIAL PRIMARY KEY,

  -- Event fields
  timestamp TIMESTAMPTZ NOT NULL,
  feature TEXT NOT NULL,
  action TEXT NOT NULL,
  value TEXT,

  -- Context
  ym TEXT,                    -- Month identifier (e.g., "2025-10")
  url TEXT,

  -- User agent & device
  user_agent TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  language TEXT,
  timezone TEXT,
  referrer TEXT,

  -- Server metadata
  ip_address TEXT,
  region TEXT,
  stream TEXT,

  -- System
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for query performance
CREATE INDEX idx_telemetry_timestamp ON telemetry_events(timestamp DESC);
CREATE INDEX idx_telemetry_feature_action ON telemetry_events(feature, action);
CREATE INDEX idx_telemetry_created_at ON telemetry_events(created_at DESC);
CREATE INDEX idx_telemetry_ym ON telemetry_events(ym) WHERE ym IS NOT NULL;
CREATE INDEX idx_telemetry_action ON telemetry_events(action);

-- Enable Row Level Security (RLS)
ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (for Worker inserts)
CREATE POLICY "service_role_full_access"
  ON telemetry_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can read (for future dashboard)
CREATE POLICY "authenticated_read_access"
  ON telemetry_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Add table comment
COMMENT ON TABLE telemetry_events IS 'Telemetry events from schedule-viewer application';

-- Add column comments
COMMENT ON COLUMN telemetry_events.feature IS 'Feature/component name (e.g., schedule_app, month_nav)';
COMMENT ON COLUMN telemetry_events.action IS 'Action performed (e.g., page_view, change_month)';
COMMENT ON COLUMN telemetry_events.ym IS 'Month identifier for schedule views (YYYY-MM format)';
COMMENT ON COLUMN telemetry_events.stream IS 'Optional stream identifier for event batching';
