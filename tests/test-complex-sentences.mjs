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

// Complex test sentences
const COMPLEX_SENTENCES = [
  // === BUSINESS / FORMAL ===
  {
    english: "I would like to schedule a meeting with you next week if you have time.",
    category: "Business",
    description: "Formal request with conditional"
  },
  {
    english: "We sincerely apologize for any inconvenience this may have caused.",
    category: "Business",
    description: "Formal apology with causative"
  },
  {
    english: "Could you please send me the report by the end of the day?",
    category: "Business",
    description: "Polite request with deadline"
  },
  {
    english: "I have been working at this company for five years.",
    category: "Business",
    description: "Duration with progressive state"
  },

  // === EMOTIONAL / INNER THOUGHTS ===
  {
    english: "I wonder if she still thinks about me sometimes.",
    category: "Emotion",
    description: "Inner monologue with uncertainty"
  },
  {
    english: "I can't help but feel that something is wrong.",
    category: "Emotion",
    description: "Uncontrollable feeling expression"
  },
  {
    english: "If only I had told her how I really felt back then.",
    category: "Emotion",
    description: "Regret about the past"
  },
  {
    english: "I'm so happy that I could cry.",
    category: "Emotion",
    description: "Extreme emotion expression"
  },
  {
    english: "No matter how hard I try, I just can't forget what happened.",
    category: "Emotion",
    description: "Frustration with inability"
  },

  // === COMPLEX EVERYDAY ===
  {
    english: "By the time I got to the station, the train had already left.",
    category: "Everyday",
    description: "Past perfect with time expression"
  },
  {
    english: "I heard that the new restaurant that opened downtown is really good.",
    category: "Everyday",
    description: "Hearsay with relative clause"
  },
  {
    english: "Even though it was raining, we decided to go hiking anyway.",
    category: "Everyday",
    description: "Concession with decision"
  },
  {
    english: "The more I study Japanese, the more I realize how difficult it is.",
    category: "Everyday",
    description: "Comparative correlation"
  },
  {
    english: "I should have brought an umbrella because it looks like it's going to rain.",
    category: "Everyday",
    description: "Regret with prediction"
  },

  // === PHILOSOPHICAL / ABSTRACT ===
  {
    english: "Sometimes I wonder what my life would have been like if I had made different choices.",
    category: "Abstract",
    description: "Hypothetical past reflection"
  },
  {
    english: "It's not that I don't want to help, it's just that I don't have time right now.",
    category: "Abstract",
    description: "Complex negation with explanation"
  }
];

function buildGrammarReference() {
  return `
=== GRAMMAR REFERENCE (Follow these rules for breakdown) ===

【PARTICLES】
  は = Topic Marker | が = Subject | を = Object | に = Target/Location/Time
  で = Context/Means | へ = Direction | と = And/With/Quote | も = Also
  の = Possessive | か = Question | ね = Confirmation | よ = Emphasis
  から = From/Because | まで = Until | より = Than | ば = If (conditional)

【VERB FORMS】
  ます/ません/ました = Polite forms
  て/た = Te-form / Past
  ない/なかった = Negative / Past negative
  たい/たがる = Want to
  ている/ていた = Progressive/State
  られる/られた = Potential/Passive
  させる/させられる = Causative / Causative-passive
  ば/たら/なら = Conditionals
  よう/おう = Volitional

【GRAMMAR PATTERNS】
  〜てしまう = Completion/Regret
  〜ことができる = Can do
  〜かもしれない = Might
  〜はずだ = Should be/Expected
  〜そうだ = Looks like / I heard
  〜ようだ/みたいだ = Seems like
  〜なければならない = Must
  〜てもいい = May/Can
  〜のに = Despite/Although
  〜ので/から = Because
  〜ても = Even if
  〜ば〜ほど = The more... the more

【HONORIFIC/HUMBLE】
  お/ご + verb stem = Honorific prefix
  〜ていただく = Receive (humble)
  〜させていただく = Allow me to (humble)
  〜でございます = Is (very polite)

=== END REFERENCE ===
`;
}

