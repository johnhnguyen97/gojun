import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFavorites, deleteFavorite, type Favorite } from '../services/favoritesApi';
import { WORD_CATEGORIES } from './FavoriteButton';

interface FavoritesViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Get category styling
const getCategoryStyle = (categoryId: string) => {
  const cat = WORD_CATEGORIES.find(c => c.id === categoryId);
  return cat || { id: categoryId, label: categoryId.charAt(0).toUpperCase() + categoryId.slice(1), icon: '?', color: 'from-gray-500 to-gray-600' };
};

// Category order for sorting
const CATEGORY_ORDER = WORD_CATEGORIES.map(c => c.id as string);

export function FavoritesViewer({ isOpen, onClose }: FavoritesViewerProps) {
  const { session } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Favorite[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      if (session?.access_token) {
        loadFavorites();
      }
    }
  }, [isOpen, session]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

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

  // Sort categories by the order defined in WORD_CATEGORIES
  const categories = Object.keys(grouped).sort((a, b) => {
    const aIdx = CATEGORY_ORDER.indexOf(a);
    const bIdx = CATEGORY_ORDER.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  const displayFavorites = selectedCategory === 'all'
    ? favorites
    : grouped[selectedCategory] || [];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-200 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-4 md:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                ★
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold">Favorite Words</h2>
                <p className="text-white/80 text-xs md:text-sm">{favorites.length} saved words</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all hover:rotate-90 duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-white text-amber-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                All ({favorites.length})
              </button>
              {categories.map(cat => {
                const style = getCategoryStyle(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
                      selectedCategory === cat
                        ? 'bg-white text-amber-600 shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center ${
                      selectedCategory === cat ? `bg-gradient-to-br ${style.color} text-white` : 'bg-white/30'
                    }`}>
                      {style.icon}
                    </span>
                    {style.label} ({grouped[cat]?.length || 0})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-amber-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : displayFavorites.length === 0 ? (
            <div className="empty-state py-12">
              <div className="empty-state-icon">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <p className="empty-state-title">No favorites yet</p>
              <p className="empty-state-subtitle">Click the ★ icon on words to save them here</p>
            </div>
          ) : (
            <div className="space-y-2 stagger-children">
              {displayFavorites.map((fav) => {
                const catStyle = getCategoryStyle(fav.category);
                return (
                  <div
                    key={fav.id}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-lg hover:border-amber-200 transition-all group"
                  >
                    {/* Category Icon */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${catStyle.color} text-white font-bold flex items-center justify-center text-sm shrink-0`}>
                      {catStyle.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xl font-bold text-gray-900">{fav.word}</span>
                        <span className="text-sm text-gray-500">{fav.reading}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{fav.english}</div>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${catStyle.color} text-white`}>
                          {catStyle.label}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(fav.word)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Remove favorite"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
