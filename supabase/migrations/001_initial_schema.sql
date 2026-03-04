-- Media Play Leaderboard: Supabase Schema
-- Migrated from Airtable

-- ===========================================
-- content_log
-- ===========================================
CREATE TABLE content_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('blog', 'linkedin', 'x', 'podcast', 'youtube', 'other')),
  content_type TEXT NOT NULL CHECK (content_type IN ('original_long', 'original_video', 'original_mid', 'short_video', 'short', 'engagement')),
  points INTEGER NOT NULL DEFAULT 0,
  published_at DATE,
  source TEXT CHECK (source IN ('ghost_auto', 'manual_web', 'manual_claude')),
  ghost_id TEXT,
  is_original BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('idea', 'published', 'dropped')),
  topic TEXT[] DEFAULT '{}',
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_log_member ON content_log(member);
CREATE INDEX idx_content_log_published_at ON content_log(published_at);
CREATE INDEX idx_content_log_status ON content_log(status);
CREATE INDEX idx_content_log_member_status ON content_log(member, status);
CREATE INDEX idx_content_log_ghost_id ON content_log(ghost_id);

-- ===========================================
-- weekly_scores
-- ===========================================
CREATE TABLE weekly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member TEXT NOT NULL,
  week TEXT NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  original_count INTEGER NOT NULL DEFAULT 0,
  meets_minimum BOOLEAN NOT NULL DEFAULT false,
  is_yellow_card BOOLEAN NOT NULL DEFAULT false,
  consecutive_miss INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_weekly_scores_member_week ON weekly_scores(member, week);
CREATE INDEX idx_weekly_scores_member ON weekly_scores(member);
CREATE INDEX idx_weekly_scores_week ON weekly_scores(week);

-- ===========================================
-- updated_at trigger
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_log_updated_at
  BEFORE UPDATE ON content_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER weekly_scores_updated_at
  BEFORE UPDATE ON weekly_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- RLS Policies
-- ===========================================
ALTER TABLE content_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_scores ENABLE ROW LEVEL SECURITY;

-- Public read (anon key)
CREATE POLICY "Public read content_log"
  ON content_log FOR SELECT
  USING (true);

CREATE POLICY "Public read weekly_scores"
  ON weekly_scores FOR SELECT
  USING (true);

-- Service role full access
CREATE POLICY "Service role full access content_log"
  ON content_log FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access weekly_scores"
  ON weekly_scores FOR ALL
  USING (auth.role() = 'service_role');
