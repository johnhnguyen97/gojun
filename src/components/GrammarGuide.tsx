import { useState, useEffect, useMemo } from 'react';
import {
  getAllTopics,
  getCategories,
  getCategoryDisplayName,
  type GrammarTopic,
} from '../services/grammarService';

interface GrammarGuideProps {
  onClose: () => void;
  initialPattern?: string;
}

export function GrammarGuide({ onClose, initialPattern }: GrammarGuideProps) {
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState(initialPattern || '');

  // Selected topic for detail view
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopic | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    loadData();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  async function loadData() {
    try {
      setLoading(true);
      const [allTopics, allCategories] = await Promise.all([
        getAllTopics(),
        getCategories(),
      ]);
      setTopics(allTopics);
      setCategories(allCategories);

      if (initialPattern) {
        const match = allTopics.find(t =>
          t.pattern === initialPattern ||
          t.name.toLowerCase().includes(initialPattern.toLowerCase())
        );
        if (match) {
          setSelectedTopic(match);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grammar data');
    } finally {
      setLoading(false);
    }
  }

  // Filter topics
  const filteredTopics = useMemo(() => {
    return topics.filter(topic => {
      if (selectedCategory !== 'all' && topic.category !== selectedCategory) {
        return false;
      }
      if (selectedLevel !== 'all' && topic.level !== selectedLevel) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          topic.pattern.includes(searchQuery) ||
          topic.name.toLowerCase().includes(query) ||
          topic.name_japanese?.includes(searchQuery) ||
          topic.description?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [topics, selectedCategory, selectedLevel, searchQuery]);

  // Group by category
  const groupedTopics = useMemo(() => {
    const groups: Record<string, GrammarTopic[]> = {};
    for (const topic of filteredTopics) {
      if (!groups[topic.category]) {
        groups[topic.category] = [];
      }
      groups[topic.category].push(topic);
    }
    return groups;
  }, [filteredTopics]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'N5': return 'bg-green-100 text-green-700 border-green-200';
      case 'N4': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'N3': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'N2': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'N1': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="relative bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-4 border-amber-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Loading Grammar Guide</p>
              <p className="text-sm text-gray-500">Preparing your study materials...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-200 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 md:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                📖
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold">Grammar Guide</h2>
                <p className="text-white/80 text-xs md:text-sm">Based on Tae Kim's Japanese Grammar Guide</p>
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

          {/* Filters */}
          <div className="mt-4 flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search grammar patterns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/20 border border-white/30 rounded-xl text-white placeholder:text-white/50 focus:bg-white/30 focus:border-white/50 outline-none transition-all"
              />
            </div>

            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-white/20 border border-white/30 rounded-xl text-white focus:bg-white/30 outline-none cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
            >
              <option value="all" className="text-gray-800">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat} className="text-gray-800">
                  {getCategoryDisplayName(cat)}
                </option>
              ))}
            </select>

            {/* Level filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2.5 bg-white/20 border border-white/30 rounded-xl text-white focus:bg-white/30 outline-none cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
            >
              <option value="all" className="text-gray-800">All Levels</option>
              <option value="N5" className="text-gray-800">N5 (Beginner)</option>
              <option value="N4" className="text-gray-800">N4 (Elementary)</option>
              <option value="N3" className="text-gray-800">N3 (Intermediate)</option>
              <option value="N2" className="text-gray-800">N2 (Upper Int.)</option>
              <option value="N1" className="text-gray-800">N1 (Advanced)</option>
            </select>
          </div>

          <div className="mt-3 text-sm text-white/70">
            {filteredTopics.length} of {topics.length} topics
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Topics list */}
          <div className={`${selectedTopic ? 'hidden md:block md:w-2/5 lg:w-1/3' : 'w-full'} overflow-y-auto border-r border-gray-200 bg-gray-50/50`}>
            {error ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No grammar topics found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div>
                {Object.entries(groupedTopics).map(([category, categoryTopics]) => (
                  <div key={category}>
                    <div className="px-4 py-3 bg-white/80 backdrop-blur-sm sticky top-0 border-b border-gray-100 z-10">
                      <h3 className="font-bold text-gray-700 text-sm tracking-wide">
                        {getCategoryDisplayName(category)}
                      </h3>
                    </div>
                    {categoryTopics.map((topic, index) => (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopic(topic)}
                        className={`w-full px-4 py-3 text-left transition-all duration-150 border-b border-gray-100 ${
                          selectedTopic?.id === topic.id
                            ? 'bg-amber-50 border-l-4 border-l-amber-500'
                            : 'hover:bg-white hover:shadow-sm'
                        }`}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg font-bold text-amber-600">
                            {topic.pattern}
                          </span>
                          {topic.level && (
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getLevelColor(topic.level)}`}>
                              {topic.level}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-0.5">{topic.name}</div>
                        {topic.name_japanese && (
                          <div className="text-xs text-gray-400">{topic.name_japanese}</div>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Topic detail */}
          {selectedTopic && (
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
              {/* Back button on mobile */}
              <button
                onClick={() => setSelectedTopic(null)}
                className="md:hidden mb-4 flex items-center gap-2 text-amber-600 font-medium hover:text-amber-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to list
              </button>

              {/* Pattern header */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-3xl md:text-4xl font-bold text-amber-600">
                    {selectedTopic.pattern}
                  </span>
                  {selectedTopic.level && (
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getLevelColor(selectedTopic.level)}`}>
                      {selectedTopic.level}
                    </span>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
                  {selectedTopic.name}
                </h2>
                {selectedTopic.name_japanese && (
                  <p className="text-gray-500 mt-1">{selectedTopic.name_japanese}</p>
                )}
              </div>

              {/* Description */}
              {selectedTopic.description && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{selectedTopic.description}</p>
                </div>
              )}

              {/* Usage */}
              {selectedTopic.usage && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Usage
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{selectedTopic.usage}</p>
                </div>
              )}

              {/* Conjugation */}
              {selectedTopic.conjugation && Object.keys(selectedTopic.conjugation).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Conjugation / Formation
                  </h3>
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 space-y-2 border border-purple-100">
                    {Object.entries(selectedTopic.conjugation).map(([key, value]) => (
                      <div key={key} className="flex flex-wrap md:flex-nowrap">
                        <span className="text-purple-700 font-semibold min-w-[140px]">
                          {key}:
                        </span>
                        <span className="text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Examples */}
              {selectedTopic.examples && selectedTopic.examples.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Examples
                  </h3>
                  <div className="space-y-3">
                    {selectedTopic.examples.map((example, i) => (
                      <div key={i} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                        <p className="text-lg md:text-xl font-medium text-gray-800">
                          {example.japanese}
                        </p>
                        {example.reading && (
                          <p className="text-gray-400 text-sm mt-1">
                            {example.reading}
                          </p>
                        )}
                        <p className="text-gray-600 mt-2 pt-2 border-t border-gray-100">
                          {example.english}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedTopic.notes && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Notes
                  </h3>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-700">{selectedTopic.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Related patterns */}
              {selectedTopic.related_patterns && selectedTopic.related_patterns.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Related Patterns
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTopic.related_patterns.map(pattern => {
                      const relatedTopic = topics.find(t => t.pattern === pattern);
                      return (
                        <button
                          key={pattern}
                          onClick={() => {
                            if (relatedTopic) {
                              setSelectedTopic(relatedTopic);
                            } else {
                              setSearchQuery(pattern);
                              setSelectedTopic(null);
                            }
                          }}
                          className="px-4 py-2 bg-gray-100 hover:bg-amber-100 hover:text-amber-700 rounded-full text-gray-700 font-medium transition-all hover:scale-105"
                        >
                          {pattern}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state when no topic selected (desktop) */}
          {!selectedTopic && filteredTopics.length > 0 && (
            <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 to-white">
              <div className="text-center p-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Select a grammar pattern</p>
                <p className="text-sm text-gray-400 mt-1">to view detailed explanations</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
