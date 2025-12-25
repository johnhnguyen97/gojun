import { useState } from 'react';

interface SentenceInputProps {
  onSubmit: (sentence: string) => void;
  isLoading: boolean;
}

export function SentenceInput({ onSubmit, isLoading }: SentenceInputProps) {
  const [sentence, setSentence] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sentence.trim()) {
      onSubmit(sentence.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-4">
        <label htmlFor="sentence-input" className="text-lg font-medium text-gray-700">
          Enter an English sentence:
        </label>
        <div className="flex gap-2">
          <input
            id="sentence-input"
            type="text"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="e.g., I eat sushi"
            className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !sentence.trim()}
            className="px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '変換中...' : '変換'}
          </button>
        </div>
      </div>
    </form>
  );
}
