import { useState } from 'react';

interface SentenceInputProps {
  onSubmit: (sentence: string) => void;
  isLoading: boolean;
}

export function SentenceInput({ onSubmit, isLoading }: SentenceInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (text.trim()) {
        onSubmit(text.trim());
      }
    }
  };

  // Count sentences
  const sentenceCount = text.trim()
    ? text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    : 0;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-3">
        <label htmlFor="sentence-input" className="text-lg font-medium text-gray-700">
          Enter English text (sentences or paragraphs):
        </label>
        <textarea
          id="sentence-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a sentence or paste a paragraph (up to 6 sentences)..."
          rows={4}
          className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-y"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {sentenceCount > 0 && `${sentenceCount} sentence${sentenceCount > 1 ? 's' : ''} detected`}
            {sentenceCount > 6 && ' • Only first 6 will be loaded'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Ctrl+Enter to submit</span>
            <button
              type="submit"
              disabled={isLoading || !text.trim()}
              className="px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '変換中...' : '変換'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
