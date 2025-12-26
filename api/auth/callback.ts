import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://gojun.vercel.app/auth/callback';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query;

  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error);
    return res.redirect(`/?google_error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.redirect('/?google_error=no_code');
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration');
    return res.redirect('/?google_error=server_config');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
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
      console.error('Invalid session:', authError);
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
  } catch (err) {
    console.error('Google callback error:', err);
    return res.redirect('/?google_error=unknown');
  }
}
