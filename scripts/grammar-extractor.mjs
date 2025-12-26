import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PDF_PATH = path.join(__dirname, '..', 'grammar_guide.pdf');
const OUTPUT_DIR = path.join(__dirname, '..', 'grammar-data');

// Chapter patterns from Tae Kim's guide
const CHAPTER_PATTERNS = [
  { id: 'intro', title: 'Introduction', pattern: /^1\s+Introduction/i },
  { id: 'writing', title: 'The Writing System', pattern: /^2\s+The Writing System/i },
  { id: 'basic', title: 'Basic Grammar', pattern: /^3\s+Basic Grammar/i },
  { id: 'essential', title: 'Essential Grammar', pattern: /^4\s+Essential Grammar/i },
  { id: 'special', title: 'Special Expressions', pattern: /^5\s+Special Expressions/i },
  { id: 'advanced', title: 'Advanced Topics', pattern: /^6\s+Advanced Topics/i },
];

// Section patterns for grammar topics
const SECTION_PATTERNS = [
  // Writing System
  { chapter: 'writing', pattern: /Hiragana/i, topic: 'hiragana' },
  { chapter: 'writing', pattern: /Katakana/i, topic: 'katakana' },
  { chapter: 'writing', pattern: /Kanji/i, topic: 'kanji' },

  // Basic Grammar
  { chapter: 'basic', pattern: /State-of-Being|「だ」/i, topic: 'state-of-being' },
  { chapter: 'basic', pattern: /Particles|助詞/i, topic: 'particles' },
  { chapter: 'basic', pattern: /「は」.*topic/i, topic: 'particle-wa' },
  { chapter: 'basic', pattern: /「も」.*inclusive/i, topic: 'particle-mo' },
  { chapter: 'basic', pattern: /「が」.*identifier/i, topic: 'particle-ga' },
  { chapter: 'basic', pattern: /Adjectives/i, topic: 'adjectives' },
  { chapter: 'basic', pattern: /na-adjective/i, topic: 'na-adjectives' },
  { chapter: 'basic', pattern: /i-adjective/i, topic: 'i-adjectives' },
  { chapter: 'basic', pattern: /Verb Basics/i, topic: 'verbs-intro' },
  { chapter: 'basic', pattern: /ru-verbs.*u-verbs/i, topic: 'verb-classes' },
  { chapter: 'basic', pattern: /Negative Verbs/i, topic: 'negative-verbs' },
  { chapter: 'basic', pattern: /Past Tense/i, topic: 'past-tense' },
  { chapter: 'basic', pattern: /「を」.*particle/i, topic: 'particle-wo' },
  { chapter: 'basic', pattern: /「に」.*particle/i, topic: 'particle-ni' },
  { chapter: 'basic', pattern: /「へ」.*particle/i, topic: 'particle-e' },
  { chapter: 'basic', pattern: /「で」.*particle/i, topic: 'particle-de' },
  { chapter: 'basic', pattern: /Transitive.*Intransitive/i, topic: 'transitive-intransitive' },
  { chapter: 'basic', pattern: /Relative Clauses/i, topic: 'relative-clauses' },
  { chapter: 'basic', pattern: /「の」.*particle/i, topic: 'particle-no' },
  { chapter: 'basic', pattern: /Adverbs/i, topic: 'adverbs' },
  { chapter: 'basic', pattern: /「ね」|「よ」/i, topic: 'sentence-endings' },

  // Essential Grammar
  { chapter: 'essential', pattern: /Polite Form|〜ます/i, topic: 'polite-form' },
  { chapter: 'essential', pattern: /「です」/i, topic: 'desu' },
  { chapter: 'essential', pattern: /Addressing People/i, topic: 'addressing-people' },
  { chapter: 'essential', pattern: /Question Marker|「か」/i, topic: 'questions' },
  { chapter: 'essential', pattern: /Compound Sentences/i, topic: 'compound-sentences' },
  { chapter: 'essential', pattern: /te-form|て-form/i, topic: 'te-form' },
  { chapter: 'essential', pattern: /「から」|「ので」/i, topic: 'reason-causation' },
  { chapter: 'essential', pattern: /「のに」/i, topic: 'despite' },
  { chapter: 'essential', pattern: /Potential Form/i, topic: 'potential-form' },
  { chapter: 'essential', pattern: /「〜たい」/i, topic: 'desire-tai' },
  { chapter: 'essential', pattern: /「〜ている」/i, topic: 'continuous-state' },
  { chapter: 'essential', pattern: /Conditionals|「たら」|「なら」|「ば」|「と」/i, topic: 'conditionals' },
  { chapter: 'essential', pattern: /Expressing.*must|「〜なければ」/i, topic: 'must-should' },

  // Special Expressions
  { chapter: 'special', pattern: /Causative/i, topic: 'causative' },
  { chapter: 'special', pattern: /Passive/i, topic: 'passive' },
  { chapter: 'special', pattern: /Honorific|Humble/i, topic: 'keigo' },
  { chapter: 'special', pattern: /「〜そう」/i, topic: 'hearsay-appearance' },
  { chapter: 'special', pattern: /「〜よう」/i, topic: 'volitional' },
  { chapter: 'special', pattern: /「〜ばかり」/i, topic: 'bakari' },
];

