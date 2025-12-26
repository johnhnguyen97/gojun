import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const GRAMMAR_DATA_DIR = path.join(__dirname, '..', 'grammar-data');

async function createTables() {
  console.log('📦 Creating tables if not exists...\n');

  // Create grammar_topics table
  const { error: topicsError } = await supabase.rpc('exec_sql', {
    sql: `
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
    `
  });

  if (topicsError) {
    console.log('Note: RPC not available, will create via insert');
  }

  // Create grammar_chunks table for vector search
  const { error: chunksError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS grammar_chunks (
        id TEXT PRIMARY KEY,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        character_count INTEGER,
        embedding vector(1536),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_grammar_chunks_index ON grammar_chunks(chunk_index);
    `
  });

  if (chunksError) {
    console.log('Note: Chunks table creation via RPC not available');
  }

  console.log('✅ Tables ready\n');
}

async function uploadTopics() {
  console.log('📤 Uploading grammar topics...\n');

  const topicsPath = path.join(GRAMMAR_DATA_DIR, 'topics.json');
  const topics = JSON.parse(fs.readFileSync(topicsPath, 'utf-8'));

  // Transform to snake_case for Supabase
  const rows = topics.map(topic => ({
    id: topic.id,
    pattern: topic.pattern,
    name: topic.name,
    name_japanese: topic.nameJapanese || null,
    category: topic.category,
    chapter: topic.chapter || null,
    level: topic.level || null,
    description: topic.description || null,
    usage: topic.usage || null,
    examples: topic.examples || null,
    conjugation: topic.conjugation || null,
    notes: topic.notes || null,
    related_patterns: topic.relatedPatterns || null
  }));

  // Upsert in batches
  const batchSize = 10;
  let uploaded = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    const { error } = await supabase
      .from('grammar_topics')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      // Table might not exist, try to create it
      if (error.code === '42P01') {
        console.log('Creating grammar_topics table...');

        const { error: createError } = await supabase.from('grammar_topics').insert(batch);
        if (createError && createError.code === '42P01') {
          console.error('❌ Table does not exist. Please create it in Supabase dashboard.');
          console.log('\nRun this SQL in Supabase SQL Editor:\n');
          console.log(`
CREATE TABLE grammar_topics (
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

CREATE INDEX idx_grammar_topics_category ON grammar_topics(category);
CREATE INDEX idx_grammar_topics_level ON grammar_topics(level);
          `);
          return false;
        }
      } else {
        console.error(`Error uploading batch: ${error.message}`);
      }
    } else {
      uploaded += batch.length;
      console.log(`  Uploaded ${uploaded}/${rows.length} topics`);
    }
  }

  console.log(`\n✅ Uploaded ${uploaded} grammar topics\n`);
  return true;
}

async function uploadChunks() {
  console.log('📤 Uploading grammar chunks...\n');

  const chunksPath = path.join(GRAMMAR_DATA_DIR, 'chunks.json');
  const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));

  // Transform to snake_case
  const rows = chunks.map(chunk => ({
    id: chunk.id,
    chunk_index: chunk.index,
    content: chunk.content,
    character_count: chunk.characterCount
  }));

  // Upsert in batches
  const batchSize = 50;
  let uploaded = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    const { error } = await supabase
      .from('grammar_chunks')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      if (error.code === '42P01') {
        console.log('Creating grammar_chunks table...');
        console.log('\nRun this SQL in Supabase SQL Editor:\n');
        console.log(`
CREATE TABLE grammar_chunks (
  id TEXT PRIMARY KEY,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  character_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grammar_chunks_index ON grammar_chunks(chunk_index);

-- For full-text search
ALTER TABLE grammar_chunks ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX IF NOT EXISTS idx_grammar_chunks_fts ON grammar_chunks USING gin(fts);
        `);
        return false;
      } else {
        console.error(`Error uploading batch: ${error.message}`);
      }
    } else {
      uploaded += batch.length;
      if (uploaded % 100 === 0 || uploaded === rows.length) {
        console.log(`  Uploaded ${uploaded}/${rows.length} chunks`);
      }
    }
  }

  console.log(`\n✅ Uploaded ${uploaded} grammar chunks\n`);
  return true;
}

async function main() {
  console.log('🚀 Starting Supabase upload...\n');
  console.log(`URL: ${supabaseUrl}\n`);

  // Test connection
  const { data, error } = await supabase.from('grammar_topics').select('count').limit(1);

  if (error && error.code === '42P01') {
    console.log('📋 Tables need to be created. Please run the following SQL in Supabase:\n');
    console.log(`
-- Grammar Topics Table
CREATE TABLE grammar_topics (
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

CREATE INDEX idx_grammar_topics_category ON grammar_topics(category);
CREATE INDEX idx_grammar_topics_level ON grammar_topics(level);

-- Grammar Chunks Table (for search)
CREATE TABLE grammar_chunks (
  id TEXT PRIMARY KEY,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  character_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grammar_chunks_index ON grammar_chunks(chunk_index);

-- Full-text search
ALTER TABLE grammar_chunks ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX idx_grammar_chunks_fts ON grammar_chunks USING gin(fts);
    `);

    // Save SQL to file
    const sqlPath = path.join(GRAMMAR_DATA_DIR, 'create-tables.sql');
    fs.writeFileSync(sqlPath, `
-- Grammar Topics Table
CREATE TABLE grammar_topics (
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

CREATE INDEX idx_grammar_topics_category ON grammar_topics(category);
CREATE INDEX idx_grammar_topics_level ON grammar_topics(level);

-- Grammar Chunks Table (for search)
CREATE TABLE grammar_chunks (
  id TEXT PRIMARY KEY,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  character_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grammar_chunks_index ON grammar_chunks(chunk_index);

-- Full-text search
ALTER TABLE grammar_chunks ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX idx_grammar_chunks_fts ON grammar_chunks USING gin(fts);
    `);
    console.log(`\n💾 SQL saved to: ${sqlPath}\n`);
    console.log('After creating tables, run this script again.\n');
    return;
  }

  await uploadTopics();
  await uploadChunks();

  console.log('🎉 Upload complete!\n');
}

main().catch(console.error);
