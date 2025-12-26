import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createCipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;

function getEncryptionKey(salt: Buffer): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET not set');
  }
  return scryptSync(secret, salt, KEY_LENGTH);
}

function encrypt(plaintext: string) {
  const salt = randomBytes(SALT_LENGTH);
  const key = getEncryptionKey(salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    salt: salt.toString('base64'),
  };
}

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

    switch (req.method) {
      case 'GET':
        return handleCheck(supabaseAdmin, user.id, res);
      case 'POST':
        return handleSave(supabaseAdmin, user.id, req.body, res);
      case 'DELETE':
        return handleDelete(supabaseAdmin, user.id, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('API key error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error: ' + message });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCheck(supabase: any, userId: string, res: VercelResponse) {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  return res.status(200).json({ hasApiKey: !!data });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSave(supabase: any, userId: string, body: any, res: VercelResponse) {
  if (!process.env.ENCRYPTION_SECRET) {
    return res.status(500).json({ error: 'Server configuration error: Missing encryption secret' });
  }

  const { apiKey } = body || {};

  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'API key is required' });
  }

  if (!apiKey.startsWith('sk-ant-')) {
    return res.status(400).json({ error: 'Invalid API key format. Must start with sk-ant-' });
  }

  // Validate API key by making a test request to Anthropic
  const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'Hi' }],
    }),
  });

  if (testResponse.status === 401) {
    return res.status(400).json({ error: 'Invalid API key - authentication failed with Anthropic' });
  }

  // Encrypt the API key
  const encryptedData = encrypt(apiKey);

  const { error: dbError } = await supabase
    .from('user_api_keys')
    .upsert({
      user_id: userId,
      encrypted_key: encryptedData.encrypted,
      iv: encryptedData.iv,
      auth_tag: encryptedData.authTag,
      salt: encryptedData.salt,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (dbError) {
    console.error('Database error:', dbError);
    return res.status(500).json({ error: 'Failed to save API key: ' + dbError.message });
  }

  return res.status(200).json({ success: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleDelete(supabase: any, userId: string, res: VercelResponse) {
  const { error: dbError } = await supabase
    .from('user_api_keys')
    .delete()
    .eq('user_id', userId);

  if (dbError) {
    console.error('Database error:', dbError);
    return res.status(500).json({ error: 'Failed to delete API key' });
  }

  return res.status(200).json({ success: true });
}
