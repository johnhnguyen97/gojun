import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not found in .env');
  process.exit(1);
}

// Test sentences
const TEST_SENTENCES = [
  {
    english: "I am eating",
    expectedPatterns: ['食べ', 'て', 'いる', 'います'],
    description: "Progressive form - should split ている"
  },
  {
    english: "I want to go",
    expectedPatterns: ['行き', 'たい'],
    description: "Desire form - should split たい"
  },
  {
    english: "I ate too much",
    expectedPatterns: ['食べ', 'すぎ', 'た'],
    description: "Too much + past - should split すぎた"
  },
  {
    english: "I have to study",
    expectedPatterns: ['勉強', 'し', 'なければ', 'ならない'],
    description: "Must/have to - should break down obligation"
  },
  {
    english: "The book is on the table",
    expectedPatterns: ['本', 'は', 'テーブル', 'の', '上', 'に', 'ある'],
    description: "Location - should separate particles"
  }
];

// Build the prompt (same as API)
function buildGrammarReference() {
  return `
=== GRAMMAR REFERENCE (Follow these rules for breakdown) ===

【PARTICLES - Always separate, never combine with words】
  は = Topic Marker: Marks the topic of sentence. Read as "wa".
  が = Subject Marker: Identifies subject, emphasizes new info.
  を = Object Marker: Marks direct object. Read as "o".
  に = Target/Location/Time: Direction, time, indirect object.
  で = Context Marker: Location of action, means, reason.
  の = Possessive/Nominalizer: Possession or turns verbs to nouns.

【VERB FORMS - Break into dictionary form + suffix】
  ます = Polite Form: Verb stem + ます
  て = Te-form: Various rules by verb type
  た = Plain Past: Same changes as te-form, て→た
  ない = Plain Negative: u→a + ない (u-verb), drop る + ない (ru-verb)
  たい = Want to: Verb stem + たい
  ている = Progressive/State: Te-form + いる

【GRAMMAR PATTERNS - Identify and explain】
  から = Because: Clause + から = reason
  なければならない = Must: Negative stem + なければならない
  すぎる = Too much: Verb stem/adj stem + すぎる

=== END REFERENCE ===
`;
}

function buildPrompt(sentence) {
  const grammarRef = buildGrammarReference();

  return `Translate to Japanese with word breakdown. Return ONLY valid JSON.
${grammarRef}

"${sentence}"

{"fullTranslation":"full sentence","wordOrderDisplay":"A → B → Verb","words":[{"english":"meaning","japanese":"日本語","reading":"ひらがな","romaji":"romaji","partOfSpeech":"noun","role":"subject"}],"grammarNotes":[{"title":"Point","titleJapanese":"ポイント","explanation":"Brief","atomicBreakdown":[{"component":"に","type":"particle","meaning":"direction/target"},{"component":"なる","type":"verb","meaning":"to become"}]}]}

Rules:
- NATURAL Japanese
- Particles as separate entries
- grammarNotes: max 2 notes
- ATOMIC GRAMMAR BREAKDOWN: Create SEPARATE entry for EACH component

  WRONG: [{"component":"食べている","type":"verb","meaning":"eating"}]
  CORRECT: [
    {"component":"食べる","type":"verb (dictionary form)","meaning":"to eat"},
    {"component":"て","type":"conjunctive particle","meaning":"te-form connector"},
    {"component":"いる","type":"auxiliary verb","meaning":"progressive/state"}
  ]

  MANDATORY:
  1. NEVER combine multiple morphemes
  2. ALWAYS show dictionary form first, then suffixes separately
  3. EVERY particle = separate entry
  4. EVERY verb suffix = separate entry

- MUST be valid JSON`;
}

async function testSentence(testCase) {
  console.log(`\n📝 Testing: "${testCase.english}"`);
  console.log(`   Description: ${testCase.description}`);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: buildPrompt(testCase.english) }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || response.status);
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }

    const result = JSON.parse(jsonMatch[0]);

    console.log(`   ✅ Translation: ${result.fullTranslation}`);

    // Check atomic breakdown
    let hasBreakdown = false;
    let breakdownIssues = [];

    if (result.grammarNotes && result.grammarNotes.length > 0) {
      for (const note of result.grammarNotes) {
        if (note.atomicBreakdown && note.atomicBreakdown.length > 0) {
          hasBreakdown = true;
          console.log(`   📊 Atomic Breakdown for "${note.title}":`);

          for (const atom of note.atomicBreakdown) {
            console.log(`      • ${atom.component} [${atom.type}] = ${atom.meaning || ''}`);

            // Check for issues
            if (atom.component.length > 5 && atom.type.includes('verb')) {
              breakdownIssues.push(`"${atom.component}" might not be fully atomic`);
            }
            if (/ている|ています|すぎた|すぎる|たい/.test(atom.component) && atom.component.length > 3) {
              breakdownIssues.push(`"${atom.component}" should be split further`);
            }
          }
        }
      }
    }

    if (!hasBreakdown) {
      console.log(`   ⚠️ No atomic breakdown found`);
    }

    if (breakdownIssues.length > 0) {
      console.log(`   ⚠️ Potential issues:`);
      breakdownIssues.forEach(issue => console.log(`      - ${issue}`));
    } else if (hasBreakdown) {
      console.log(`   ✅ Breakdown looks properly atomic!`);
    }

    return { success: true, result, issues: breakdownIssues };

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Grammar Breakdown Test Suite\n');
  console.log('=' .repeat(60));

  const results = [];

  for (const testCase of TEST_SENTENCES) {
    const result = await testSentence(testCase);
    results.push({ testCase, ...result });

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY:\n');

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  for (const r of results) {
    if (!r.success) {
      failed++;
      console.log(`❌ FAIL: "${r.testCase.english}" - ${r.error}`);
    } else if (r.issues && r.issues.length > 0) {
      warnings++;
      console.log(`⚠️ WARN: "${r.testCase.english}" - ${r.issues.length} issue(s)`);
    } else {
      passed++;
      console.log(`✅ PASS: "${r.testCase.english}"`);
    }
  }

  console.log(`\n📈 Results: ${passed} passed, ${warnings} warnings, ${failed} failed`);

  // Save results to file
  const outputPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);
}

runTests().catch(console.error);
