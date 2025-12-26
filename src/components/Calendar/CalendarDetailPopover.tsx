import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { WordOfTheDay, KanjiOfTheDay, JapaneseHoliday } from '../../types/calendar';

interface CalendarDetailPopoverProps {
  type: 'wotd' | 'kotd' | 'holiday';
  data: WordOfTheDay | KanjiOfTheDay | JapaneseHoliday;
  position: { x: number; y: number };
  onClose: () => void;
}

export function CalendarDetailPopover({ type, data, position, onClose }: CalendarDetailPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [strokeAnimation, setStrokeAnimation] = useState<string | null>(null);
  const [loadingStrokes, setLoadingStrokes] = useState(false);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      // Adjust horizontal position
      if (x + rect.width > viewportWidth - 20) {
        x = viewportWidth - rect.width - 20;
      }
      if (x < 20) x = 20;

      // Adjust vertical position
      if (y + rect.height > viewportHeight - 20) {
        y = position.y - rect.height - 10;
      }
      if (y < 20) y = 20;

      setAdjustedPosition({ x, y });
    }
  }, [position]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Fetch stroke animation for kanji
  useEffect(() => {
    if (type === 'kotd') {
      const kanji = (data as KanjiOfTheDay).kanji;
      setLoadingStrokes(true);

      // Use KanjiVG for stroke order animation
      const kanjiCode = kanji.charCodeAt(0).toString(16).padStart(5, '0');
      const svgUrl = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${kanjiCode}.svg`;

      fetch(svgUrl)
        .then(res => {
          if (res.ok) return res.text();
          throw new Error('SVG not found');
        })
        .then(svg => {
          setStrokeAnimation(svg);
        })
        .catch(() => {
          setStrokeAnimation(null);
        })
        .finally(() => {
          setLoadingStrokes(false);
        });
    }
  }, [type, data]);

  const renderWordContent = () => {
    const word = data as WordOfTheDay;
    return (
      <div className="space-y-3">
        {/* Main word display */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
            {word.word}
          </div>
          <div className="text-xl text-indigo-600 dark:text-indigo-400">
            {word.reading}
          </div>
        </div>

        {/* Meaning */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Meaning
          </div>
          <div className="text-gray-900 dark:text-white">
            {word.meaning}
          </div>
        </div>

        {/* Part of speech & JLPT */}
        <div className="flex gap-2">
          {word.partOfSpeech && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
              {word.partOfSpeech}
            </span>
          )}
          {word.jlptLevel && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
              {word.jlptLevel}
            </span>
          )}
          {word.isLearned && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
              ✓ Learned
            </span>
          )}
        </div>

        {/* Example sentence placeholder */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Example
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 italic">
            Loading example sentences...
          </div>
        </div>
      </div>
    );
  };

  const renderKanjiContent = () => {
    const kanji = data as KanjiOfTheDay;
    return (
      <div className="space-y-3">
        {/* Main kanji display with stroke animation */}
        <div className="text-center">
          <div className="relative inline-block">
            {strokeAnimation ? (
              <div
                className="w-32 h-32 mx-auto stroke-animation-container"
                dangerouslySetInnerHTML={{ __html: strokeAnimation }}
              />
            ) : loadingStrokes ? (
              <div className="w-32 h-32 mx-auto flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="text-7xl font-bold text-gray-900 dark:text-white">
                {kanji.kanji}
              </div>
            )}
          </div>

          {/* Play animation button */}
          {strokeAnimation && (
            <button
              onClick={() => {
                // Trigger animation replay
                const container = document.querySelector('.stroke-animation-container');
                if (container) {
                  container.classList.remove('animate');
                  void (container as HTMLElement).offsetWidth; // Force reflow
                  container.classList.add('animate');
                }
              }}
              className="mt-2 px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              ▶ Play Strokes
            </button>
          )}
        </div>

        {/* Readings */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              On'yomi
            </div>
            <div className="text-purple-600 dark:text-purple-400 font-medium">
              {kanji.onyomi?.length > 0 ? kanji.onyomi.join('、') : '—'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Kun'yomi
            </div>
            <div className="text-indigo-600 dark:text-indigo-400 font-medium">
              {kanji.kunyomi?.length > 0 ? kanji.kunyomi.join('、') : '—'}
            </div>
          </div>
        </div>

        {/* Meaning */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Meaning
          </div>
          <div className="text-gray-900 dark:text-white">
            {kanji.meaning}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 flex-wrap">
          {kanji.strokeCount && (
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full">
              {kanji.strokeCount} strokes
            </span>
          )}
          {kanji.jlptLevel && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
              {kanji.jlptLevel}
            </span>
          )}
          {kanji.isLearned && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
              ✓ Learned
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderHolidayContent = () => {
    const holiday = data as JapaneseHoliday;
    return (
      <div className="space-y-3">
        <div className="text-center">
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
            {holiday.localName}
          </div>
          <div className="text-lg text-gray-600 dark:text-gray-300">
            {holiday.nameEnglish}
          </div>
        </div>

        {holiday.description && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
            <div className="text-gray-700 dark:text-gray-200">
              {holiday.description}
            </div>
          </div>
        )}

        {holiday.traditions && holiday.traditions.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Traditions
            </div>
            <div className="flex flex-wrap gap-2">
              {holiday.traditions.map((tradition, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full"
                >
                  {tradition}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getTitle = () => {
    switch (type) {
      case 'wotd': return 'Word of the Day';
      case 'kotd': return 'Kanji of the Day';
      case 'holiday': return 'Japanese Holiday';
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'wotd': return 'from-indigo-500 to-purple-500';
      case 'kotd': return 'from-purple-500 to-pink-500';
      case 'holiday': return 'from-amber-500 to-orange-500';
    }
  };

  const popoverContent = (
    <div
      ref={popoverRef}
      className="fixed z-[9999] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${getTitleColor()} px-4 py-3 flex items-center justify-between`}>
        <h3 className="text-white font-semibold">{getTitle()}</h3>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-[60vh]">
        {type === 'wotd' && renderWordContent()}
        {type === 'kotd' && renderKanjiContent()}
        {type === 'holiday' && renderHolidayContent()}
      </div>

      {/* Stroke animation styles */}
      <style>{`
        .stroke-animation-container svg {
          width: 100%;
          height: 100%;
        }

        .stroke-animation-container svg path {
          fill: none;
          stroke: #6366f1;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .stroke-animation-container.animate svg path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawStroke 0.5s ease-out forwards;
        }

        .stroke-animation-container.animate svg path:nth-child(1) { animation-delay: 0s; }
        .stroke-animation-container.animate svg path:nth-child(2) { animation-delay: 0.3s; }
        .stroke-animation-container.animate svg path:nth-child(3) { animation-delay: 0.6s; }
        .stroke-animation-container.animate svg path:nth-child(4) { animation-delay: 0.9s; }
        .stroke-animation-container.animate svg path:nth-child(5) { animation-delay: 1.2s; }
        .stroke-animation-container.animate svg path:nth-child(6) { animation-delay: 1.5s; }
        .stroke-animation-container.animate svg path:nth-child(7) { animation-delay: 1.8s; }
        .stroke-animation-container.animate svg path:nth-child(8) { animation-delay: 2.1s; }
        .stroke-animation-container.animate svg path:nth-child(9) { animation-delay: 2.4s; }
        .stroke-animation-container.animate svg path:nth-child(10) { animation-delay: 2.7s; }
        .stroke-animation-container.animate svg path:nth-child(11) { animation-delay: 3.0s; }
        .stroke-animation-container.animate svg path:nth-child(12) { animation-delay: 3.3s; }

        @keyframes drawStroke {
          to {
            stroke-dashoffset: 0;
          }
        }

        .dark .stroke-animation-container svg path {
          stroke: #a78bfa;
        }
      `}</style>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(popoverContent, document.body);
}
