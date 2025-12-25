import type { JapaneseWord, ParsedWord } from '../types';

interface WordCardProps {
  englishWord: ParsedWord;
  japaneseWord: JapaneseWord | null;
  isSelected: boolean;
  userAnswer: string | null;
  isCorrect: boolean | null;
  onClick: () => void;
  showAnswer: boolean;
}

export function WordCard({
  englishWord,
  japaneseWord,
  isSelected,
  userAnswer,
  isCorrect,
  onClick,
  showAnswer
}: WordCardProps) {
  const getBorderColor = () => {
    if (isCorrect === true) return 'border-green-500 bg-green-50';
    if (isCorrect === false) return 'border-red-500 bg-red-50';
    if (isSelected) return 'border-blue-500 bg-blue-50';
    return 'border-gray-300 bg-white';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Blank slot */}
      <button
        onClick={onClick}
        className={`min-w-24 min-h-12 px-4 py-2 border-2 border-dashed rounded-lg text-lg font-medium transition-all ${getBorderColor()}`}
      >
        {userAnswer || (showAnswer && japaneseWord ? japaneseWord.japanese : '_____')}
      </button>

      {/* Japanese word card below */}
      {japaneseWord && (
        <div
          className={`flex flex-col items-center p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors ${
            userAnswer === japaneseWord.japanese ? 'opacity-50' : ''
          }`}
          onClick={onClick}
        >
          {/* Kanji */}
          <span className="text-xl font-bold text-gray-800">
            {japaneseWord.japanese}
            {japaneseWord.particle && (
              <span className="text-blue-600 ml-1">{japaneseWord.particle}</span>
            )}
          </span>

          {/* Furigana / Reading */}
          <span className="text-sm text-gray-600">
            {japaneseWord.reading}
          </span>

          {/* Romaji */}
          <span className="text-xs text-gray-500 italic">
            {japaneseWord.romaji}
          </span>

          {/* English meaning */}
          <span className="text-xs text-gray-400 mt-1">
            ({englishWord.text})
          </span>
        </div>
      )}

      {/* Loading state */}
      {!japaneseWord && (
        <div className="flex flex-col items-center p-3 bg-gray-100 rounded-lg animate-pulse">
          <div className="w-16 h-6 bg-gray-300 rounded"></div>
          <div className="w-12 h-4 bg-gray-300 rounded mt-1"></div>
        </div>
      )}
    </div>
  );
}