// Recursive text splitter
function recursiveSplit(text, maxChunkSize = 1500, overlap = 200) {
  const separators = ['\n\n\n', '\n\n', '\n', '. ', ' '];
  const chunks = [];

  function splitRecursive(text, separatorIndex = 0) {
    if (text.length <= maxChunkSize) {
      return [text];
    }

    if (separatorIndex >= separators.length) {
      // Hard split if no separator works
      const result = [];
      for (let i = 0; i < text.length; i += maxChunkSize - overlap) {
        result.push(text.slice(i, i + maxChunkSize));
      }
      return result;
    }

    const separator = separators[separatorIndex];
    const parts = text.split(separator);

    if (parts.length === 1) {
      return splitRecursive(text, separatorIndex + 1);
    }

    const result = [];
    let currentChunk = '';

    for (const part of parts) {
      const potentialChunk = currentChunk ? currentChunk + separator + part : part;

      if (potentialChunk.length <= maxChunkSize) {
        currentChunk = potentialChunk;
      } else {
        if (currentChunk) {
          result.push(currentChunk);
        }
        if (part.length > maxChunkSize) {
          result.push(...splitRecursive(part, separatorIndex + 1));
          currentChunk = '';
        } else {
          currentChunk = part;
        }
      }
    }

    if (currentChunk) {
      result.push(currentChunk);
    }

    return result;
  }

  return splitRecursive(text);
}

// Extract vocabulary items from text
function extractVocabulary(text) {
  const vocabPattern = /(\d+)\.\s+([^\s【]+)【([^】]+)】\s*(?:\(([^)]+)\))?\s*[-–—]\s*(.+?)(?=\d+\.|$)/g;
  const vocabulary = [];
  let match;

  while ((match = vocabPattern.exec(text)) !== null) {
    vocabulary.push({
      number: parseInt(match[1]),
      word: match[2].trim(),
      reading: match[3].trim(),
      type: match[4]?.trim() || null,
      meaning: match[5].trim()
    });
  }

  return vocabulary;
}

// Extract grammar rules/patterns
function extractGrammarPatterns(text) {
  const patterns = [];

  // Pattern: 「X」 explanation
  const rulePattern = /「([^」]+)」\s*(?:[-–—]|means?|is|used)/gi;
  let match;

  while ((match = rulePattern.exec(text)) !== null) {
    const context = text.slice(Math.max(0, match.index - 50), Math.min(text.length, match.index + 200));
    patterns.push({
      pattern: match[1],
      context: context.trim()
    });
  }

  return patterns;
}

// Detect and extract tables (looking for aligned text patterns)
function extractTables(text) {
  const tables = [];
  const lines = text.split('\n');
  let tableLines = [];
  let inTable = false;

  for (const line of lines) {
    // Detect table-like patterns (multiple columns separated by spaces)
    const hasMultipleColumns = (line.match(/\s{3,}/g) || []).length >= 2;
    const hasJapaneseAndEnglish = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(line) && /[a-zA-Z]/.test(line);

    if (hasMultipleColumns && hasJapaneseAndEnglish) {
      inTable = true;
      tableLines.push(line);
    } else if (inTable && line.trim() === '') {
      if (tableLines.length >= 2) {
        tables.push({
          rows: tableLines.map(l => l.split(/\s{3,}/).map(c => c.trim()).filter(c => c))
        });
      }
      tableLines = [];
      inTable = false;
    }
  }

  return tables;
}