function buildPrompt(sentence) {
  const grammarRef = buildGrammarReference();

  return `Translate this COMPLEX sentence to natural Japanese with detailed word breakdown. Return ONLY valid JSON.
${grammarRef}

"${sentence}"

Required JSON format:
{
  "fullTranslation": "complete Japanese sentence",
  "wordOrderDisplay": "Component → Component → Verb",
  "words": [
    {"english": "word", "japanese": "日本語", "reading": "ひらがな", "romaji": "romaji", "partOfSpeech": "type", "role": "grammatical role", "particle": "associated particle if any", "particleMeaning": "particle meaning"}
  ],
  "grammarNotes": [
    {
      "title": "Grammar Point Name",
      "titleJapanese": "日本語名",
      "explanation": "Brief explanation of this grammar pattern",
      "atomicBreakdown": [
        {"component": "X", "type": "grammatical type", "meaning": "English meaning"}
      ]
    }
  ]
}

CRITICAL RULES FOR COMPLEX SENTENCES:
1. Break down EVERY compound expression into atomic parts
2. Show dictionary forms of verbs, then each suffix separately
3. For causative-passive (させられる), show: させ + られる
4. For ていただく patterns, show: て + いただく
5. For のに/ので, show: の + に/で or explain nominalization
6. For conditional chains, break down each conditional marker
7. For hearsay (そうだ/らしい), separate from verb
8. For volitional + とする, show separately
9. NEVER combine multiple grammar points into one component
10. Each particle MUST be a separate entry
11. For できない, ALWAYS show: でき + ない (potential stem + negative)
12. For する-verbs like オープンする, ALWAYS show: オープン + する
13. For した (past する), ALWAYS show: し + た

Example of CORRECT breakdown for "食べさせられている":
[
  {"component": "食べる", "type": "verb (dictionary)", "meaning": "to eat"},
  {"component": "させ", "type": "causative suffix", "meaning": "make/let do"},
  {"component": "られ", "type": "passive suffix", "meaning": "is done to"},
  {"component": "て", "type": "te-form", "meaning": "conjunctive"},
  {"component": "いる", "type": "auxiliary", "meaning": "continuous state"}
]

Example of CORRECT breakdown for "できない":
[
  {"component": "でき", "type": "potential stem", "meaning": "can do / be able to"},
  {"component": "ない", "type": "negative auxiliary", "meaning": "not / negation"}
]

Example of CORRECT breakdown for "勉強する":
[
  {"component": "勉強", "type": "verbal noun", "meaning": "study"},
  {"component": "する", "type": "verb (dictionary)", "meaning": "to do"}
]

MUST be valid JSON - no trailing commas`;
}

