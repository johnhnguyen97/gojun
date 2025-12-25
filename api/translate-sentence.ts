import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createDecipheriv, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;

function getEncryptionKey(salt: Buffer): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET not set');
  }
  return scryptSync(secret, salt, KEY_LENGTH);
}

function decrypt(data: { encrypted: string; iv: string; authTag: string; salt: string }): string {
  const salt = Buffer.from(data.salt, 'base64');
  const key = getEncryptionKey(salt);
  const iv = Buffer.from(data.iv, 'base64');
  const authTag = Buffer.from(data.authTag, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(data.encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
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
    // Check env vars
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error: Missing Supabase config' });
    }

    if (!process.env.ENCRYPTION_SECRET) {
      return res.status(500).json({ error: 'Server configuration error: Missing encryption secret' });
    }

    // Verify authentication
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

    const { sentence, parsedWords } = req.body || {};

    if (!sentence || typeof sentence !== 'string') {
      return res.status(400).json({ error: 'Sentence is required' });
    }

    // Get user's encrypted API key
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('user_api_keys')
      .select('encrypted_key, iv, auth_tag, salt')
      .eq('user_id', user.id)
      .single();

    if (keyError || !keyData) {
      return res.status(400).json({ error: 'No API key configured. Please add your Anthropic API key in Settings.' });
    }

    // Decrypt the API key
    let apiKey: string;
    try {
      apiKey = decrypt({
        encrypted: keyData.encrypted_key,
        iv: keyData.iv,
        authTag: keyData.auth_tag,
        salt: keyData.salt,
      });
    } catch (decryptError) {
      console.error('Decrypt error:', decryptError);
      return res.status(500).json({ error: 'Failed to decrypt API key' });
    }

    // Build the prompt for Claude
    const prompt = buildTranslationPrompt(sentence, parsedWords);

    // Call Anthropic API with user's key
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json().catch(() => ({}));
      console.error('Anthropic API error:', anthropicResponse.status, errorData);

      if (anthropicResponse.status === 401) {
        return res.status(400).json({ error: 'Invalid API key. Please update your API key in Settings.' });
      }

      return res.status(500).json({ error: 'Failed to get translation from AI: ' + (errorData.error?.message || anthropicResponse.status) });
    }

    const data = await anthropicResponse.json();
    const content = data.content[0]?.text;

    if (!content) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Parse the JSON response from Claude
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Invalid AI response:', content);
      return res.status(500).json({ error: 'Invalid response format from AI' });
    }

    const translationResult = JSON.parse(jsonMatch[0]);
    return res.status(200).json(translationResult);

  } catch (error) {
    console.error('Translation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error: ' + message });
  }
}

function buildTranslationPrompt(sentence: string, parsedWords: unknown[]): string {
  return `You are a Japanese language expert. Translate the following English sentence into Japanese, breaking it down into its grammatical components.

English sentence: "${sentence}"

Parsed words from English: ${JSON.stringify(parsedWords)}

IMPORTANT RULES:
1. Break down the sentence into INDIVIDUAL grammatical units
2. Include particles as SEPARATE entries (は, が, を, に, で, etc.)
3. For verbs, split the stem and auxiliary endings (e.g., "eating" → 食べ + て + いる)
4. Order the words in CORRECT Japanese word order (typically: Subject + Topic-Marker + Object + Object-Marker + Verb)
5. For each word, specify its grammatical role

Return a JSON object with this EXACT structure:
{
  "fullTranslation": "complete Japanese sentence with all particles",
  "wordOrder": ["subject", "topic-marker", "object", "object-marker", "verb"],
  "wordOrderDisplay": "Subject は → Object を → Verb",
  "words": [
    {
      "english": "English word/meaning",
      "japanese": "日本語",
      "reading": "hiragana reading",
      "romaji": "romaji",
      "partOfSpeech": "noun/verb/particle/auxiliary/etc",
      "role": "subject/verb/verb-stem/auxiliary/object/particle/adjective/adverb/other",
      "particle": "associated particle if any",
      "particleMeaning": "what the particle means",
      "particleExplanation": "detailed explanation of the particle's function"
    }
  ],
  "grammarNotes": [
    {
      "title": "Grammar Point",
      "titleJapanese": "文法ポイント",
      "explanation": "Explanation of the grammar pattern used",
      "example": "Example sentence",
      "exampleTranslation": "Translation of example"
    }
  ]
}

CRITICAL:
- Particles MUST be separate entries with role="particle"
- Verb conjugation endings MUST be separate entries with role="auxiliary"
- The "words" array should be in the correct Japanese sentence order
- Include ALL particles needed for the sentence

Return ONLY the JSON object, no other text.`;
}
