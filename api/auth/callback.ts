import type { VercelRequest, VercelResponse } from '@vercel/node';

// Google OAuth token endpoint
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error } = req.query;

  // Handle OAuth errors
  if (error) {
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

  try {
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
      console.error('Token exchange error:', tokens);
      return res.redirect(`/?keep_error=${encodeURIComponent(tokens.error_description || tokens.error)}`);
    }

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userResponse.json();

    // Redirect with success - tokens in URL hash (only accessible client-side)
    const tokenData = JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      email: userInfo.email,
    });

    return res.redirect(`/?keep_connected=true#keep_tokens=${encodeURIComponent(tokenData)}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.redirect(`/?keep_error=${encodeURIComponent('Authentication failed')}`);
  }
}
