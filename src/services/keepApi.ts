/**
 * Google Keep API Service
 * Handles OAuth flow and Keep sync operations
 */

const KEEP_TOKENS_KEY = 'gojun-keep-tokens';

export interface KeepTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  email: string;
  master_token?: string | null;
  keep_auth?: string | null;
  stored_at?: number;
}

export interface KeepNote {
  id: string;
  title: string;
  content: string;
  color?: string;
  labels?: string[];
  pinned?: boolean;
  archived?: boolean;
  trashed?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Start Google OAuth flow
 */
export async function connectKeep(): Promise<void> {
  try {
    const response = await fetch('/api/keep-auth?action=login');
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (data.url) {
      // Redirect to Google OAuth
      window.location.href = data.url;
    }
  } catch (error) {
    console.error('Failed to start Keep OAuth:', error);
    throw error;
  }
}

/**
 * Handle OAuth callback - parse tokens from URL
 */
export function handleKeepCallback(): KeepTokens | null {
  const url = new URL(window.location.href);

  // Check for error
  const error = url.searchParams.get('keep_error');
  if (error) {
    console.error('Keep OAuth error:', error);
    // Clean up URL
    url.searchParams.delete('keep_error');
    window.history.replaceState({}, '', url.pathname + url.search);
    throw new Error(error);
  }

  // Check for success
  const connected = url.searchParams.get('keep_connected');
  if (connected === 'true') {
    // Parse tokens from hash
    const hash = window.location.hash;
    const tokensMatch = hash.match(/keep_tokens=([^&]+)/);

    if (tokensMatch) {
      try {
        const tokens: KeepTokens = JSON.parse(decodeURIComponent(tokensMatch[1]));
        tokens.stored_at = Date.now();

        // Store tokens
        localStorage.setItem(KEEP_TOKENS_KEY, JSON.stringify(tokens));

        // Clean up URL
        url.searchParams.delete('keep_connected');
        url.searchParams.delete('keep_email');
        window.history.replaceState({}, '', url.pathname + url.search.replace(/\?$/, ''));

        return tokens;
      } catch (e) {
        console.error('Failed to parse Keep tokens:', e);
      }
    }
  }

  return null;
}

/**
 * Get stored Keep tokens
 */
export function getKeepTokens(): KeepTokens | null {
  const stored = localStorage.getItem(KEEP_TOKENS_KEY);
  if (!stored) return null;

  try {
    const tokens: KeepTokens = JSON.parse(stored);

    // Check if expired (with 5 min buffer)
    if (tokens.stored_at && tokens.expires_in) {
      const expiresAt = tokens.stored_at + (tokens.expires_in * 1000) - (5 * 60 * 1000);
      if (Date.now() > expiresAt) {
        // Token expired - would need to refresh
        // For now, just return null to trigger re-auth
        console.log('Keep token expired');
        return null;
      }
    }

    return tokens;
  } catch {
    return null;
  }
}

/**
 * Check if Keep is connected
 */
export function isKeepConnected(): boolean {
  return getKeepTokens() !== null;
}

/**
 * Check if Keep has full API access (has keep_auth token)
 */
export function hasKeepApiAccess(): boolean {
  const tokens = getKeepTokens();
  return tokens?.keep_auth != null;
}

/**
 * Get connected Keep email
 */
export function getKeepEmail(): string | null {
  const tokens = getKeepTokens();
  return tokens?.email || null;
}

/**
 * Disconnect Keep
 */
export function disconnectKeep(): void {
  localStorage.removeItem(KEEP_TOKENS_KEY);
}

/**
 * Fetch notes from Google Keep
 * Note: This uses the unofficial Keep API endpoints
 */
export async function fetchKeepNotes(): Promise<KeepNote[]> {
  const tokens = getKeepTokens();
  if (!tokens) {
    throw new Error('Not connected to Google Keep');
  }

  if (!tokens.keep_auth) {
    throw new Error('No Keep API access - master token exchange may have failed');
  }

  // The unofficial Keep API endpoint using the Keep-specific auth token
  const response = await fetch('https://www.googleapis.com/notes/v1/changes', {
    method: 'POST',
    headers: {
      'Authorization': `OAuth ${tokens.keep_auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nodes: [],
      requestHeader: {
        clientSessionId: `gojun-${Date.now()}`,
        clientPlatform: 'WEB',
        capabilities: [
          { type: 'NC' }, // Color
          { type: 'PI' }, // Pinned
          { type: 'LB' }, // Labels
          { type: 'AN' }, // Annotations
          { type: 'SH' }, // Sharing
          { type: 'TR' }, // Trash
        ],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Keep API error:', error);
    throw new Error(`Failed to fetch notes: ${response.status}`);
  }

  const data = await response.json();

  // Parse the Keep response into our note format
  // This will need adjustment based on actual API response
  const notes: KeepNote[] = [];

  if (data.nodes) {
    for (const node of data.nodes) {
      if (node.type === 'NOTE' && !node.trashed) {
        notes.push({
          id: node.id,
          title: node.title || '',
          content: node.text || '',
          color: node.color,
          pinned: node.pinned,
          archived: node.archived,
          trashed: node.trashed,
          created_at: node.timestamps?.created,
          updated_at: node.timestamps?.updated,
        });
      }
    }
  }

  return notes;
}

/**
 * Create a note in Google Keep
 */
export async function createKeepNote(title: string, content: string): Promise<KeepNote> {
  const tokens = getKeepTokens();
  if (!tokens) {
    throw new Error('Not connected to Google Keep');
  }

  if (!tokens.keep_auth) {
    throw new Error('No Keep API access - master token exchange may have failed');
  }

  const noteId = `gojun-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const response = await fetch('https://www.googleapis.com/notes/v1/changes', {
    method: 'POST',
    headers: {
      'Authorization': `OAuth ${tokens.keep_auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nodes: [{
        id: noteId,
        type: 'NOTE',
        title,
        text: content,
        timestamps: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
      }],
      requestHeader: {
        clientSessionId: `gojun-${Date.now()}`,
        clientPlatform: 'WEB',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create note: ${response.status}`);
  }

  return {
    id: noteId,
    title,
    content,
    created_at: new Date().toISOString(),
  };
}
