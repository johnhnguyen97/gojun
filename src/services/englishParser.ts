import nlp from 'compromise';
import type { ParsedWord, SentenceStructure } from '../types';

/**
 * Determines the grammatical role of a word based on its POS tag and position
 */
function determineRole(tag: string, _text: string, index: number, allTerms: any[]): ParsedWord['role'] {
  const lowerTag = tag.toLowerCase();

  // Check for pronouns and nouns that could be subjects
  if (lowerTag.includes('pronoun') || lowerTag.includes('noun')) {
    // First noun/pronoun is typically the subject
    const previousNouns = allTerms.slice(0, index).filter(t =>
      t.tags.some((tag: string) => tag.toLowerCase().includes('noun') || tag.toLowerCase().includes('pronoun'))
    );

    if (previousNouns.length === 0) {
      return 'subject';
    }

    // Check if it comes after a verb (likely object)
    const hasVerbBefore = allTerms.slice(0, index).some(t =>
      t.tags.some((tag: string) => tag.toLowerCase().includes('verb'))
    );

    if (hasVerbBefore) {
      return 'object';
    }

    return 'object';
  }

  if (lowerTag.includes('verb')) {
    return 'verb';
  }

  if (lowerTag.includes('adjective')) {
    return 'adjective';
  }

  if (lowerTag.includes('adverb')) {
    return 'adverb';
  }

  return 'other';
}

/**
 * Parses an English sentence and extracts word information
 */
export function parseEnglishSentence(sentence: string): SentenceStructure {
  const doc = nlp(sentence);
  const terms = doc.terms().json();

  const parsedWords: ParsedWord[] = terms.map((term: any, index: number) => {
    const tags = term.tags || [];
    const primaryTag = tags[0] || 'Unknown';

    return {
      text: term.text,
      tag: primaryTag,
      role: determineRole(primaryTag, term.text, index, terms)
    };
  });

  // Reorder to Japanese structure: Subject + Object + Verb (SOV)
  const japaneseOrder = reorderToJapanese(parsedWords);

  return {
    original: sentence,
    parsedWords,
    japaneseOrder
  };
}

/**
 * Reorders parsed words to Japanese grammatical structure (SOV)
 * Japanese word order: Time > Subject > Object > Verb
 * Adjectives come before nouns, adverbs before verbs
 */
function reorderToJapanese(words: ParsedWord[]): ParsedWord[] {
  const subjects: ParsedWord[] = [];
  const objects: ParsedWord[] = [];
  const verbs: ParsedWord[] = [];
  const adjectives: ParsedWord[] = [];
  const adverbs: ParsedWord[] = [];
  const others: ParsedWord[] = [];

  // Categorize words
  for (const word of words) {
    switch (word.role) {
      case 'subject':
        subjects.push(word);
        break;
      case 'object':
        objects.push(word);
        break;
      case 'verb':
        verbs.push(word);
        break;
      case 'adjective':
        adjectives.push(word);
        break;
      case 'adverb':
        adverbs.push(word);
        break;
      default:
        others.push(word);
    }
  }

  // Build Japanese order:
  // 1. Subject (with any adjectives that modify it)
  // 2. Object (with any adjectives that modify it)
  // 3. Adverbs
  // 4. Verb
  const result: ParsedWord[] = [];

  // Add subjects
  result.push(...subjects);

  // Add objects (adjectives should ideally be attached to what they modify)
  result.push(...adjectives);
  result.push(...objects);

  // Add adverbs before verb
  result.push(...adverbs);

  // Add verbs at the end
  result.push(...verbs);

  // Add any other words
  result.push(...others);

  return result;
}

/**
 * Get a simple description of the sentence structure
 */
export function describeSentenceStructure(structure: SentenceStructure): string {
  const roles = structure.parsedWords.map(w => w.role);

  if (roles.includes('subject') && roles.includes('verb') && roles.includes('object')) {
    return 'SVO (Subject-Verb-Object) → SOV in Japanese';
  }

  if (roles.includes('subject') && roles.includes('verb')) {
    return 'SV (Subject-Verb) → SV in Japanese';
  }

  return 'Simple sentence';
}
