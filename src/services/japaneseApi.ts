import type { JapaneseWord, ParsedWord, GrammarNote } from '../types';

const API_BASE = 'http://localhost:3001/api';

export interface SentenceTranslation {
  fullTranslation: string;
  wordOrder: string[];
  wordOrderDisplay: string;
  words: JapaneseWord[];
  grammarNotes?: GrammarNote[];
}

/**
 * Translates an entire sentence using AI for natural Japanese
 */
export async function translateSentence(
  sentence: string,
  parsedWords: ParsedWord[]
): Promise<SentenceTranslation> {
  const response = await fetch(`${API_BASE}/translate-sentence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sentence, parsedWords }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Translation failed');
  }

  return response.json();
}

/**
 * Health check for the API
 */
export async function checkApiHealth(): Promise<{ status: string; hasApiKey: boolean }> {
  const response = await fetch(`${API_BASE}/health`);
  return response.json();
}
