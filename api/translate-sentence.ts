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

interface GrammarAtom {
  component: string;
  type: string;
  meaning?: string;
}

interface GrammarNote {
  atomicBreakdown?: GrammarAtom[];
}

interface TranslationResult {
  grammarNotes?: GrammarNote[];
  _validationWarnings?: string[];
}

// Known patterns that should ALWAYS be broken down
const COMPOUND_PATTERNS = [
  'ています', 'てます', 'ました', 'ません', 'ませんでした',
  'たい', 'たくない', 'たかった',
  'すぎる', 'すぎた', 'すぎない',
  'やすい', 'にくい',
  'られる', 'られた', 'させる'
];

function validateAtomicBreakdown(result: TranslationResult): string[] {
  const errors: string[] = [];

  if (!result.grammarNotes || result.grammarNotes.length === 0) {
    return errors;
  }

  result.grammarNotes.forEach((note, noteIndex) => {
    if (!note.atomicBreakdown || note.atomicBreakdown.length === 0) {
      return;
    }

    const breakdown = note.atomicBreakdown;

    // Check 1: Must have required fields
    breakdown.forEach((atom, atomIndex) => {
      if (!atom.component || !atom.type) {
        errors.push(`Note ${noteIndex}, atom ${atomIndex}: Missing required fields (component or type)`);
      }
    });

    // Check 2: Detect if components are still grouped (contain multiple morphemes)
    breakdown.forEach((atom, atomIndex) => {
      const comp = atom.component;

      // Check for known compound patterns that weren't broken down
      COMPOUND_PATTERNS.forEach(pattern => {
        if (comp.includes(pattern) && comp !== pattern) {
          errors.push(`Note ${noteIndex}, atom ${atomIndex}: "${comp}" appears to contain compound pattern "${pattern}" - should be broken into separate components`);
        }
      });

      // Check if component has multiple hiragana particles stuck together
      if (/[をがはにのでと]{2,}/.test(comp)) {
        errors.push(`Note ${noteIndex}, atom ${atomIndex}: "${comp}" appears to contain multiple particles - should be separated`);
      }

      // Warn if component is suspiciously long (likely not atomic)
      if (comp.length > 5 && atom.type.includes('verb')) {
        errors.push(`Note ${noteIndex}, atom ${atomIndex}: Verb "${comp}" is ${comp.length} characters - verify it's fully broken down`);
      }
    });

    // Check 3: If only 1 component, it's probably not broken down enough
    if (breakdown.length === 1 && breakdown[0].component.length > 3) {
      errors.push(`Note ${noteIndex}: Only 1 component "${breakdown[0].component}" - compound words should have multiple components`);
    }
  });

  return errors;
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

    let translationResult;
    try {
      translationResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', jsonMatch[0].substring(0, 500));
      return res.status(500).json({ error: 'Failed to parse AI response as JSON' });
    }

    // Validate atomic breakdown structure
    const validationErrors = validateAtomicBreakdown(translationResult);
    if (validationErrors.length > 0) {
      console.warn('Atomic breakdown validation warnings:', validationErrors);
      // Add validation warnings to response for debugging
      translationResult._validationWarnings = validationErrors;
    }

    return res.status(200).json(translationResult);

  } catch (error) {
    console.error('Translation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error: ' + message });
  }
}

function buildTranslationPrompt(sentence: string, parsedWords: unknown[]): string {
  return `Translate to Japanese with word breakdown. Return ONLY valid JSON.

"${sentence}"

{"fullTranslation":"full sentence","wordOrderDisplay":"A → B → Verb","words":[{"english":"meaning","japanese":"日本語","reading":"ひらがな","romaji":"romaji","partOfSpeech":"noun","role":"subject","particleMeaning":""}],"grammarNotes":[{"title":"Point","titleJapanese":"ポイント","explanation":"Brief","atomicBreakdown":[{"component":"に","type":"particle","meaning":"direction/target"},{"component":"なる","type":"verb","meaning":"to become"}]}]}

Rules:
- NATURAL Japanese (drop obvious pronouns like 私)
- Particles as separate entries, role="particle"
- For complex sentences: break into main clauses, keep essential meaning
- Combine related words if needed to keep words array under 15 items
- grammarNotes: max 2 notes, keep explanations under 50 words each
- ATOMIC GRAMMAR BREAKDOWN: CRITICAL - Create a SEPARATE atomicBreakdown entry for EACH grammar pattern/verb/compound word

  DO NOT group things together! Each component must be a SEPARATE array item:

  WRONG: [{"component":"この手のこと","type":"phrase","meaning":"this kind of thing"}]
  CORRECT: [
    {"component":"この","type":"demonstrative","meaning":"this"},
    {"component":"手","type":"noun","meaning":"hand/type/kind"},
    {"component":"の","type":"particle","meaning":"possessive particle"},
    {"component":"こと","type":"noun","meaning":"thing/matter"}
  ]

  WRONG: [{"component":"取りすぎた","type":"verb","meaning":"took too much"}]
  CORRECT: [
    {"component":"取る","type":"verb (dictionary form)","meaning":"to take"},
    {"component":"すぎ","type":"auxiliary verb","meaning":"too much/excessively"},
    {"component":"た","type":"auxiliary verb (past tense)","meaning":"past tense marker"}
  ]

  WRONG: [{"component":"持っています","type":"verb","meaning":"have/am holding"}]
  CORRECT: [
    {"component":"持つ","type":"verb (dictionary form)","meaning":"to hold/have"},
    {"component":"て","type":"conjunctive particle","meaning":"te-form connector"},
    {"component":"います","type":"auxiliary verb","meaning":"present progressive (polite)"}
  ]

  MANDATORY RULES - DO NOT SKIP:
  1. NEVER combine multiple morphemes into one component entry
  2. ALWAYS show dictionary form first, then each suffix/particle separately
  3. EVERY particle (に、を、が、の、て、etc.) = separate entry
  4. EVERY verb suffix (た、ます、ない、たい、すぎる) = separate entry
  5. Label each component's grammatical type clearly
  6. This breakdown is the MOST IMPORTANT part for N5 learners

  ⚠️ VALIDATION - Your response will be automatically validated:
  - Components containing ています, すぎた, たい, etc. must be separated
  - Single-component breakdowns for words >3 chars will trigger warnings
  - Verbs >5 chars will be flagged for verification
  - Missing component/type fields will be rejected

- MUST be valid JSON - no trailing commas, escape quotes properly`;
}
