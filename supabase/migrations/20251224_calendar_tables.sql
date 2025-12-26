-- Calendar feature tables for Japanese Learning Calendar
-- Track learned words/kanji and user preferences

-- Table: user_learned_items
-- Tracks words and kanji that users have marked as "learned"
CREATE TABLE IF NOT EXISTS user_learned_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('word', 'kanji')),
  item_key TEXT NOT NULL,           -- The word or kanji character
  reading TEXT,                      -- Hiragana reading
  meaning TEXT NOT NULL,             -- English meaning
  jlpt_level TEXT CHECK (jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  learned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, item_type, item_key)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_learned_items_user ON user_learned_items(user_id);
CREATE INDEX IF NOT EXISTS idx_learned_items_type_level ON user_learned_items(item_type, jlpt_level);

-- Table: user_calendar_settings
-- Stores user preferences for the calendar (JLPT level selection)
CREATE TABLE IF NOT EXISTS user_calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  jlpt_level TEXT NOT NULL DEFAULT 'N5' CHECK (jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  ical_token TEXT UNIQUE,            -- Unique token for iCal feed URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security policies
ALTER TABLE user_learned_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_calendar_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own learned items" ON user_learned_items;
DROP POLICY IF EXISTS "Users can insert own learned items" ON user_learned_items;
DROP POLICY IF EXISTS "Users can delete own learned items" ON user_learned_items;
DROP POLICY IF EXISTS "Users can view own calendar settings" ON user_calendar_settings;
DROP POLICY IF EXISTS "Users can insert own calendar settings" ON user_calendar_settings;
DROP POLICY IF EXISTS "Users can update own calendar settings" ON user_calendar_settings;

-- Policies for user_learned_items
CREATE POLICY "Users can view own learned items"
  ON user_learned_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learned items"
  ON user_learned_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own learned items"
  ON user_learned_items FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for user_calendar_settings
CREATE POLICY "Users can view own calendar settings"
  ON user_calendar_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar settings"
  ON user_calendar_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar settings"
  ON user_calendar_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to generate unique iCal token
CREATE OR REPLACE FUNCTION generate_ical_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(24), 'base64');
END;
$$ LANGUAGE plpgsql;
