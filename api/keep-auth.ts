import type { VercelRequest, VercelResponse } from '@vercel/node';

// Google OAuth endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Scopes needed for Google Keep
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  // Note: Google Keep doesn't have an official API scope
  // We'll use the memento scope that the unofficial API uses
].join(' ');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'login':
        return handleLogin(req, res);
      case 'callback':
        return handleCallback(req, res);
      case 'status':
        return handleStatus(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Keep auth error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
}

// Step 1: Redirect user to Google OAuth
function handleLogin(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://gojun.vercel.app/auth/callback';

  if (!clientId) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline', // Get refresh token
    prompt: 'consent', // Always show consent screen to get refresh token
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

  // Return the URL for the frontend to redirect to
  return res.status(200).json({ url: authUrl });
}

// Step 2: Handle OAuth callback, exchange code for tokens
async function handleCallback(req: VercelRequest, res: VercelResponse) {
  const { code, error } = req.query;

  if (error) {
    // Redirect to app with error
    return res.redirect(`/?keep_error=${encodeURIComponent(error as string)}`);
  }

  if (!code || typeof code !== 'string') {
    return res.redirect('/?keep_error=No authorization code received');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://gojun.vercel.app/auth/callback';

  if (!clientId || !clientSecret) {
    return res.redirect('/?keep_error=OAuth not configured');
  }

  // Exchange code for tokens
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenResponse.json();

  if (tokens.error) {
    return res.redirect(`/?keep_error=${encodeURIComponent(tokens.error_description || tokens.error)}`);
  }

  // Get user info
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = await userResponse.json();

  // For now, redirect with success and tokens in URL hash (client-side only)
  // In production, you'd store these encrypted in Supabase
  const successParams = new URLSearchParams({
    keep_connected: 'true',
    keep_email: userInfo.email || '',
  });

  // Store tokens in a secure cookie or pass to frontend to store
  // For MVP, we'll let frontend handle storage
  return res.redirect(`/?${successParams.toString()}#keep_tokens=${encodeURIComponent(JSON.stringify({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
    email: userInfo.email,
  }))}`);
}

// Check if user has Keep connected
async function handleStatus(req: VercelRequest, res: VercelResponse) {
  // This would check Supabase for stored tokens
  // For now, return false (frontend will check localStorage)
  return res.status(200).json({ connected: false });
}
