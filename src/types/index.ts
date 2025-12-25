export interface JapaneseWord {
  english: string;
  japanese: string;      // kanji form
  reading: string;       // hiragana
  romaji: string;
  partOfSpeech: string;
  isTransitive?: boolean;
  particle?: string;           // suggested particle (を, が, に, etc.)
  particleMeaning?: string;    // what the particle means (e.g., "object marker", "at/in/on")
  particleExplanation?: string; // detailed explanation
}

export interface GrammarNote {
  title: string;
  titleJapanese?: string;
  explanation: string;
  example?: string;
  exampleTranslation?: string;
}

export interface ParsedWord {
  text: string;
  tag: string;           // POS tag from compromise
  role: 'subject' | 'verb' | 'verb-stem' | 'auxiliary' | 'object' | 'adjective' | 'adverb' | 'particle' | 'other';
}

export interface SentenceStructure {
  original: string;
  parsedWords: ParsedWord[];
  japaneseOrder: ParsedWord[];  // reordered for Japanese grammar
  wordOrderDisplay?: string;    // e.g., "Subject → Object → Verb"
  fullTranslation?: string;     // complete Japanese sentence
}

export interface WordSlot {
  id: string;
  englishWord: ParsedWord;
  japaneseWord: JapaneseWord | null;
  isFilledCorrectly: boolean | null;  // null = not attempted yet
  userAnswer: string | null;
}

export interface GrammarRule {
  id: string;
  name: string;
  nameJapanese: string;
  description: string;
  example?: string;
}
