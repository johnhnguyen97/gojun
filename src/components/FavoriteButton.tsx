import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveFavorite, deleteFavorite } from '../services/favoritesApi';

interface FavoriteButtonProps {
  word: string;
  reading: string;
  english: string;
  isFavorited: boolean;
  onToggle?: () => void;
}

export function FavoriteButton({ word, reading, english, isFavorited, onToggle }: FavoriteButtonProps) {
  const { session } = useAuth();
  const [favorited, setFavorited] = useState(isFavorited);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click handlers

    if (!session?.access_token || loading) return;

    setLoading(true);
    try {
      if (favorited) {
        await deleteFavorite(word, session.access_token);
        setFavorited(false);
      } else {
        await saveFavorite(word, reading, english, session.access_token);
        setFavorited(true);
      }
      if (onToggle) onToggle();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="absolute top-1 right-1 p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors z-10"
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
      disabled={loading}
    >
      {loading ? (
        <span className="w-4 h-4 block animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></span>
      ) : (
        <svg
          className="w-4 h-4"
          fill={favorited ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: favorited ? '#fbbf24' : '#9ca3af' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      )}
    </button>
  );
}
