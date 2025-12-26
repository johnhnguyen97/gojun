import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFavorites, deleteFavorite, type Favorite } from '../services/favoritesApi';
import { WORD_CATEGORIES } from './FavoriteButton';
import {
  connectKeep,
  isKeepConnected,
  getKeepEmail,
  disconnectKeep,
  handleKeepCallback
} from '../services/keepApi';

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'favorites' | 'notes' | 'dictionary';

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
  type: 'text' | 'heading' | 'bullet' | 'divider';
  content: string;
}

// Dictionary entry
interface DictionaryEntry {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  category: string;
  notes: string;
  created_at: string;
}

const PAGE_ICONS = ['📝', '📚', '🎯', '💡', '⭐', '🔥', '📖', '✨', '🌸', '🗾', '🎌', '📌', '💮', '🏯', '🎎', '🍣', '🍜', '🍵'];

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

  // Dictionary state
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [showAddWord, setShowAddWord] = useState(false);
  const [dictSearch, setDictSearch] = useState('');

  // Google Keep state
  const [keepConnected, setKeepConnected] = useState(false);
  const [keepEmail, setKeepEmail] = useState<string | null>(null);
  const [keepLoading, setKeepLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      if (session?.access_token) {
        loadFavorites();
      }
      loadPages();
      loadDictionary();
      checkKeepConnection();
    } else {
      setIsVisible(false);
    }
  }, [isOpen, session]);

  // Check for Keep OAuth callback on mount
  useEffect(() => {
    try {
      const tokens = handleKeepCallback();
      if (tokens) {
        setKeepConnected(true);
        setKeepEmail(tokens.email);
      }
    } catch (err) {
      console.error('Keep callback error:', err);
    }
  }, []);

  const checkKeepConnection = () => {
    setKeepConnected(isKeepConnected());
    setKeepEmail(getKeepEmail());
  };

  const handleConnectKeep = async () => {
    setKeepLoading(true);
    try {
      await connectKeep();
    } catch (err) {
      console.error('Failed to connect Keep:', err);
      setKeepLoading(false);
    }
  };

  const handleDisconnectKeep = () => {
    disconnectKeep();
    setKeepConnected(false);
    setKeepEmail(null);
  };

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

  // Pages
  const loadPages = () => {
    const stored = localStorage.getItem('gojun-note-pages');
    if (stored) setPages(JSON.parse(stored));
  };

  const savePages = (updatedPages: NotePage[]) => {
    localStorage.setItem('gojun-note-pages', JSON.stringify(updatedPages));
    setPages(updatedPages);
  };

  const createPage = () => {
    const newPage: NotePage = {
      id: Date.now().toString(),
      title: 'Untitled',
      icon: PAGE_ICONS[Math.floor(Math.random() * PAGE_ICONS.length)],
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
    if (selectedPageId === pageId) setSelectedPageId(null);
  };

  // Dictionary
  const loadDictionary = () => {
    const stored = localStorage.getItem('gojun-dictionary');
    if (stored) setDictionary(JSON.parse(stored));
  };

  const saveDictionary = (entries: DictionaryEntry[]) => {
    localStorage.setItem('gojun-dictionary', JSON.stringify(entries));
    setDictionary(entries);
  };

  const addDictionaryEntry = (entry: Omit<DictionaryEntry, 'id' | 'created_at'>) => {
    const newEntry: DictionaryEntry = {
      ...entry,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    saveDictionary([newEntry, ...dictionary]);
    setShowAddWord(false);
  };

  const deleteDictionaryEntry = (id: string) => {
    saveDictionary(dictionary.filter(d => d.id !== id));
  };

  const selectedPage = pages.find(p => p.id === selectedPageId);

  const filteredDictionary = dictionary.filter(d =>
    !dictSearch ||
    d.word.includes(dictSearch) ||
    d.reading.includes(dictSearch) ||
    d.meaning.toLowerCase().includes(dictSearch.toLowerCase())
  );

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
        className={`relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-200 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 md:p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                📝
              </div>
              <div>
                <h2 className="text-lg font-bold">Notes</h2>
                <p className="text-white/80 text-xs">
                  {activeTab === 'favorites' ? `${favorites.length} words` :
                   activeTab === 'notes' ? `${pages.length} pages` :
                   `${dictionary.length} entries`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Google Keep Sync Button */}
              {keepConnected ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/70 hidden sm:inline">{keepEmail}</span>
                  <button
                    onClick={handleDisconnectKeep}
                    className="px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-all flex items-center gap-1.5"
                    title="Disconnect Google Keep"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="hidden sm:inline">Keep</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectKeep}
                  disabled={keepLoading}
                  className="px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                  title="Connect Google Keep"
                >
                  {keepLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                    </svg>
                  )}
                  <span className="hidden sm:inline">Google Keep</span>
                </button>
              )}
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all hover:rotate-90 duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 bg-white/10 rounded-xl p-1">
            {[
              { id: 'favorites' as Tab, label: 'Favorites', icon: '★' },
              { id: 'notes' as Tab, label: 'My Notes', icon: '📄' },
              { id: 'dictionary' as Tab, label: 'Dictionary', icon: '📖' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedPageId(null); }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-600 shadow-md'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Category filter for favorites */}
          {activeTab === 'favorites' && categories.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
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
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
                      selectedCategory === cat ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {style.label} ({grouped[cat]?.length || 0})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex bg-gray-50">
          {activeTab === 'favorites' && (
            <FavoritesTab
              favorites={displayFavorites}
              loading={favoritesLoading}
              error={favoritesError}
              onDelete={handleDeleteFavorite}
            />
          )}

          {activeTab === 'notes' && (
            <NotesTab
              pages={pages}
              selectedPage={selectedPage}
              selectedPageId={selectedPageId}
              onSelectPage={setSelectedPageId}
              onCreate={createPage}
              onUpdate={updatePage}
              onDelete={deletePage}
            />
          )}

          {activeTab === 'dictionary' && (
            <DictionaryTab
              dictionary={filteredDictionary}
              search={dictSearch}
              onSearchChange={setDictSearch}
              showAddWord={showAddWord}
              onShowAddWord={setShowAddWord}
              onAdd={addDictionaryEntry}
              onDelete={deleteDictionaryEntry}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Favorites Tab ============
function FavoritesTab({ favorites, loading, error, onDelete }: {
  favorites: Favorite[];
  loading: boolean;
  error: string | null;
  onDelete: (word: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">❌</span>
          </div>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-amber-100 rounded-2xl flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
            <span className="text-4xl">★</span>
          </div>
          <p className="text-gray-600 font-medium">No favorites yet</p>
          <p className="text-gray-400 text-sm mt-1">Click the ★ on words to save them</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-2 stagger-children">
        {favorites.map((fav) => {
          const catStyle = getCategoryStyle(fav.category);
          return (
            <div
              key={fav.id}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all group"
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
                onClick={() => onDelete(fav.word)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ Notes Tab ============
function NotesTab({ pages, selectedPage, selectedPageId, onSelectPage, onCreate, onUpdate, onDelete }: {
  pages: NotePage[];
  selectedPage: NotePage | undefined;
  selectedPageId: string | null;
  onSelectPage: (id: string | null) => void;
  onCreate: () => void;
  onUpdate: (id: string, updates: Partial<NotePage>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`${selectedPageId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-56 border-r border-gray-200 bg-white`}>
        <div className="p-3">
          <button
            onClick={onCreate}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Page
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {pages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No pages yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => onSelectPage(page.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all group ${
                    selectedPageId === page.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="text-base">{page.icon}</span>
                  <span className="flex-1 truncate text-sm">{page.title || 'Untitled'}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}
                    className="p-1 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <PageEditor
          page={selectedPage}
          onUpdate={(updates) => onUpdate(selectedPage.id, updates)}
          onBack={() => onSelectPage(null)}
        />
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
            <p className="text-gray-400 text-sm">Select or create a page</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Page Editor ============
function PageEditor({ page, onUpdate, onBack }: {
  page: NotePage;
  onUpdate: (updates: Partial<NotePage>) => void;
  onBack: () => void;
}) {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showIconPicker) {
      requestAnimationFrame(() => setIconPickerVisible(true));
    } else {
      setIconPickerVisible(false);
    }
  }, [showIconPicker]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target as Node)) {
        setIconPickerVisible(false);
        setTimeout(() => setShowIconPicker(false), 150);
      }
    };
    if (showIconPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showIconPicker]);

  const selectIcon = (icon: string) => {
    onUpdate({ icon });
    setIconPickerVisible(false);
    setTimeout(() => setShowIconPicker(false), 150);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Mobile back button */}
      <div className="md:hidden p-2 border-b border-gray-100">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Page Header */}
      <div className="p-4 md:p-6 border-b border-gray-100">
        <div className="flex items-start gap-3">
          {/* Icon with picker */}
          <div className="relative" ref={iconPickerRef}>
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="text-3xl hover:bg-gray-100 rounded-xl p-2 transition-all hover:scale-110 active:scale-95"
            >
              {page.icon}
            </button>

            {showIconPicker && (
              <div
                className={`absolute z-[100] mt-2 p-3 bg-white rounded-xl shadow-2xl border border-gray-200 transition-all duration-150 ${
                  iconPickerVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
                style={{ top: '100%', left: 0, width: '240px' }}
              >
                <p className="text-xs text-gray-500 mb-2 font-medium">Choose an icon</p>
                <div className="grid grid-cols-6 gap-1">
                  {PAGE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => selectIcon(icon)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-indigo-100 rounded-lg text-lg transition-colors"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <input
            type="text"
            value={page.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Untitled"
            className="flex-1 text-2xl font-bold text-gray-900 bg-transparent outline-none placeholder-gray-300"
          />
        </div>
      </div>

      {/* Blocks Editor */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <BlocksEditor
          blocks={page.blocks}
          onChange={(blocks) => onUpdate({ blocks })}
        />
      </div>
    </div>
  );
}

// ============ Blocks Editor ============
function BlocksEditor({ blocks, onChange }: { blocks: NoteBlock[]; onChange: (blocks: NoteBlock[]) => void }) {
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const addBlock = (afterId: string, type: NoteBlock['type'] = 'text') => {
    const index = blocks.findIndex(b => b.id === afterId);
    const newBlock: NoteBlock = { id: Date.now().toString(), type, content: '' };
    const updated = [...blocks];
    updated.splice(index + 1, 0, newBlock);
    onChange(updated);
    // Focus new block after render
    setTimeout(() => inputRefs.current[newBlock.id]?.focus(), 50);
  };

  const updateBlock = (id: string, content: string) => {
    onChange(blocks.map(b => b.id === id ? { ...b, content } : b));
  };

  const changeBlockType = (id: string, type: NoteBlock['type']) => {
    onChange(blocks.map(b => b.id === id ? { ...b, type } : b));
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) return;
    const index = blocks.findIndex(b => b.id === id);
    onChange(blocks.filter(b => b.id !== id));
    // Focus previous block
    if (index > 0) {
      setTimeout(() => inputRefs.current[blocks[index - 1].id]?.focus(), 50);
    }
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
    <div className="space-y-1 min-h-[200px]">
      {blocks.map((block) => (
        <div key={block.id} className="group flex items-start gap-2">
          {/* Controls */}
          <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-0.5 pt-1">
            <button
              onClick={() => addBlock(block.id)}
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
              title="Add block below"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <select
              value={block.type}
              onChange={(e) => changeBlockType(block.id, e.target.value as NoteBlock['type'])}
              className="w-6 p-0.5 text-xs bg-transparent text-gray-400 hover:text-gray-600 cursor-pointer outline-none appearance-none text-center"
              title="Block type"
            >
              <option value="text">¶</option>
              <option value="heading">H</option>
              <option value="bullet">•</option>
              <option value="divider">—</option>
            </select>
          </div>

          {/* Block content */}
          <div className="flex-1">
            {block.type === 'divider' ? (
              <div className="py-2">
                <hr className="border-gray-200" />
              </div>
            ) : block.type === 'heading' ? (
              <input
                ref={el => { inputRefs.current[block.id] = el; }}
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, block)}
                placeholder="Heading"
                className="w-full text-lg font-bold text-gray-900 bg-transparent outline-none placeholder-gray-300 py-1"
              />
            ) : block.type === 'bullet' ? (
              <div className="flex items-start gap-2 py-1">
                <span className="text-gray-400 mt-0.5">•</span>
                <input
                  ref={el => { inputRefs.current[block.id] = el; }}
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
                ref={el => { inputRefs.current[block.id] = el; }}
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

// ============ Dictionary Tab ============
function DictionaryTab({ dictionary, search, onSearchChange, showAddWord, onShowAddWord, onAdd, onDelete }: {
  dictionary: DictionaryEntry[];
  search: string;
  onSearchChange: (s: string) => void;
  showAddWord: boolean;
  onShowAddWord: (show: boolean) => void;
  onAdd: (entry: Omit<DictionaryEntry, 'id' | 'created_at'>) => void;
  onDelete: (id: string) => void;
}) {
  const [newWord, setNewWord] = useState({ word: '', reading: '', meaning: '', category: 'noun', notes: '' });

  const handleAdd = () => {
    if (!newWord.word || !newWord.meaning) return;
    onAdd(newWord);
    setNewWord({ word: '', reading: '', meaning: '', category: 'noun', notes: '' });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search & Add */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search dictionary..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <button
            onClick={() => onShowAddWord(!showAddWord)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              showAddWord
                ? 'bg-gray-200 text-gray-600'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-md'
            }`}
          >
            {showAddWord ? 'Cancel' : '+ Add Word'}
          </button>
        </div>

        {/* Add Word Form */}
        {showAddWord && (
          <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-2 animate-fadeInUp">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newWord.word}
                onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                placeholder="Japanese word"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
              <input
                type="text"
                value={newWord.reading}
                onChange={(e) => setNewWord({ ...newWord, reading: e.target.value })}
                placeholder="Reading (hiragana)"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <input
              type="text"
              value={newWord.meaning}
              onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })}
              placeholder="English meaning"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
            <div className="flex gap-2">
              <select
                value={newWord.category}
                onChange={(e) => setNewWord({ ...newWord, category: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white"
              >
                {WORD_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={newWord.notes}
                onChange={(e) => setNewWord({ ...newWord, notes: e.target.value })}
                placeholder="Notes (optional)"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!newWord.word || !newWord.meaning}
              className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Dictionary
            </button>
          </div>
        )}
      </div>

      {/* Dictionary List */}
      <div className="flex-1 overflow-y-auto p-3">
        {dictionary.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-indigo-100 rounded-2xl flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
                <span className="text-2xl">📖</span>
              </div>
              <p className="text-gray-500 text-sm">Your dictionary is empty</p>
              <p className="text-gray-400 text-xs mt-1">Add words to build your vocabulary</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 stagger-children">
            {dictionary.map((entry) => {
              const catStyle = getCategoryStyle(entry.category);
              return (
                <div
                  key={entry.id}
                  className="p-3 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold text-gray-900">{entry.word}</span>
                        {entry.reading && <span className="text-sm text-gray-500">{entry.reading}</span>}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r ${catStyle.color} text-white`}>
                          {catStyle.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{entry.meaning}</div>
                      {entry.notes && (
                        <div className="text-xs text-gray-400 mt-1 italic">{entry.notes}</div>
                      )}
                    </div>
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
