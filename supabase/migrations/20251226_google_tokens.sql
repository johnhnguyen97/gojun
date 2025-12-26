-- Store Google OAuth tokens for Calendar and Tasks sync
CREATE TABLE IF NOT EXISTS user_google_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  google_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE user_google_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own Google tokens" ON user_google_tokens;
DROP POLICY IF EXISTS "Users can insert own Google tokens" ON user_google_tokens;
DROP POLICY IF EXISTS "Users can update own Google tokens" ON user_google_tokens;
DROP POLICY IF EXISTS "Users can delete own Google tokens" ON user_google_tokens;

-- Policies
CREATE POLICY "Users can view own Google tokens"
  ON user_google_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Google tokens"
  ON user_google_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Google tokens"
  ON user_google_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own Google tokens"
  ON user_google_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_google_tokens_user ON user_google_tokens(user_id);
