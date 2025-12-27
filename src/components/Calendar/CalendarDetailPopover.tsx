import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { WordOfTheDay, KanjiOfTheDay, JapaneseHoliday } from '../../types/calendar';

interface CalendarDetailPopoverProps {
  type: 'wotd' | 'kotd' | 'holiday';
  data: WordOfTheDay | KanjiOfTheDay | JapaneseHoliday;
  onClose: () => void;
}

// Color palette for strokes (like KanjiVG viewer)
const STROKE_COLORS = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#9333ea', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
  '#be185d', // pink
  '#854d0e', // brown
  '#4f46e5', // indigo
  '#059669', // emerald
  '#d97706', // amber
  '#7c3aed', // violet
];

// Preprocess SVG to add colors directly to paths (wkanki-style)
function preprocessSvg(svgString: string): string {
  // Create a temporary DOM element to parse the SVG
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return svgString;

  // Remove stroke numbers group
  const numbersGroup = svg.querySelector('.kgNumbers');
  if (numbersGroup) numbersGroup.remove();

  // Remove stroke="currentColor" from kgPaths group
  const kgPaths = svg.querySelector('.kgPaths');
  if (kgPaths) {
    kgPaths.removeAttribute('stroke');
  }

  // Get all paths and apply colors directly
  const paths = kgPaths ? kgPaths.querySelectorAll('path') : svg.querySelectorAll('path');
  paths.forEach((path, index) => {
    const color = STROKE_COLORS[index % STROKE_COLORS.length];
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '3');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
  });

  return new XMLSerializer().serializeToString(svg);
}

