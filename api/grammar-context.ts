import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface GrammarTopic {
  id: string;
  pattern: string;
  name: string;
  name_japanese: string | null;
  category: string;
  description: string | null;
  usage: string | null;
  examples: Array<{ japanese: string; reading: string; english: string }> | null;
  conjugation: Record<string, string> | null;
  notes: string | null;
}

// Cache for topics
let topicsCache: GrammarTopic[] | null = null;

async function getTopics(supabase: ReturnType<typeof createClient>): Promise<GrammarTopic[]> {
  if (topicsCache) return topicsCache;

  const { data, error } = await supabase
    .from('grammar_topics')
    .select('*');

  if (error) {
    console.error('Error fetching topics:', error);
    return [];
  }

  topicsCache = data || [];
  return topicsCache;
}

function findRelevantTopics(text: string, topics: GrammarTopic[]): GrammarTopic[] {
  const scored = topics.map(topic => {
    let score = 0;

    // Direct pattern match
    if (text.includes(topic.pattern)) {
      score += 10;
    }

    // Check conjugation patterns
    if (topic.conjugation) {
      for (const [, value] of Object.entries(topic.conjugation)) {
        const patterns = value.match(/[ぁ-んァ-ン一-龯]+/g) || [];
        for (const pat of patterns) {
          if (pat.length > 1 && text.includes(pat)) {
            score += 2;
          }
        }
      }
    }

    return { topic, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(s => s.topic);
}

function buildGrammarContext(topics: GrammarTopic[]): string {
  if (topics.length === 0) return '';

  let context = '\n\n=== GRAMMAR REFERENCE (Use these rules for accurate breakdown) ===\n\n';

  for (const topic of topics) {
    context += `【${topic.pattern}】 ${topic.name}`;
    if (topic.name_japanese) context += ` (${topic.name_japanese})`;
    context += '\n';

    if (topic.description) {
      context += `  → ${topic.description}\n`;
    }

    if (topic.usage) {
      context += `  Usage: ${topic.usage}\n`;
    }

    if (topic.conjugation) {
      const entries = Object.entries(topic.conjugation).slice(0, 3);
      for (const [key, value] of entries) {
        context += `  • ${key}: ${value}\n`;
      }
    }

    if (topic.examples && topic.examples.length > 0) {
      const ex = topic.examples[0];
      context += `  Example: ${ex.japanese} = "${ex.english}"\n`;
    }

    if (topic.notes) {
      context += `  Note: ${topic.notes}\n`;
    }

    context += '\n';
  }

  context += '=== END GRAMMAR REFERENCE ===\n';
  return context;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Missing Supabase config' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { japaneseText } = req.body;

    if (!japaneseText) {
      return res.status(400).json({ error: 'japaneseText is required' });
    }

    const topics = await getTopics(supabase);
    const relevant = findRelevantTopics(japaneseText, topics);
    const context = buildGrammarContext(relevant);

    return res.status(200).json({
      context,
      topicsFound: relevant.length,
      topics: relevant.map(t => ({
        id: t.id,
        pattern: t.pattern,
        name: t.name,
      })),
    });

  } catch (error) {
    console.error('Grammar context error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}
