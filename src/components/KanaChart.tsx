import { useState } from 'react';

interface KanaChartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KanaChart({ isOpen, onClose }: KanaChartProps) {
  const [activeTab, setActiveTab] = useState<'hiragana' | 'katakana'>('hiragana');

  if (!isOpen) return null;

  const hiraganaChart = [
    { romaji: 'a', kana: 'あ' }, { romaji: 'i', kana: 'い' }, { romaji: 'u', kana: 'う' }, { romaji: 'e', kana: 'え' }, { romaji: 'o', kana: 'お' },
    { romaji: 'ka', kana: 'か' }, { romaji: 'ki', kana: 'き' }, { romaji: 'ku', kana: 'く' }, { romaji: 'ke', kana: 'け' }, { romaji: 'ko', kana: 'こ' },
    { romaji: 'sa', kana: 'さ' }, { romaji: 'shi', kana: 'し' }, { romaji: 'su', kana: 'す' }, { romaji: 'se', kana: 'せ' }, { romaji: 'so', kana: 'そ' },
    { romaji: 'ta', kana: 'た' }, { romaji: 'chi', kana: 'ち' }, { romaji: 'tsu', kana: 'つ' }, { romaji: 'te', kana: 'て' }, { romaji: 'to', kana: 'と' },
    { romaji: 'na', kana: 'な' }, { romaji: 'ni', kana: 'に' }, { romaji: 'nu', kana: 'ぬ' }, { romaji: 'ne', kana: 'ね' }, { romaji: 'no', kana: 'の' },
    { romaji: 'ha', kana: 'は' }, { romaji: 'hi', kana: 'ひ' }, { romaji: 'fu', kana: 'ふ' }, { romaji: 'he', kana: 'へ' }, { romaji: 'ho', kana: 'ほ' },
    { romaji: 'ma', kana: 'ま' }, { romaji: 'mi', kana: 'み' }, { romaji: 'mu', kana: 'む' }, { romaji: 'me', kana: 'め' }, { romaji: 'mo', kana: 'も' },
    { romaji: 'ya', kana: 'や' }, { romaji: '', kana: '' }, { romaji: 'yu', kana: 'ゆ' }, { romaji: '', kana: '' }, { romaji: 'yo', kana: 'よ' },
    { romaji: 'ra', kana: 'ら' }, { romaji: 'ri', kana: 'り' }, { romaji: 'ru', kana: 'る' }, { romaji: 're', kana: 'れ' }, { romaji: 'ro', kana: 'ろ' },
    { romaji: 'wa', kana: 'わ' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: 'wo', kana: 'を' },
    { romaji: 'n', kana: 'ん' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: '', kana: '' },
  ];

  const katakanaChart = [
    { romaji: 'a', kana: 'ア' }, { romaji: 'i', kana: 'イ' }, { romaji: 'u', kana: 'ウ' }, { romaji: 'e', kana: 'エ' }, { romaji: 'o', kana: 'オ' },
    { romaji: 'ka', kana: 'カ' }, { romaji: 'ki', kana: 'キ' }, { romaji: 'ku', kana: 'ク' }, { romaji: 'ke', kana: 'ケ' }, { romaji: 'ko', kana: 'コ' },
    { romaji: 'sa', kana: 'サ' }, { romaji: 'shi', kana: 'シ' }, { romaji: 'su', kana: 'ス' }, { romaji: 'se', kana: 'セ' }, { romaji: 'so', kana: 'ソ' },
    { romaji: 'ta', kana: 'タ' }, { romaji: 'chi', kana: 'チ' }, { romaji: 'tsu', kana: 'ツ' }, { romaji: 'te', kana: 'テ' }, { romaji: 'to', kana: 'ト' },
    { romaji: 'na', kana: 'ナ' }, { romaji: 'ni', kana: 'ニ' }, { romaji: 'nu', kana: 'ヌ' }, { romaji: 'ne', kana: 'ネ' }, { romaji: 'no', kana: 'ノ' },
    { romaji: 'ha', kana: 'ハ' }, { romaji: 'hi', kana: 'ヒ' }, { romaji: 'fu', kana: 'フ' }, { romaji: 'he', kana: 'ヘ' }, { romaji: 'ho', kana: 'ホ' },
    { romaji: 'ma', kana: 'マ' }, { romaji: 'mi', kana: 'ミ' }, { romaji: 'mu', kana: 'ム' }, { romaji: 'me', kana: 'メ' }, { romaji: 'mo', kana: 'モ' },
    { romaji: 'ya', kana: 'ヤ' }, { romaji: '', kana: '' }, { romaji: 'yu', kana: 'ユ' }, { romaji: '', kana: '' }, { romaji: 'yo', kana: 'ヨ' },
    { romaji: 'ra', kana: 'ラ' }, { romaji: 'ri', kana: 'リ' }, { romaji: 'ru', kana: 'ル' }, { romaji: 're', kana: 'レ' }, { romaji: 'ro', kana: 'ロ' },
    { romaji: 'wa', kana: 'ワ' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: 'wo', kana: 'ヲ' },
    { romaji: 'n', kana: 'ン' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: '', kana: '' },
  ];

  const currentChart = activeTab === 'hiragana' ? hiraganaChart : katakanaChart;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">Kana Chart</h2>
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

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('hiragana')}
              className={`flex-1 px-3 py-2 text-xs sm:text-sm font-medium ${
                activeTab === 'hiragana'
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 active:bg-gray-50'
              }`}
            >
              ひらがな
            </button>
            <button
              onClick={() => setActiveTab('katakana')}
              className={`flex-1 px-3 py-2 text-xs sm:text-sm font-medium ${
                activeTab === 'katakana'
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 active:bg-gray-50'
              }`}
            >
              カタカナ
            </button>
          </div>

          {/* Chart Content */}
          <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(95vh-100px)]">
            <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
              {currentChart.map((item, index) => (
                <div
                  key={index}
                  className={`aspect-square flex flex-col items-center justify-center rounded ${
                    item.kana
                      ? 'bg-gray-50 border border-gray-200 active:bg-gray-100'
                      : ''
                  }`}
                >
                  {item.kana && (
                    <>
                      <span className="text-xl sm:text-2xl font-semibold text-gray-900">
                        {item.kana}
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                        {item.romaji}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
