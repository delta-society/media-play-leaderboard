-- Add knowledge extraction columns to content_log
-- Enables automatic full-text extraction and knowledge indexing

ALTER TABLE content_log
  ADD COLUMN full_text TEXT,
  ADD COLUMN summary TEXT,
  ADD COLUMN key_claims TEXT[] DEFAULT '{}',
  ADD COLUMN extracted_at TIMESTAMPTZ;

-- Index for unextracted content (extraction queue)
CREATE INDEX idx_content_log_extraction_pending
  ON content_log(status, channel)
  WHERE full_text IS NULL AND status = 'published';
