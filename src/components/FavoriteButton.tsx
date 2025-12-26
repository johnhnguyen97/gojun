import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveFavorite, deleteFavorite } from '../services/favoritesApi';

// Grammar-based categories
export const WORD_CATEGORIES = [
  { id: 'noun', label: 'Noun', icon: '名', color: 'from-blue-500 to-blue-600' },
  { id: 'verb-transitive', label: 'Verb (transitive)', icon: '他', color: 'from-green-500 to-green-600' },
  { id: 'verb-intransitive', label: 'Verb (intransitive)', icon: '自', color: 'from-emerald-500 to-emerald-600' },
  { id: 'i-adjective', label: 'い-Adjective', icon: 'い', color: 'from-orange-500 to-orange-600' },
  { id: 'na-adjective', label: 'な-Adjective', icon: 'な', color: 'from-amber-500 to-amber-600' },
  { id: 'adverb', label: 'Adverb', icon: '副', color: 'from-purple-500 to-purple-600' },
  { id: 'particle', label: 'Particle', icon: '助', color: 'from-pink-500 to-pink-600' },
  { id: 'expression', label: 'Expression', icon: '表', color: 'from-red-500 to-red-600' },
  { id: 'other', label: 'Other', icon: '他', color: 'from-gray-500 to-gray-600' },
] as const;

export type WordCategory = typeof WORD_CATEGORIES[number]['id'];

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
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowCategoryMenu(false);
      }
    };
    if (showCategoryMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryMenu]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!session?.access_token || loading) return;

    if (favorited) {
      // If already favorited, remove it
      setLoading(true);
      try {
        await deleteFavorite(word, session.access_token);
        setFavorited(false);
        if (onToggle) onToggle();
      } catch (error) {
        console.error('Failed to remove favorite:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Show category menu to select category before saving
      setShowCategoryMenu(true);
    }
  };

  const handleCategorySelect = async (category: WordCategory) => {
    if (!session?.access_token || loading) return;

    setLoading(true);
    setShowCategoryMenu(false);
    try {
      await saveFavorite(word, reading, english, session.access_token, category);
      setFavorited(true);
      if (onToggle) onToggle();
    } catch (error) {
      console.error('Failed to save favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
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

      {/* Category Selection Menu */}
      {showCategoryMenu && (
        <div className="absolute top-8 right-0 z-50 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-[scaleIn_0.15s_ease-out]">
          <div className="p-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-semibold">
            Select Category
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {WORD_CATEGORIES.map((cat, index) => (
              <button
                key={cat.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCategorySelect(cat.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-lg transition-colors"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <span className={`w-6 h-6 rounded-md bg-gradient-to-br ${cat.color} text-white text-xs font-bold flex items-center justify-center`}>
                  {cat.icon}
                </span>
                <span className="text-gray-700">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
