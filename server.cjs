const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Translate entire sentence using Claude AI
app.post('/api/translate-sentence', async (req, res) => {
  const { sentence, parsedWords } = req.body;

  if (!sentence) {
    return res.status(400).json({ error: 'Sentence is required' });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const prompt = `You are a Japanese language expert. Translate this English sentence into natural Japanese and BREAK DOWN EVERY CONJUGATED WORD into its component parts.

English: "${sentence}"

Respond with ONLY valid JSON (no markdown):
{
  "fullTranslation": "complete Japanese sentence",
  "wordOrder": ["role1", "particle", "role2"],
  "wordOrderDisplay": "Pattern description",
  "words": [array of word objects],
  "grammarNotes": [array of grammar explanations]
}

CRITICAL RULE - BREAK DOWN EVERYTHING:
Any word that is NOT in its dictionary/base form MUST be split into stem + ending(s).

=== VERB BREAKDOWNS ===

Past tense (た/だ):
"ate" → 食べた = 食べ (tabe, "eat", verb-stem) + た (ta, "past", auxiliary)
"wrote" → 書いた = 書い (kai, "write", verb-stem) + た (ta, "past", auxiliary)
"went" → 行った = 行っ (it, "go", verb-stem) + た (ta, "past", auxiliary)

Negative (ない):
"don't eat" → 食べない = 食べ (tabe, "eat", verb-stem) + ない (nai, "not", auxiliary)
"don't write" → 書かない = 書か (kaka, "write", verb-stem) + ない (nai, "not", auxiliary)

Past negative (なかった):
"didn't eat" → 食べなかった = 食べ (tabe, "eat", verb-stem) + なかった (nakatta, "didn't", auxiliary)

Te-form + いる (continuous):
"am eating" → 食べている = 食べて (tabete, "eat", te-form) + いる (iru, "-ing", auxiliary)
"is writing" → 書いている = 書いて (kaite, "write", te-form) + いる (iru, "-ing", auxiliary)

Te-form + いた (past continuous):
"was eating" → 食べていた = 食べて (tabete, "eat", te-form) + い (i, "being", auxiliary) + た (ta, "past", auxiliary)

Want to (たい):
"want to eat" → 食べたい = 食べ (tabe, "eat", verb-stem) + たい (tai, "want to", auxiliary)

Potential (られる/える):
"can eat" → 食べられる = 食べ (tabe, "eat", verb-stem) + られる (rareru, "can", auxiliary)
"can write" → 書ける = 書け (kake, "write", verb-stem) + る (ru, "can", auxiliary)

Passive/Causative:
"was eaten" → 食べられた = 食べ (tabe, "eat", verb-stem) + られ (rare, "passive", auxiliary) + た (ta, "past", auxiliary)

Polite (ます):
"eat (polite)" → 食べます = 食べ (tabe, "eat", verb-stem) + ます (masu, "polite", auxiliary)
"ate (polite)" → 食べました = 食べ (tabe, "eat", verb-stem) + ました (mashita, "polite past", auxiliary)

=== ADJECTIVE BREAKDOWNS ===

I-adjectives past (かった):
"was interesting" → 面白かった = 面白 (omoshiro, "interesting", adj-stem) + かった (katta, "was", auxiliary)
"was big" → 大きかった = 大き (ooki, "big", adj-stem) + かった (katta, "was", auxiliary)

I-adjectives negative (くない):
"not interesting" → 面白くない = 面白く (omoshiroku, "interesting", adj-stem) + ない (nai, "not", auxiliary)

I-adjectives past negative (くなかった):
"wasn't big" → 大きくなかった = 大きく (ookiku, "big", adj-stem) + なかった (nakatta, "wasn't", auxiliary)

Na-adjectives past (だった):
"was quiet" → 静かだった = 静か (shizuka, "quiet", adj-stem) + だった (datta, "was", auxiliary)

Na-adjectives negative (じゃない/ではない):
"not quiet" → 静かじゃない = 静か (shizuka, "quiet", adj-stem) + じゃない (janai, "not", auxiliary)

=== COPULA BREAKDOWNS ===

"was (a student)" → 学生だった = 学生 (gakusei, "student", noun) + だった (datta, "was", auxiliary)
"is not" → じゃない = じゃ (ja, "is", copula-stem) + ない (nai, "not", auxiliary)

=== COMPOUND BREAKDOWNS ===

"must eat" → 食べなければならない = 食べ (tabe, "eat", verb-stem) + なければ (nakereba, "if not", auxiliary) + ならない (naranai, "won't do", auxiliary)

"might go" → 行くかもしれない = 行く (iku, "go", verb) + かもしれない (kamoshirenai, "might", auxiliary)

=== ALWAYS SEPARATE PARTICLES ===
Every particle (は, が, を, に, で, へ, と, も, の, から, まで, より) = separate entry with role="particle"

=== WORD ENTRY FORMAT ===
{
  "english": "meaning",
  "role": "noun|verb|verb-stem|adj-stem|particle|auxiliary|adverb",
  "japanese": "kanji/kana",
  "reading": "hiragana",
  "romaji": "romaji",
  "partOfSpeech": "descriptive type",
  "particleMeaning": "for particles/auxiliaries: short meaning",
  "particleExplanation": "why used here"
}

=== NATURAL JAPANESE RULES ===
1. DROP pronouns (私, あなた) unless emphasizing
2. Use dictionary form for casual speech
3. Follow SOV order
4. Skip English articles (a, the)

=== GRAMMAR NOTES FORMAT ===
{
  "title": "Grammar point",
  "titleJapanese": "日本語名",
  "explanation": "Clear explanation",
  "example": "Example sentence",
  "exampleTranslation": "Translation"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error status:', response.status);
      console.error('Anthropic API error:', error);
      return res.status(500).json({ error: 'Failed to translate with AI', details: error });
    }

    const data = await response.json();
    let content = data.content[0].text;

    // Strip markdown code blocks if present
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    // Parse the JSON response
    const translation = JSON.parse(content);

    return res.json(translation);
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: 'Failed to translate sentence' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!ANTHROPIC_API_KEY });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
