import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.substring(7);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { word, reading, english, category } = req.body || {};

    if (!word || !reading || !english) {
      return res.status(400).json({ error: 'Word, reading, and english are required' });
    }

    // Auto-categorize if not provided
    let finalCategory = category;
    if (!finalCategory) {
      finalCategory = await autoCategorize(word, english);
    }

    // Insert or update favorite
    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .upsert({
        user_id: user.id,
        word,
        reading,
        english,
        category: finalCategory,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,word',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to save favorite' });
    }

    return res.status(200).json({ success: true, favorite: data });

  } catch (error) {
    console.error('Save favorite error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error: ' + message });
  }
}

async function autoCategorize(word: string, english: string): Promise<string> {
  const lower = english.toLowerCase();

  // Food words
  if (lower.match(/\b(food|eat|drink|rice|fish|meat|vegetable|fruit|water|tea|coffee|meal|breakfast|lunch|dinner)\b/)) {
    return 'food';
  }

  // Animals
  if (lower.match(/\b(cat|dog|bird|fish|animal|pet|cow|horse|pig|chicken)\b/)) {
    return 'animals';
  }

  // Everyday words
  if (lower.match(/\b(yes|no|please|thank|sorry|excuse|hello|goodbye|good morning|good night|today|tomorrow|yesterday)\b/)) {
    return 'everyday';
  }

  // Time words
  if (lower.match(/\b(time|hour|minute|second|day|week|month|year|morning|afternoon|evening|night|now|later)\b/)) {
    return 'time';
  }

  // Location/places
  if (lower.match(/\b(place|home|house|school|work|office|store|shop|restaurant|park|station|airport|hotel)\b/)) {
    return 'places';
  }

  // Numbers
  if (lower.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|number|count)\b/) || word.match(/[一二三四五六七八九十]/)) {
    return 'numbers';
  }

  // Family
  if (lower.match(/\b(family|mother|father|parent|sister|brother|child|children|son|daughter|grandmother|grandfather)\b/)) {
    return 'family';
  }

  // Colors
  if (lower.match(/\b(color|red|blue|green|yellow|black|white|brown|pink|purple|orange)\b/)) {
    return 'colors';
  }

  // Check if it's a verb (common verb endings)
  if (lower.match(/\b(to |ing |ed )\b/) || word.match(/[るうつくぐむぶぬすずます]$/)) {
    return 'verbs';
  }

  // Default to vocabulary
  return 'vocabulary';
}
