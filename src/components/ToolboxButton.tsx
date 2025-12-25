import { useState } from 'react';
import { KanaChart } from './KanaChart';

export function ToolboxButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isKanaChartOpen, setIsKanaChartOpen] = useState(false);

  const handleKanaChartClick = () => {
    setIsKanaChartOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-30">
        {/* Menu Options */}
        {isMenuOpen && (
          <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden mb-2 animate-fade-in">
            <button
              onClick={handleKanaChartClick}
              className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors w-full text-left min-w-[200px]"
            >
              <span className="text-2xl">あア</span>
              <div>
                <div className="font-medium text-gray-800">Kana Chart</div>
                <div className="text-xs text-gray-500">Hiragana & Katakana</div>
              </div>
            </button>
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110 ${
            isMenuOpen
              ? 'bg-gray-600 rotate-45'
              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
          }`}
          aria-label="Toolbox"
        >
          <svg
            className="w-6 h-6 text-white"
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
    </>
  );
}