// Main extraction function
async function extractGrammarData() {
  console.log('📚 Extracting grammar data from PDF...\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const data = new Uint8Array(fs.readFileSync(PDF_PATH));
  const doc = await getDocument({ data, useSystemFonts: true }).promise;

  console.log(`Total pages: ${doc.numPages}\n`);

  const grammarData = {
    metadata: {
      title: "Tae Kim's Japanese Grammar Guide",
      author: "Tae Kim",
      extractedAt: new Date().toISOString(),
      totalPages: doc.numPages
    },
    chapters: [],
    sections: [],
    vocabulary: [],
    grammarRules: []
  };

  let currentChapter = null;
  let currentSection = null;
  let allText = '';

  // Extract text page by page
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    allText += pageText + '\n\n';

    // Check for chapter headings
    for (const chapter of CHAPTER_PATTERNS) {
      if (chapter.pattern.test(pageText)) {
        currentChapter = {
          id: chapter.id,
          title: chapter.title,
          startPage: i,
          content: ''
        };
        grammarData.chapters.push(currentChapter);
        console.log(`📖 Found chapter: ${chapter.title} (page ${i})`);
      }
    }

    if (currentChapter) {
      currentChapter.content += pageText + '\n\n';
    }

    // Extract vocabulary from this page
    const vocab = extractVocabulary(pageText);
    if (vocab.length > 0) {
      grammarData.vocabulary.push(...vocab.map(v => ({ ...v, page: i })));
    }

    // Progress indicator
    if (i % 50 === 0) {
      console.log(`  Processing page ${i}/${doc.numPages}...`);
    }
  }

  console.log(`\n✅ Extracted ${grammarData.chapters.length} chapters`);
  console.log(`✅ Found ${grammarData.vocabulary.length} vocabulary items`);

  // Process each chapter into sections with recursive splitting
  console.log('\n🔄 Processing chapters into sections...\n');

  for (const chapter of grammarData.chapters) {
    const chunks = recursiveSplit(chapter.content, 1500, 200);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Try to identify the topic
      let topic = 'general';
      for (const pattern of SECTION_PATTERNS) {
        if (pattern.chapter === chapter.id && pattern.pattern.test(chunk)) {
          topic = pattern.topic;
          break;
        }
      }

      // Extract grammar patterns from chunk
      const patterns = extractGrammarPatterns(chunk);
      const tables = extractTables(chunk);

      grammarData.sections.push({
        id: `${chapter.id}-${i + 1}`,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        topic: topic,
        chunkIndex: i + 1,
        totalChunks: chunks.length,
        content: chunk.trim(),
        grammarPatterns: patterns.slice(0, 10), // Limit patterns
        tables: tables,
        characterCount: chunk.length
      });
    }

    console.log(`  ${chapter.title}: ${chunks.length} sections`);
  }

  // Create grammar rules summary
  console.log('\n📝 Extracting grammar rules...\n');

  const grammarRules = [
    // Particles
    { id: 'wa', pattern: 'は', name: 'Topic Marker', category: 'particle', description: 'Marks the topic of the sentence' },
    { id: 'ga', pattern: 'が', name: 'Subject Marker', category: 'particle', description: 'Identifies the subject, emphasizes new information' },
    { id: 'wo', pattern: 'を', name: 'Object Marker', category: 'particle', description: 'Marks the direct object of a verb' },
    { id: 'ni', pattern: 'に', name: 'Target/Location', category: 'particle', description: 'Indicates direction, time, or indirect object' },
    { id: 'de', pattern: 'で', name: 'Context', category: 'particle', description: 'Indicates location of action, means, or reason' },
    { id: 'e', pattern: 'へ', name: 'Direction', category: 'particle', description: 'Indicates direction of movement' },
    { id: 'to', pattern: 'と', name: 'And/With', category: 'particle', description: 'Exhaustive listing or accompaniment' },
    { id: 'ya', pattern: 'や', name: 'And (partial)', category: 'particle', description: 'Non-exhaustive listing' },
    { id: 'no', pattern: 'の', name: 'Possessive/Nominalizer', category: 'particle', description: 'Shows possession or turns verbs into nouns' },
    { id: 'mo', pattern: 'も', name: 'Also/Too', category: 'particle', description: 'Inclusive particle meaning "also" or "too"' },
    { id: 'ka', pattern: 'か', name: 'Question', category: 'particle', description: 'Question marker' },
    { id: 'ne', pattern: 'ね', name: 'Confirmation', category: 'particle', description: 'Seeks agreement or confirmation' },
    { id: 'yo', pattern: 'よ', name: 'Emphasis', category: 'particle', description: 'Emphasizes information the listener may not know' },

    // Verb conjugations
    { id: 'masu', pattern: '〜ます', name: 'Polite Form', category: 'conjugation', description: 'Polite present/future tense' },
    { id: 'mashita', pattern: '〜ました', name: 'Polite Past', category: 'conjugation', description: 'Polite past tense' },
    { id: 'masen', pattern: '〜ません', name: 'Polite Negative', category: 'conjugation', description: 'Polite negative form' },
    { id: 'te', pattern: '〜て', name: 'Te-form', category: 'conjugation', description: 'Connecting form for requests, progressive, etc.' },
    { id: 'ta', pattern: '〜た', name: 'Plain Past', category: 'conjugation', description: 'Plain past tense' },
    { id: 'nai', pattern: '〜ない', name: 'Plain Negative', category: 'conjugation', description: 'Plain negative form' },
    { id: 'nakatta', pattern: '〜なかった', name: 'Past Negative', category: 'conjugation', description: 'Past negative form' },

    // Grammar patterns
    { id: 'teiru', pattern: '〜ている', name: 'Progressive/State', category: 'grammar', description: 'Ongoing action or resulting state' },
    { id: 'tai', pattern: '〜たい', name: 'Want to', category: 'grammar', description: 'Expresses desire to do something' },
    { id: 'koto', pattern: '〜こと', name: 'Nominalizer', category: 'grammar', description: 'Turns verbs into noun phrases' },
    { id: 'tara', pattern: '〜たら', name: 'Conditional', category: 'grammar', description: 'If/when conditional' },
    { id: 'ba', pattern: '〜ば', name: 'Conditional', category: 'grammar', description: 'If conditional (hypothetical)' },
    { id: 'nara', pattern: '〜なら', name: 'Conditional', category: 'grammar', description: 'If (contextual/topical)' },
    { id: 'to', pattern: '〜と', name: 'Conditional', category: 'grammar', description: 'Natural/automatic consequence' },
    { id: 'kara', pattern: '〜から', name: 'Because', category: 'grammar', description: 'Expresses reason or cause' },
    { id: 'node', pattern: '〜ので', name: 'Because (polite)', category: 'grammar', description: 'Softer way to express reason' },
    { id: 'noni', pattern: '〜のに', name: 'Despite', category: 'grammar', description: 'Despite, although, even though' },
    { id: 'nakereba', pattern: '〜なければ', name: 'Must', category: 'grammar', description: 'Must do, have to' },
    { id: 'nakutemo', pattern: '〜なくてもいい', name: 'Don\'t have to', category: 'grammar', description: 'Not necessary to do' },
    { id: 'sou', pattern: '〜そう', name: 'Appearance/Hearsay', category: 'grammar', description: 'Looks like / I heard that' },
    { id: 'you', pattern: '〜よう', name: 'Volitional', category: 'grammar', description: 'Let\'s / intend to' },
    { id: 'rareru', pattern: '〜られる', name: 'Potential/Passive', category: 'grammar', description: 'Can do / is done' },
    { id: 'saseru', pattern: '〜させる', name: 'Causative', category: 'grammar', description: 'Make/let someone do' },
  ];

  grammarData.grammarRules = grammarRules;
  console.log(`✅ Added ${grammarRules.length} grammar rules`);

  // Save all data
  console.log('\n💾 Saving data...\n');

  // Main grammar data
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'grammar-guide.json'),
    JSON.stringify(grammarData, null, 2)
  );

  // Sections only (for Supabase upload)
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'sections.json'),
    JSON.stringify(grammarData.sections, null, 2)
  );

  // Vocabulary only
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'vocabulary.json'),
    JSON.stringify(grammarData.vocabulary, null, 2)
  );

  // Grammar rules only
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'rules.json'),
    JSON.stringify(grammarData.grammarRules, null, 2)
  );

  // Stats
  const stats = {
    chapters: grammarData.chapters.length,
    sections: grammarData.sections.length,
    vocabulary: grammarData.vocabulary.length,
    grammarRules: grammarData.grammarRules.length,
    totalCharacters: grammarData.sections.reduce((sum, s) => sum + s.characterCount, 0)
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'stats.json'),
    JSON.stringify(stats, null, 2)
  );

  console.log('📊 Stats:');
  console.log(`   Chapters: ${stats.chapters}`);
  console.log(`   Sections: ${stats.sections}`);
  console.log(`   Vocabulary items: ${stats.vocabulary}`);
  console.log(`   Grammar rules: ${stats.grammarRules}`);
  console.log(`   Total characters: ${stats.totalCharacters.toLocaleString()}`);
  console.log(`\n✅ All data saved to: ${OUTPUT_DIR}`);

  return grammarData;
}

extractGrammarData().catch(console.error);