export function CalendarDetailPopover({ type, data, onClose }: CalendarDetailPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loadingSvg, setLoadingSvg] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef<{ cancel: boolean; cleanup?: () => void }>({ cancel: true });

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Fetch KanjiVG SVG for kanji - preprocess with colors
  useEffect(() => {
    if (type === 'kotd') {
      const kanji = (data as KanjiOfTheDay).kanji;
      setLoadingSvg(true);

      const kanjiCode = kanji.charCodeAt(0).toString(16).padStart(5, '0');
      const svgUrl = `https://kan-g.vnaka.dev/k/${kanjiCode}.svg`;

      fetch(svgUrl)
        .then(res => {
          if (res.ok) return res.text();
          throw new Error('SVG not found');
        })
        .then(svg => {
          // Preprocess SVG with colors applied directly
          const processedSvg = preprocessSvg(svg);
          setSvgContent(processedSvg);
        })
        .catch(() => {
          setSvgContent(null);
        })
        .finally(() => {
          setLoadingSvg(false);
        });
    }
  }, [type, data]);

  // Two-layer animation using requestAnimationFrame (exact copy from working test-stroke-animation.html)
  const playAnimation = useCallback(() => {
    if (!svgContainerRef.current) return;
    if (animationRef.current.cancel === false) return; // Already animating

    const svg = svgContainerRef.current.querySelector('svg');
    if (!svg) return;

    const kgPaths = svg.querySelector('.kgPaths');
    const paths = Array.from(
      kgPaths ? kgPaths.querySelectorAll('path') : svg.querySelectorAll('path')
    ) as SVGPathElement[];

    if (paths.length === 0) return;

    // Mark as animating
    animationRef.current.cancel = false;
    setIsAnimating(true);

    // Store original colors and set paths to gray (background)
    const originalColors = paths.map(p => p.getAttribute('stroke') || '#000');
    paths.forEach(path => {
      path.setAttribute('stroke', '#e0e0e0');
    });

    // Create overlay group for colored animated strokes
    const animGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    animGroup.setAttribute('class', 'animation-overlay');
    (kgPaths || svg).appendChild(animGroup);

    // Prepare animated paths - all start hidden
    const animData = paths.map((path, index) => {
      const clone = path.cloneNode(true) as SVGPathElement;
      const length = path.getTotalLength();

      clone.setAttribute('stroke', originalColors[index]);
      clone.setAttribute('stroke-width', '4');
      clone.setAttribute('fill', 'none');
      clone.setAttribute('stroke-linecap', 'round');
      clone.setAttribute('stroke-linejoin', 'round');
      clone.style.strokeDasharray = String(length);
      clone.style.strokeDashoffset = String(length); // Fully hidden

      animGroup.appendChild(clone);

      return { element: clone, length };
    });

    // Animation state (exact copy from test file)
    const strokeDuration = 400; // ms per stroke
    const pauseBetween = 80; // ms pause between strokes
    let currentStroke = 0;
    let strokeProgress = 0;
    let lastTimestamp: number | null = null;
    let isPausing = false;
    let pauseEndTime = 0;
    let animationId: number | null = null;

    function animate(timestamp: number) {
      if (animationRef.current.cancel) {
        return; // Stop if cancelled
      }

      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // Handle pause between strokes
      if (isPausing) {
        if (timestamp >= pauseEndTime) {
          isPausing = false;
          currentStroke++;
          strokeProgress = 0;
        } else {
          animationId = requestAnimationFrame(animate);
          return;
        }
      }

      // Check if animation complete
      if (currentStroke >= animData.length) {
        // Clean up - remove overlay, restore colors
        if (animGroup.parentNode) {
          animGroup.remove();
        }
        paths.forEach((path, index) => {
          path.setAttribute('stroke', originalColors[index]);
        });
        animationRef.current.cancel = true;
        setIsAnimating(false);
        return;
      }

      // Animate current stroke
      const { element, length } = animData[currentStroke];
      strokeProgress += deltaTime / strokeDuration;

      if (strokeProgress >= 1) {
        // Stroke complete
        element.style.strokeDashoffset = '0';
        isPausing = true;
        pauseEndTime = timestamp + pauseBetween;
      } else {
        // Draw stroke progressively
        const offset = length * (1 - strokeProgress);
        element.style.strokeDashoffset = String(offset);
      }

      animationId = requestAnimationFrame(animate);
    }

    // Start animation
    animationId = requestAnimationFrame(animate);

    // Store cleanup function
    animationRef.current.cleanup = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (animGroup.parentNode) {
        animGroup.remove();
      }
      paths.forEach((path, index) => {
        path.setAttribute('stroke', originalColors[index]);
      });
    };
  }, []);

  // Stop animation and restore state
  const resetAnimation = useCallback(() => {
    animationRef.current.cancel = true;
    if (animationRef.current.cleanup) {
      animationRef.current.cleanup();
      animationRef.current.cleanup = undefined;
    }
    setIsAnimating(false);
  }, []);

  const handleClose = () => {
    animationRef.current.cancel = true;
    if (animationRef.current.cleanup) {
      animationRef.current.cleanup();
    }
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const renderWordContent = () => {
    const word = data as WordOfTheDay;
    return (
      <div className="space-y-4">
        {/* Main word display */}
        <div className="text-center py-4">
          <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {word.word}
          </div>
          <div className="text-2xl text-indigo-600 dark:text-indigo-400">
            {word.reading}
          </div>
        </div>

        {/* Meaning */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Meaning
          </div>
          <div className="text-lg text-gray-900 dark:text-white">
            {word.meaning}
          </div>
        </div>

        {/* Part of speech & JLPT */}
        <div className="flex gap-2 flex-wrap justify-center">
          {word.partOfSpeech && (
            <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full">
              {word.partOfSpeech}
            </span>
          )}
          {word.jlptLevel && (
            <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-full font-bold">
              {word.jlptLevel}
            </span>
          )}
          {word.isLearned && (
            <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full">
              ✓ Learned
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderKanjiContent = () => {
    const kanji = data as KanjiOfTheDay;
    return (
      <div className="space-y-4">
        {/* Main kanji display with stroke animation */}
        <div className="text-center">
          <div className="relative inline-block bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
            {svgContent ? (
              <div
                ref={svgContainerRef}
                className="w-48 h-48 mx-auto flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-[180px] [&_svg]:max-h-[180px]"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : loadingSvg ? (
              <div className="w-48 h-48 mx-auto flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-3 border-purple-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="text-8xl font-bold text-gray-900 dark:text-white py-4">
                {kanji.kanji}
              </div>
            )}
          </div>

          {/* Animation controls */}
          {svgContent && (
            <div className="mt-4 flex gap-2 justify-center">
              <button
                onClick={isAnimating ? resetAnimation : playAnimation}
                className={`px-4 py-2 text-sm rounded-full transition-all flex items-center gap-2 ${
                  isAnimating
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl'
                }`}
              >
                <span>{isAnimating ? '⏹' : '▶'}</span>
                <span>{isAnimating ? 'Stop' : 'Play Stroke Order'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Readings */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
            <div className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
              On'yomi
            </div>
            <div className="text-purple-700 dark:text-purple-300 font-bold text-lg">
              {kanji.onyomi?.length > 0 ? kanji.onyomi.join('、') : '—'}
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3">
            <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              Kun'yomi
            </div>
            <div className="text-indigo-700 dark:text-indigo-300 font-bold text-lg">
              {kanji.kunyomi?.length > 0 ? kanji.kunyomi.join('、') : '—'}
            </div>
          </div>
        </div>

        {/* Meaning */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Meaning
          </div>
          <div className="text-lg text-gray-900 dark:text-white">
            {kanji.meaning}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 flex-wrap justify-center">
          {kanji.strokeCount && (
            <span className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm rounded-full font-medium">
              {kanji.strokeCount} strokes
            </span>
          )}
          {kanji.jlptLevel && (
            <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-full font-bold">
              {kanji.jlptLevel}
            </span>
          )}
          {kanji.isLearned && (
            <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full">
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
      <div className="space-y-4">
        <div className="text-center py-4">
          <div className="text-4xl font-bold text-amber-600 dark:text-amber-400 mb-2">
            {holiday.localName}
          </div>
          <div className="text-xl text-gray-600 dark:text-gray-300">
            {holiday.nameEnglish}
          </div>
        </div>

        {holiday.description && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
            <div className="text-gray-700 dark:text-gray-200">
              {holiday.description}
            </div>
          </div>
        )}

        {holiday.traditions && holiday.traditions.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Traditions
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {holiday.traditions.map((tradition, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm rounded-full"
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
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-[9998] transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Centered Modal */}
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <div
          ref={popoverRef}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[85vh] overflow-hidden pointer-events-auto"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${getTitleColor()} px-5 py-4 flex items-center justify-between`}>
            <h3 className="text-white font-bold text-lg">{getTitle()}</h3>
            <button
              onClick={handleClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto max-h-[calc(85vh-80px)]">
            {type === 'wotd' && renderWordContent()}
            {type === 'kotd' && renderKanjiContent()}
            {type === 'holiday' && renderHolidayContent()}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(popoverContent, document.body);
}
