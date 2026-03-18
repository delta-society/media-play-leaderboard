-- Add source_meeting_id column to content_log
-- Tracks which Fireflies meeting the content idea originated from
-- Used by meeting-develop skill's media extraction pipeline

ALTER TABLE content_log
  ADD COLUMN source_meeting_id TEXT;

-- Expand source CHECK constraint to include 'meeting_develop'
ALTER TABLE content_log
  DROP CONSTRAINT IF EXISTS content_log_source_check;

ALTER TABLE content_log
  ADD CONSTRAINT content_log_source_check
  CHECK (source IN ('ghost_auto', 'manual_web', 'manual_claude', 'meeting_develop'));

-- Index for meeting-based content tracking
CREATE INDEX idx_content_log_source_meeting_id ON content_log(source_meeting_id)
  WHERE source_meeting_id IS NOT NULL;
