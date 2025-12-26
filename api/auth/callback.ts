import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GPSOAuth } from 'gpsoauth-js';

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
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://gojun.vercel.app/api/auth/callback';

  if (!clientId || !clientSecret) {
    return res.redirect('/?keep_error=OAuth not configured');
  }

  try {
    // Step 1: Exchange authorization code for OAuth tokens
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

    // Step 2: Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userResponse.json();
    const email = userInfo.email;

    // Step 3: Exchange OAuth token for master token using gpsoauth
    console.log('Exchanging OAuth token for master token...');
    const masterTokenResult = await GPSOAuth.exchangeToken(email, tokens.access_token);

    if (masterTokenResult.error) {
      console.error('Master token exchange error:', masterTokenResult.error);
      // Fall back to just OAuth token (won't work for Keep API but at least user is connected)
      const tokenData = JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        email: email,
        master_token: null,
        keep_auth: null,
      });
      return res.redirect(`/?keep_connected=true&keep_warning=master_token_failed#keep_tokens=${encodeURIComponent(tokenData)}`);
    }

    // Step 4: Use master token to get Keep-specific auth token
    console.log('Getting Keep auth token...');
    const keepAuthResult = await GPSOAuth.performOAuth(email, masterTokenResult.masterToken!, {
      service: 'oauth2:https://www.googleapis.com/auth/memento',
      app: 'com.google.android.keep',
      clientSig: '38918a453d07199354f8b19af05ec6562ced5788',
    });

    if (keepAuthResult.error) {
      console.error('Keep auth error:', keepAuthResult.error);
      // Return with master token but no Keep auth
      const tokenData = JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        email: email,
        master_token: masterTokenResult.masterToken,
        keep_auth: null,
      });
      return res.redirect(`/?keep_connected=true&keep_warning=keep_auth_failed#keep_tokens=${encodeURIComponent(tokenData)}`);
    }

    // Success! We have full Keep access
    const tokenData = JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      email: email,
      master_token: masterTokenResult.masterToken,
      keep_auth: keepAuthResult.auth,
    });

    return res.redirect(`/?keep_connected=true#keep_tokens=${encodeURIComponent(tokenData)}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.redirect(`/?keep_error=${encodeURIComponent('Authentication failed: ' + (err instanceof Error ? err.message : 'Unknown error'))}`);
  }
}
