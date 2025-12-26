-- Grammar Topics Table
CREATE TABLE IF NOT EXISTS grammar_topics (
  id TEXT PRIMARY KEY,
  pattern TEXT NOT NULL,
  name TEXT NOT NULL,
  name_japanese TEXT,
  category TEXT NOT NULL,
  chapter TEXT,
  level TEXT,
  description TEXT,
  usage TEXT,
  examples JSONB,
  conjugation JSONB,
  notes TEXT,
  related_patterns TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grammar_topics_category ON grammar_topics(category);
CREATE INDEX IF NOT EXISTS idx_grammar_topics_level ON grammar_topics(level);
CREATE INDEX IF NOT EXISTS idx_grammar_topics_chapter ON grammar_topics(chapter);

-- Grammar Chunks Table (for full-text search)
CREATE TABLE IF NOT EXISTS grammar_chunks (
  id TEXT PRIMARY KEY,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  character_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grammar_chunks_index ON grammar_chunks(chunk_index);

-- Full-text search index
ALTER TABLE grammar_chunks ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX IF NOT EXISTS idx_grammar_chunks_fts ON grammar_chunks USING gin(fts);

-- Search function for grammar content
CREATE OR REPLACE FUNCTION search_grammar(query_text TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id TEXT,
  content TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gc.id,
    gc.content,
    ts_rank(gc.fts, websearch_to_tsquery('english', query_text)) AS rank
  FROM grammar_chunks gc
  WHERE gc.fts @@ websearch_to_tsquery('english', query_text)
  ORDER BY rank DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant access to authenticated users
GRANT SELECT ON grammar_topics TO authenticated;
GRANT SELECT ON grammar_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION search_grammar TO authenticated;

-- Enable RLS
ALTER TABLE grammar_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar_chunks ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access on grammar_topics"
  ON grammar_topics FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on grammar_chunks"
  ON grammar_chunks FOR SELECT
  USING (true);
