import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// Hardcoded to match Google Cloud Console - don't use env var to avoid mismatch
const GOOGLE_REDIRECT_URI = 'https://gojun.vercel.app/api/google-auth?action=callback';

// Scopes for Calendar and Tasks
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
  'openid',
  'email',
  'profile'
].join(' ');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    switch (action) {
      case 'authorize':
        return handleAuthorize(req, res);
      case 'callback':
        return handleCallback(req, res, supabase);
      case 'status':
        return handleStatus(req, res, supabase);
      case 'disconnect':
        return handleDisconnect(req, res, supabase);
      case 'refresh':
        return handleRefresh(req, res, supabase);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Google Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Start OAuth flow - redirect to Google
function handleAuthorize(req: VercelRequest, res: VercelResponse) {
  const { state } = req.query; // state contains the user's Supabase token

  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI!);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  if (state) authUrl.searchParams.set('state', state as string);

  return res.redirect(authUrl.toString());
}

// Handle OAuth callback from Google
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCallback(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`/?google_error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.redirect('/?google_error=no_code');
  }

  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      code: code as string,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_REDIRECT_URI!,
    }),
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    console.error('Token exchange failed:', err);
    return res.redirect('/?google_error=token_exchange_failed');
  }

  const tokens = await tokenResponse.json();

  // Get user info from Google
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const userInfo = await userInfoResponse.json();

  // Get Supabase user from state (JWT token)
  if (!state) {
    return res.redirect('/?google_error=no_state');
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(state as string);
  if (authError || !user) {
    return res.redirect('/?google_error=invalid_session');
  }

  // Store tokens in database
  const { error: dbError } = await supabase
    .from('user_google_tokens')
    .upsert({
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      google_email: userInfo.email,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (dbError) {
    console.error('Failed to store tokens:', dbError);
    return res.redirect('/?google_error=storage_failed');
  }

  // Redirect back to app with success
  return res.redirect('/?google_connected=true');
}

// Check if user has Google connected
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleStatus(req: VercelRequest, res: VercelResponse, supabase: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { data } = await supabase
    .from('user_google_tokens')
    .select('google_email, expires_at')
    .eq('user_id', user.id)
    .single();

  return res.status(200).json({
    connected: !!data,
    email: data?.google_email || null,
    expiresAt: data?.expires_at || null,
  });
}

// Disconnect Google account
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleDisconnect(req: VercelRequest, res: VercelResponse, supabase: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Get tokens to revoke
  const { data: tokenData } = await supabase
    .from('user_google_tokens')
    .select('access_token')
    .eq('user_id', user.id)
    .single();

  // Revoke token at Google
  if (tokenData?.access_token) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenData.access_token}`, {
      method: 'POST',
    });
  }

  // Delete from database
  await supabase
    .from('user_google_tokens')
    .delete()
    .eq('user_id', user.id);

  return res.status(200).json({ success: true });
}

// Refresh access token
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRefresh(req: VercelRequest, res: VercelResponse, supabase: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { data: tokenData } = await supabase
    .from('user_google_tokens')
    .select('refresh_token')
    .eq('user_id', user.id)
    .single();

  if (!tokenData?.refresh_token) {
    return res.status(400).json({ error: 'No refresh token' });
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: tokenData.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    return res.status(400).json({ error: 'Failed to refresh token' });
  }

  const tokens = await tokenResponse.json();

  await supabase
    .from('user_google_tokens')
    .update({
      access_token: tokens.access_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  return res.status(200).json({ success: true });
}
