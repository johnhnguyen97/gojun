export interface Favorite {
  id: string;
  user_id: string;
  word: string;
  reading: string;
  english: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const API_BASE = import.meta.env.DEV ? 'http://localhost:5173/api' : '/api';

export async function saveFavorite(
  word: string,
  reading: string,
  english: string,
  token: string,
  category?: string
): Promise<Favorite> {
  const response = await fetch(`${API_BASE}/save-favorite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ word, reading, english, category })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to save favorite' }));
    throw new Error(error.error || 'Failed to save favorite');
  }

  const data = await response.json();
  return data.favorite;
}

export async function getFavorites(token: string): Promise<{ favorites: Favorite[]; grouped: Record<string, Favorite[]> }> {
  const response = await fetch(`${API_BASE}/get-favorites`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get favorites' }));
    throw new Error(error.error || 'Failed to get favorites');
  }

  return response.json();
}

export async function deleteFavorite(word: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/delete-favorite`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ word })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete favorite' }));
    throw new Error(error.error || 'Failed to delete favorite');
  }
}
