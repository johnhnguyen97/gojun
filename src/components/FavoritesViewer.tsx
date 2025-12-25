import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFavorites, deleteFavorite, type Favorite } from '../services/favoritesApi';

interface FavoritesViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FavoritesViewer({ isOpen, onClose }: FavoritesViewerProps) {
  const { session } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Favorite[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isOpen && session?.access_token) {
      loadFavorites();
    }
  }, [isOpen, session]);

  const loadFavorites = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getFavorites(session.access_token);
      setFavorites(data.favorites);
      setGrouped(data.grouped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (word: string) => {
    if (!session?.access_token) return;

    try {
      await deleteFavorite(word, session.access_token);
      await loadFavorites();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete favorite');
    }
  };

  if (!isOpen) return null;

  const categories = Object.keys(grouped).sort();
  const displayFavorites = selectedCategory === 'all'
    ? favorites
    : grouped[selectedCategory] || [];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">Favorite Words</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 active:bg-gray-100 rounded-full"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Category Filter */}
          <div className="px-3 py-2 border-b border-gray-200 overflow-x-auto">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                }`}
              >
                All ({favorites.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)} ({grouped[cat]?.length || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading favorites...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">{error}</div>
            ) : displayFavorites.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No favorites yet</p>
                <p className="text-sm">Click the ★ icon on words to save them here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayFavorites.map((fav) => (
                  <div key={fav.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-semibold text-gray-900">{fav.word}</span>
                        <span className="text-sm text-gray-500">{fav.reading}</span>
                      </div>
                      <div className="text-sm text-gray-700 mt-0.5">{fav.english}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="px-2 py-0.5 bg-gray-200 rounded">
                          {fav.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(fav.word)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded active:bg-red-100"
                      title="Remove favorite"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
