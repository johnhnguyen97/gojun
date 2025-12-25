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
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-xl font-bold text-gray-800">Kana Chart</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-200"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('hiragana')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'hiragana'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Hiragana (ひらがな)
            </button>
            <button
              onClick={() => setActiveTab('katakana')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'katakana'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Katakana (カタカナ)
            </button>
          </div>

          {/* Chart Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="grid grid-cols-5 gap-2">
              {currentChart.map((item, index) => (
                <div
                  key={index}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all ${
                    item.kana
                      ? 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 hover:shadow-md hover:scale-105 cursor-pointer'
                      : 'bg-transparent'
                  }`}
                >
                  {item.kana && (
                    <>
                      <span className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                        {item.kana}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.romaji}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-gray-700">
                <strong>Tip:</strong> {activeTab === 'hiragana' ? 'Hiragana' : 'Katakana'} is used for{' '}
                {activeTab === 'hiragana'
                  ? 'native Japanese words, grammatical elements, and verb/adjective endings.'
                  : 'foreign words, loanwords, onomatopoeia, and emphasis.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