async function testSentence(testCase, index) {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📝 Test ${index + 1}: [${testCase.category}]`);
  console.log(`   "${testCase.english}"`);
  console.log(`   ${testCase.description}`);

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
        max_tokens: 3000,
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

    console.log(`\n   ✅ Translation: ${result.fullTranslation}`);
    console.log(`   📐 Word Order: ${result.wordOrderDisplay || 'N/A'}`);

    // Analyze breakdown quality
    let totalComponents = 0;
    let issues = [];
    let goodBreakdowns = 0;

    if (result.grammarNotes && result.grammarNotes.length > 0) {
      console.log(`\n   📊 Grammar Analysis:`);

      for (const note of result.grammarNotes) {
        console.log(`\n   【${note.title}】${note.titleJapanese ? ` (${note.titleJapanese})` : ''}`);
        console.log(`      ${note.explanation || ''}`);

        if (note.atomicBreakdown && note.atomicBreakdown.length > 0) {
          console.log(`      Breakdown:`);

          for (const atom of note.atomicBreakdown) {
            totalComponents++;
            const comp = atom.component;
            console.log(`        • ${comp} [${atom.type}] → ${atom.meaning || ''}`);

            // Check for issues - things that should be split further
            if (comp.length > 4) {
              // Long component that's not just kanji - check for compound forms
              if (/ている|ていた|ています|させられ|てしまう|ていただ|なければ|かもしれ|できない|できません/.test(comp) && comp.length > 4) {
                issues.push(`"${comp}" should be split further`);
              }
              // Suru-verb compounds that weren't split
              if (/する$/.test(comp) && comp.length > 2) {
                issues.push(`"${comp}" - suru-verb should be split`);
              }
              // Past suru-verbs
              if (/した$/.test(comp) && comp.length > 2) {
                issues.push(`"${comp}" - past suru-verb should be split`);
              }
            }

            // Check for good atomic breakdown
            const isAtomic = (
              comp.length <= 3 ||
              atom.type.includes('dictionary') ||
              atom.type.includes('particle') ||
              atom.type.includes('stem') ||
              atom.type.includes('auxiliary') ||
              atom.type.includes('suffix') ||
              atom.type.includes('copula') ||
              /^[一-龯]{1,4}$/.test(comp)  // 1-4 kanji characters
            );
            if (isAtomic) {
              goodBreakdowns++;
            }
          }
        }
      }
    }

    // Quality assessment
    const atomicRatio = totalComponents > 0 ? (goodBreakdowns / totalComponents) : 0;

    console.log(`\n   📈 Quality Metrics:`);
    console.log(`      Components: ${totalComponents}`);
    console.log(`      Atomic ratio: ${(atomicRatio * 100).toFixed(0)}%`);

    if (issues.length > 0) {
      console.log(`      ⚠️ Issues found:`);
      issues.forEach(i => console.log(`         - ${i}`));
    }

    const status = issues.length === 0 ? 'PASS' : (issues.length <= 2 ? 'WARN' : 'FAIL');
    console.log(`      Status: ${status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌'} ${status}`);

    return {
      success: true,
      status,
      testCase,
      result,
      metrics: { totalComponents, goodBreakdowns, atomicRatio, issues }
    };

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, status: 'ERROR', testCase, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Complex Sentence Grammar Breakdown Test\n');
  console.log('Testing business, emotional, and complex everyday sentences');
  console.log('═'.repeat(70));

  const results = [];
  const categories = {};

  for (let i = 0; i < COMPLEX_SENTENCES.length; i++) {
    const testCase = COMPLEX_SENTENCES[i];
    const result = await testSentence(testCase, i);
    results.push(result);

    // Track by category
    if (!categories[testCase.category]) {
      categories[testCase.category] = { pass: 0, warn: 0, fail: 0, error: 0 };
    }
    categories[testCase.category][result.status.toLowerCase()]++;

    // Delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1500));
  }

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('\n📊 FINAL SUMMARY\n');

  console.log('By Category:');
  for (const [cat, stats] of Object.entries(categories)) {
    const total = stats.pass + stats.warn + stats.fail + stats.error;
    console.log(`  ${cat}: ${stats.pass}✅ ${stats.warn}⚠️ ${stats.fail}❌ ${stats.error}💥 (${total} total)`);
  }

  const totals = { pass: 0, warn: 0, fail: 0, error: 0 };
  results.forEach(r => totals[r.status.toLowerCase()]++);

  console.log(`\nOverall: ${totals.pass} passed, ${totals.warn} warnings, ${totals.fail} failed, ${totals.error} errors`);
  console.log(`Total: ${results.length} sentences tested`);

  // Save detailed results
  const outputPath = path.join(__dirname, 'complex-test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Detailed results saved to: ${outputPath}`);

  // Performance summary
  const avgComponents = results
    .filter(r => r.metrics)
    .reduce((sum, r) => sum + r.metrics.totalComponents, 0) / results.filter(r => r.metrics).length;

  const avgAtomicRatio = results
    .filter(r => r.metrics)
    .reduce((sum, r) => sum + r.metrics.atomicRatio, 0) / results.filter(r => r.metrics).length;

  console.log(`\n📐 Performance:`);
  console.log(`   Avg components per sentence: ${avgComponents.toFixed(1)}`);
  console.log(`   Avg atomic ratio: ${(avgAtomicRatio * 100).toFixed(0)}%`);
}

runTests().catch(console.error);
