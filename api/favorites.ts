import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    // Route based on method
    switch (req.method) {
      case 'GET':
        return handleGet(supabaseAdmin, user.id, res);
      case 'POST':
        return handlePost(supabaseAdmin, user.id, req.body, res);
      case 'DELETE':
        return handleDelete(supabaseAdmin, user.id, req.body, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Favorites error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error: ' + message });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleGet(supabase: any, userId: string, res: VercelResponse) {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Failed to get favorites' });
  }

  // Group by category
  const grouped = (data || []).reduce((acc: Record<string, unknown[]>, fav: { category?: string }) => {
    const cat = fav.category || 'vocabulary';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(fav);
    return acc;
  }, {});

  return res.status(200).json({ favorites: data || [], grouped });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePost(supabase: any, userId: string, body: any, res: VercelResponse) {
  const { word, reading, english, category } = body || {};

  if (!word || !reading || !english) {
    return res.status(400).json({ error: 'Word, reading, and english are required' });
  }

  // Auto-categorize if not provided
  const finalCategory = category || autoCategorize(word, english);

  const { data, error } = await supabase
    .from('user_favorites')
    .upsert({
      user_id: userId,
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleDelete(supabase: any, userId: string, body: any, res: VercelResponse) {
  const { word } = body || {};

  if (!word) {
    return res.status(400).json({ error: 'Word is required' });
  }

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('word', word);

  if (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Failed to delete favorite' });
  }

  return res.status(200).json({ success: true });
}

function autoCategorize(word: string, english: string): string {
  const lower = english.toLowerCase();

  if (lower.match(/\b(food|eat|drink|rice|fish|meat|vegetable|fruit|water|tea|coffee|meal|breakfast|lunch|dinner)\b/)) {
    return 'food';
  }
  if (lower.match(/\b(cat|dog|bird|fish|animal|pet|cow|horse|pig|chicken)\b/)) {
    return 'animals';
  }
  if (lower.match(/\b(yes|no|please|thank|sorry|excuse|hello|goodbye|good morning|good night|today|tomorrow|yesterday)\b/)) {
    return 'everyday';
  }
  if (lower.match(/\b(time|hour|minute|second|day|week|month|year|morning|afternoon|evening|night|now|later)\b/)) {
    return 'time';
  }
  if (lower.match(/\b(place|home|house|school|work|office|store|shop|restaurant|park|station|airport|hotel)\b/)) {
    return 'places';
  }
  if (lower.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|number|count)\b/) || word.match(/[一二三四五六七八九十]/)) {
    return 'numbers';
  }
  if (lower.match(/\b(family|mother|father|parent|sister|brother|child|children|son|daughter|grandmother|grandfather)\b/)) {
    return 'family';
  }
  if (lower.match(/\b(color|red|blue|green|yellow|black|white|brown|pink|purple|orange)\b/)) {
    return 'colors';
  }
  if (lower.match(/\b(to |ing |ed )\b/) || word.match(/[るうつくぐむぶぬすずます]$/)) {
    return 'verbs';
  }

  return 'vocabulary';
}
