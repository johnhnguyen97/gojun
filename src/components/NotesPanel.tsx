import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFavorites, deleteFavorite, type Favorite } from '../services/favoritesApi';
import { WORD_CATEGORIES } from './FavoriteButton';

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'favorites' | 'notes';

// Notion-style note page
interface NotePage {
  id: string;
  title: string;
  icon: string;
  blocks: NoteBlock[];
  created_at: string;
  updated_at: string;
}

interface NoteBlock {
  id: string;
  type: 'text' | 'heading' | 'bullet' | 'divider' | 'word';
  content: string;
  // For word blocks
  word?: string;
  reading?: string;
  english?: string;
}

const ICONS = ['📝', '📚', '🎯', '💡', '⭐', '🔥', '📖', '✨', '🌸', '🗾', '🎌', '📌'];

const getCategoryStyle = (categoryId: string) => {
  const cat = WORD_CATEGORIES.find(c => c.id === categoryId);
  return cat || { id: categoryId, label: categoryId.charAt(0).toUpperCase() + categoryId.slice(1), icon: '?', color: 'from-gray-500 to-gray-600' };
};

const CATEGORY_ORDER = WORD_CATEGORIES.map(c => c.id as string);

export function NotesPanel({ isOpen, onClose }: NotesPanelProps) {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('favorites');
  const [isVisible, setIsVisible] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Favorite[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);

  // Notes state
  const [pages, setPages] = useState<NotePage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      if (session?.access_token) {
        loadFavorites();
      }
      loadPages();
    }
  }, [isOpen, session]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  // Favorites
  const loadFavorites = async () => {
    if (!session?.access_token) return;
    setFavoritesLoading(true);
    setFavoritesError(null);
    try {
      const data = await getFavorites(session.access_token);
      setFavorites(data.favorites);
      setGrouped(data.grouped);
    } catch (err) {
      setFavoritesError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setFavoritesLoading(false);
    }
  };

  const handleDeleteFavorite = async (word: string) => {
    if (!session?.access_token) return;
    try {
      await deleteFavorite(word, session.access_token);
      await loadFavorites();
    } catch (err) {
      setFavoritesError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  // Pages (Notion-style)
  const loadPages = () => {
    const stored = localStorage.getItem('gojun-note-pages');
    if (stored) {
      setPages(JSON.parse(stored));
    }
  };

  const savePages = (updatedPages: NotePage[]) => {
    localStorage.setItem('gojun-note-pages', JSON.stringify(updatedPages));
    setPages(updatedPages);
  };

  const createPage = () => {
    const newPage: NotePage = {
      id: Date.now().toString(),
      title: 'Untitled',
      icon: '📝',
      blocks: [{ id: '1', type: 'text', content: '' }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    savePages([newPage, ...pages]);
    setSelectedPageId(newPage.id);
  };

  const updatePage = (pageId: string, updates: Partial<NotePage>) => {
    const updated = pages.map(p =>
      p.id === pageId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    );
    savePages(updated);
  };

  const deletePage = (pageId: string) => {
    savePages(pages.filter(p => p.id !== pageId));
    if (selectedPageId === pageId) {
      setSelectedPageId(null);
    }
  };

  const selectedPage = pages.find(p => p.id === selectedPageId);

  if (!isOpen) return null;

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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <div
        className={`relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-200 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 md:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                📝
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold">Notes</h2>
                <p className="text-white/80 text-xs md:text-sm">
                  {activeTab === 'favorites' ? `${favorites.length} saved words` : `${pages.length} pages`}
                </p>
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

          {/* Tabs */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => { setActiveTab('favorites'); setSelectedPageId(null); }}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'favorites'
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <span>★</span> Favorites
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'notes'
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <span>📄</span> My Notes
            </button>
          </div>

          {/* Category filter for favorites */}
          {activeTab === 'favorites' && categories.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === 'all' ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
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
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
                      selectedCategory === cat ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    <span className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center bg-white/20">
                      {style.icon}
                    </span>
                    {grouped[cat]?.length || 0}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'favorites' ? (
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
              {favoritesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                  </div>
                </div>
              ) : favoritesError ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-600 font-medium">{favoritesError}</p>
                </div>
              ) : displayFavorites.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
                    <span className="text-4xl">★</span>
                  </div>
                  <p className="text-gray-600 font-medium">No favorites yet</p>
                  <p className="text-gray-400 text-sm mt-1">Click the ★ on words to save them</p>
                </div>
              ) : (
                <div className="space-y-2 stagger-children">
                  {displayFavorites.map((fav) => {
                    const catStyle = getCategoryStyle(fav.category);
                    return (
                      <div
                        key={fav.id}
                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xl font-bold text-gray-900">{fav.word}</span>
                            <span className="text-sm text-gray-500">{fav.reading}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r ${catStyle.color} text-white`}>
                              {catStyle.label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">{fav.english}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteFavorite(fav.word)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
          ) : (
            // Notion-style Notes
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar - Page List */}
              <div className={`${selectedPageId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-64 border-r border-gray-200 bg-gray-50/50`}>
                <div className="p-3 border-b border-gray-200">
                  <button
                    onClick={createPage}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Page
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {pages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">📄</span>
                      </div>
                      <p className="text-gray-500 text-sm">No pages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {pages.map((page) => (
                        <button
                          key={page.id}
                          onClick={() => setSelectedPageId(page.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all group ${
                            selectedPageId === page.id
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <span className="text-lg">{page.icon}</span>
                          <span className="flex-1 truncate text-sm font-medium">{page.title || 'Untitled'}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePage(page.id);
                            }}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Page Editor */}
              {selectedPage ? (
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                  {/* Back button on mobile */}
                  <div className="md:hidden p-2 border-b border-gray-200">
                    <button
                      onClick={() => setSelectedPageId(null)}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                  </div>

                  {/* Page Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      {/* Icon Picker */}
                      <div className="relative">
                        <button
                          onClick={() => setShowIconPicker(!showIconPicker)}
                          className="text-4xl hover:bg-gray-100 rounded-lg p-2 transition-all"
                        >
                          {selectedPage.icon}
                        </button>
                        {showIconPicker && (
                          <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-xl shadow-xl border border-gray-200 grid grid-cols-6 gap-1 z-10">
                            {ICONS.map(icon => (
                              <button
                                key={icon}
                                onClick={() => {
                                  updatePage(selectedPage.id, { icon });
                                  setShowIconPicker(false);
                                }}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-lg"
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <input
                        type="text"
                        value={selectedPage.title}
                        onChange={(e) => updatePage(selectedPage.id, { title: e.target.value })}
                        placeholder="Untitled"
                        className="flex-1 text-3xl font-bold text-gray-900 bg-transparent outline-none placeholder-gray-300"
                      />
                    </div>
                  </div>

                  {/* Blocks Editor */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <NotionBlocks
                      blocks={selectedPage.blocks}
                      onChange={(blocks) => updatePage(selectedPage.id, { blocks })}
                    />
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50/50">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <span className="text-4xl">📄</span>
                    </div>
                    <p className="text-gray-500">Select or create a page</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Notion-style block editor
function NotionBlocks({ blocks, onChange }: { blocks: NoteBlock[]; onChange: (blocks: NoteBlock[]) => void }) {
  const addBlock = (afterId: string, type: NoteBlock['type'] = 'text') => {
    const index = blocks.findIndex(b => b.id === afterId);
    const newBlock: NoteBlock = {
      id: Date.now().toString(),
      type,
      content: ''
    };
    const updated = [...blocks];
    updated.splice(index + 1, 0, newBlock);
    onChange(updated);
  };

  const updateBlock = (id: string, content: string) => {
    onChange(blocks.map(b => b.id === id ? { ...b, content } : b));
  };

  const changeBlockType = (id: string, type: NoteBlock['type']) => {
    onChange(blocks.map(b => b.id === id ? { ...b, type } : b));
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) return;
    onChange(blocks.filter(b => b.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent, block: NoteBlock) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock(block.id);
    }
    if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(block.id);
    }
  };

  return (
    <div className="space-y-1">
      {blocks.map((block) => (
        <div key={block.id} className="group flex items-start gap-2">
          {/* Block handle & type menu */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pt-1">
            <button
              onClick={() => addBlock(block.id)}
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
              title="Add block"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <select
              value={block.type}
              onChange={(e) => changeBlockType(block.id, e.target.value as NoteBlock['type'])}
              className="p-1 text-xs bg-transparent text-gray-400 hover:text-gray-600 cursor-pointer outline-none"
            >
              <option value="text">Text</option>
              <option value="heading">Heading</option>
              <option value="bullet">• Bullet</option>
              <option value="divider">—</option>
            </select>
          </div>

          {/* Block content */}
          <div className="flex-1">
            {block.type === 'divider' ? (
              <div className="py-3">
                <hr className="border-gray-200" />
              </div>
            ) : block.type === 'heading' ? (
              <input
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, block)}
                placeholder="Heading"
                className="w-full text-xl font-bold text-gray-900 bg-transparent outline-none placeholder-gray-300 py-1"
              />
            ) : block.type === 'bullet' ? (
              <div className="flex items-start gap-2 py-1">
                <span className="text-gray-400 mt-0.5">•</span>
                <input
                  type="text"
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, block)}
                  placeholder="List item"
                  className="flex-1 text-gray-700 bg-transparent outline-none placeholder-gray-300"
                />
              </div>
            ) : (
              <input
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, block)}
                placeholder="Type something..."
                className="w-full text-gray-700 bg-transparent outline-none placeholder-gray-300 py-1"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
