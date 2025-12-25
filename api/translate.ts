import type { VercelRequest, VercelResponse } from '@vercel/node';

const JishoAPI = require('unofficial-jisho-api');
const jisho = new JishoAPI();

interface TranslationResult {
  english: string;
  japanese: string;
  reading: string;
  romaji: string;
  partOfSpeech: string;
  isTransitive?: boolean;
  particle?: string;
}

// Common particles based on grammatical role
function suggestParticle(partOfSpeech: string, role?: string): string | undefined {
  if (role === 'subject') {
    return 'は'; // topic marker (most common for subject)
  }
  if (role === 'object') {
    return 'を'; // direct object marker
  }
  return undefined;
}

// Check if a verb is transitive based on common patterns
function checkTransitivity(word: string, partsOfSpeech: string[]): boolean | undefined {
  const posString = partsOfSpeech.join(' ').toLowerCase();

  if (posString.includes('transitive')) {
    return true;
  }
  if (posString.includes('intransitive')) {
    return false;
  }
  return undefined;
}

// Convert hiragana to romaji (basic conversion)
function hiraganaToRomaji(hiragana: string): string {
  const map: { [key: string]: string } = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'di', 'づ': 'du', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
    'っ': '', // small tsu (doubles next consonant)
    'ー': '-', // long vowel mark
  };

  let result = '';
  let i = 0;

  while (i < hiragana.length) {
    // Check for two-character combinations first
    if (i + 1 < hiragana.length) {
      const twoChar = hiragana.substring(i, i + 2);
      if (map[twoChar]) {
        result += map[twoChar];
        i += 2;
        continue;
      }
    }

    // Single character
    const char = hiragana[i];
    if (map[char] !== undefined) {
      // Handle small tsu (っ) - double the next consonant
      if (char === 'っ' && i + 1 < hiragana.length) {
        const nextRomaji = map[hiragana[i + 1]];
        if (nextRomaji && nextRomaji.length > 0) {
          result += nextRomaji[0];
        }
      } else {
        result += map[char];
      }
    } else {
      result += char; // Keep as-is if not in map
    }
    i++;
  }

  return result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { word, role } = req.query;

  if (!word || typeof word !== 'string') {
    return res.status(400).json({ error: 'Word parameter is required' });
  }

  try {
    const result = await jisho.searchForPhrase(word);

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ error: 'Word not found' });
    }

    const entry = result.data[0];
    const japanese = entry.japanese[0];
    const sense = entry.senses[0];

    const reading = japanese.reading || japanese.word || '';
    const partsOfSpeech = sense.parts_of_speech || [];

    const translation: TranslationResult = {
      english: word,
      japanese: japanese.word || reading,
      reading: reading,
      romaji: hiraganaToRomaji(reading),
      partOfSpeech: partsOfSpeech[0] || 'Unknown',
      isTransitive: checkTransitivity(word, partsOfSpeech),
      particle: suggestParticle(partsOfSpeech[0] || '', role as string)
    };

    return res.status(200).json(translation);
  } catch (error) {
    console.error('Jisho API error:', error);
    return res.status(500).json({ error: 'Failed to fetch translation' });
  }
}
