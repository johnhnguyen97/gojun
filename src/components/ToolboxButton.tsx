import { useState } from 'react';
import { KanaChart } from './KanaChart';
import { FavoritesViewer } from './FavoritesViewer';
import { GrammarGuide } from './GrammarGuide';

export function ToolboxButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isKanaChartOpen, setIsKanaChartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isGrammarGuideOpen, setIsGrammarGuideOpen] = useState(false);

  const handleKanaChartClick = () => {
    setIsKanaChartOpen(true);
    setIsMenuOpen(false);
  };

  const handleFavoritesClick = () => {
    setIsFavoritesOpen(true);
    setIsMenuOpen(false);
  };

  const handleGrammarGuideClick = () => {
    setIsGrammarGuideOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30">
        {/* Menu Options */}
        {isMenuOpen && (
          <div className="absolute bottom-14 right-0 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mb-2">
            <button
              onClick={handleGrammarGuideClick}
              className="flex items-center gap-2 px-3 py-2 active:bg-gray-100 w-full text-left border-b border-gray-200"
            >
              <span className="text-xl">📖</span>
              <span className="text-sm font-medium text-gray-700">Grammar Guide</span>
            </button>
            <button
              onClick={handleKanaChartClick}
              className="flex items-center gap-2 px-3 py-2 active:bg-gray-100 w-full text-left border-b border-gray-200"
            >
              <span className="text-xl">あア</span>
              <span className="text-sm font-medium text-gray-700">Kana Chart</span>
            </button>
            <button
              onClick={handleFavoritesClick}
              className="flex items-center gap-2 px-3 py-2 active:bg-gray-100 w-full text-left"
            >
              <span className="text-xl">★</span>
              <span className="text-sm font-medium text-gray-700">Favorites</span>
            </button>
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${
            isMenuOpen
              ? 'bg-gray-700 rotate-45'
              : 'bg-gray-800 active:bg-gray-700'
          }`}
          aria-label="Toolbox"
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
      </div>

      {/* Kana Chart Modal */}
      <KanaChart
        isOpen={isKanaChartOpen}
        onClose={() => setIsKanaChartOpen(false)}
      />

      {/* Favorites Viewer */}
      <FavoritesViewer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
      />

      {/* Grammar Guide */}
      {isGrammarGuideOpen && (
        <GrammarGuide onClose={() => setIsGrammarGuideOpen(false)} />
      )}
    </>
  );
}
