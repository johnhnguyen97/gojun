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

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState(initialPattern || '');

  // Selected topic for detail view
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopic | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [allTopics, allCategories] = await Promise.all([
        getAllTopics(),
        getCategories(),
      ]);
      setTopics(allTopics);
      setCategories(allCategories);

      // If initial pattern provided, find matching topic
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
      // Category filter
      if (selectedCategory !== 'all' && topic.category !== selectedCategory) {
        return false;
      }

      // Level filter
      if (selectedLevel !== 'all' && topic.level !== selectedLevel) {
        return false;
      }

      // Search filter
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent"></div>
            <span>Loading grammar guide...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>📖</span> Grammar Guide
            </h2>
            <p className="text-sm text-gray-500">
              Based on Tae Kim's Japanese Grammar Guide
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search grammar patterns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {getCategoryDisplayName(cat)}
                </option>
              ))}
            </select>

            {/* Level filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Levels</option>
              <option value="N5">N5 (Beginner)</option>
              <option value="N4">N4 (Elementary)</option>
              <option value="N3">N3 (Intermediate)</option>
              <option value="N2">N2 (Upper Int.)</option>
              <option value="N1">N1 (Advanced)</option>
            </select>
          </div>

          <div className="mt-2 text-sm text-gray-500">
            {filteredTopics.length} of {topics.length} topics
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Topics list */}
          <div className={`${selectedTopic ? 'hidden md:block md:w-1/3' : 'w-full'} overflow-y-auto border-r border-gray-200`}>
            {error ? (
              <div className="p-4 text-red-600">{error}</div>
            ) : filteredTopics.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No grammar topics found
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {Object.entries(groupedTopics).map(([category, categoryTopics]) => (
                  <div key={category}>
                    <div className="px-4 py-2 bg-gray-50 sticky top-0">
                      <h3 className="font-semibold text-gray-700 text-sm">
                        {getCategoryDisplayName(category)}
                      </h3>
                    </div>
                    {categoryTopics.map(topic => (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopic(topic)}
                        className={`w-full px-4 py-3 text-left hover:bg-amber-50 transition-colors ${
                          selectedTopic?.id === topic.id ? 'bg-amber-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-amber-700">
                            {topic.pattern}
                          </span>
                          {topic.level && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                              {topic.level}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{topic.name}</div>
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
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {/* Back button on mobile */}
              <button
                onClick={() => setSelectedTopic(null)}
                className="md:hidden mb-4 flex items-center gap-1 text-amber-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to list
              </button>

              {/* Pattern header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-bold text-amber-700">
                    {selectedTopic.pattern}
                  </span>
                  {selectedTopic.level && (
                    <span className="px-2 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded">
                      {selectedTopic.level}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedTopic.name}
                </h2>
                {selectedTopic.name_japanese && (
                  <p className="text-gray-500">{selectedTopic.name_japanese}</p>
                )}
              </div>

              {/* Description */}
              {selectedTopic.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Description
                  </h3>
                  <p className="text-gray-700">{selectedTopic.description}</p>
                </div>
              )}

              {/* Usage */}
              {selectedTopic.usage && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Usage
                  </h3>
                  <p className="text-gray-700">{selectedTopic.usage}</p>
                </div>
              )}

              {/* Conjugation */}
              {selectedTopic.conjugation && Object.keys(selectedTopic.conjugation).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Conjugation / Formation
                  </h3>
                  <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                    {Object.entries(selectedTopic.conjugation).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="text-purple-700 font-medium min-w-[120px]">
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
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Examples
                  </h3>
                  <div className="space-y-3">
                    {selectedTopic.examples.map((example, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-4">
                        <p className="text-lg font-medium text-gray-800">
                          {example.japanese}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {example.reading}
                        </p>
                        <p className="text-gray-600 mt-1">
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
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Notes
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-gray-700">{selectedTopic.notes}</p>
                  </div>
                </div>
              )}

              {/* Related patterns */}
              {selectedTopic.related_patterns && selectedTopic.related_patterns.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
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
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
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
            <div className="hidden md:flex flex-1 items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p>Select a grammar pattern to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
