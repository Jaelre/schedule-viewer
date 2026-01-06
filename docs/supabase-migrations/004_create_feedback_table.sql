-- Migration 004: Create feedback_submissions table
-- Purpose: Store user feedback from schedule-viewer
-- Date: 2025-12-28

CREATE TABLE IF NOT EXISTS feedback_submissions (
  id BIGSERIAL PRIMARY KEY,

  -- Feedback content
  feedback_text TEXT NOT NULL CHECK (char_length(feedback_text) > 0 AND char_length(feedback_text) <= 1000),
  signature TEXT,  -- Optional user signature/name

  -- Metadata (JSONB for flexible extension)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Extracted metadata fields (for indexing/querying)
  user_agent TEXT,
  ip_address TEXT,
  region TEXT,
  url TEXT,
  ym TEXT,  -- Current month being viewed when feedback submitted

  -- System timestamps
  submitted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_submitted_at ON feedback_submissions(submitted_at DESC);
CREATE INDEX idx_feedback_created_at ON feedback_submissions(created_at DESC);
CREATE INDEX idx_feedback_ym ON feedback_submissions(ym) WHERE ym IS NOT NULL;
CREATE INDEX idx_feedback_metadata ON feedback_submissions USING gin(metadata);

-- Enable RLS
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (for Worker inserts)
CREATE POLICY "service_role_full_access"
  ON feedback_submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can read (for future admin dashboard)
CREATE POLICY "authenticated_read_access"
  ON feedback_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Comments
COMMENT ON TABLE feedback_submissions IS 'User feedback submissions from schedule-viewer';
COMMENT ON COLUMN feedback_submissions.feedback_text IS 'User feedback content (max 1000 chars)';
COMMENT ON COLUMN feedback_submissions.signature IS 'Optional user signature/name';
COMMENT ON COLUMN feedback_submissions.metadata IS 'Flexible metadata storage (viewport, language, etc)';
COMMENT ON COLUMN feedback_submissions.ym IS 'Month identifier when feedback submitted (YYYY-MM)';
