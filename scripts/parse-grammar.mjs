import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHUNKS_DIR = path.join(__dirname, '..', 'pdf-chunks');
const OUTPUT_DIR = path.join(__dirname, '..', 'grammar-data');

// Read all chunks and combine
function readAllChunks() {
  const files = fs.readdirSync(CHUNKS_DIR)
    .filter(f => f.startsWith('chunk_'))
    .sort();

  let fullText = '';
  for (const file of files) {
    fullText += fs.readFileSync(path.join(CHUNKS_DIR, file), 'utf-8') + '\n';
  }
  return fullText;
}

// Chapter definitions based on Tae Kim's guide structure
const CHAPTERS = [
  { id: 'intro', title: 'Introduction', startPattern: 'Introduction', pages: '11-14' },
  { id: 'writing', title: 'The Writing System', startPattern: 'The Writing System', pages: '15-28' },
  { id: 'basic', title: 'Basic Grammar', startPattern: 'Basic Grammar', pages: '29-82' },
  { id: 'essential', title: 'Essential Grammar', startPattern: 'Essential Grammar', pages: '83-159' },
  { id: 'special', title: 'Special Expressions', startPattern: 'Special Expressions', pages: '160-233' },
  { id: 'advanced', title: 'Advanced Topics', startPattern: 'Advanced Topics', pages: '234-353' },
];

// Grammar topics with detailed info
const GRAMMAR_TOPICS = [
  // === PARTICLES ===
  {
    id: 'particle-wa',
    pattern: 'は',
    name: 'Topic Marker',
    nameJapanese: '話題の「は」',
    category: 'particles',
    chapter: 'basic',
    level: 'N5',
    description: 'Marks the topic of the sentence. Indicates what the sentence is about.',
    usage: 'Placed after the word that is the topic.',
    examples: [
      { japanese: '私は学生です', reading: 'わたしはがくせいです', english: 'I am a student' },
      { japanese: '今日は暑いです', reading: 'きょうはあついです', english: 'Today is hot' }
    ],
    notes: 'は is read as "wa" when used as a particle, not "ha".',
    relatedPatterns: ['が', 'も']
  },
  {
    id: 'particle-ga',
    pattern: 'が',
    name: 'Subject Marker',
    nameJapanese: '主語の「が」',
    category: 'particles',
    chapter: 'basic',
    level: 'N5',
    description: 'Identifies the subject, especially when introducing new information or emphasizing.',
    usage: 'Placed after the subject of the sentence.',
    examples: [
      { japanese: '誰が来ましたか', reading: 'だれがきましたか', english: 'Who came?' },
      { japanese: '雨が降っている', reading: 'あめがふっている', english: 'It is raining' }
    ],
    notes: 'Used for new information, emphasis, or after question words.',
    relatedPatterns: ['は', 'も']
  },
  {
    id: 'particle-wo',
    pattern: 'を',
    name: 'Object Marker',
    nameJapanese: '目的語の「を」',
    category: 'particles',
    chapter: 'basic',
    level: 'N5',
    description: 'Marks the direct object of a transitive verb.',
    usage: 'Placed after the object that receives the action.',
    examples: [
      { japanese: 'ご飯を食べる', reading: 'ごはんをたべる', english: 'eat rice' },
      { japanese: '本を読む', reading: 'ほんをよむ', english: 'read a book' }
    ],
    notes: 'を is read as "o" (not "wo" in modern pronunciation).',
    relatedPatterns: ['に', 'が']
  },
  {
    id: 'particle-ni',
    pattern: 'に',
    name: 'Target/Location/Time',
    nameJapanese: '場所・時間の「に」',
    category: 'particles',
    chapter: 'basic',
    level: 'N5',
    description: 'Indicates destination, location, time, or indirect object.',
    usage: 'Multiple uses: location of existence, destination, time, recipient.',
    examples: [
      { japanese: '学校に行く', reading: 'がっこうにいく', english: 'go to school' },
      { japanese: '7時に起きる', reading: 'しちじにおきる', english: 'wake up at 7' },
      { japanese: '友達に会う', reading: 'ともだちにあう', english: 'meet a friend' }
    ],
    notes: 'Very versatile particle with many uses.',
    relatedPatterns: ['へ', 'で', 'を']
  },
  {
    id: 'particle-de',
    pattern: 'で',
    name: 'Context Marker',
    nameJapanese: '場所・手段の「で」',
    category: 'particles',
    chapter: 'basic',
    level: 'N5',
    description: 'Indicates location of action, means/method, or reason.',
    usage: 'Where action takes place, by what means, or why.',
    examples: [
      { japanese: '図書館で勉強する', reading: 'としょかんでべんきょうする', english: 'study at the library' },
      { japanese: 'バスで行く', reading: 'ばすでいく', english: 'go by bus' },
      { japanese: '風邪で休む', reading: 'かぜでやすむ', english: 'rest due to a cold' }
    ],
    notes: 'で vs に: で for action location, に for existence location.',
    relatedPatterns: ['に', 'へ']
  },
  {
    id: 'particle-e',
    pattern: 'へ',
    name: 'Direction',
    nameJapanese: '方向の「へ」',
    category: 'particles',
    chapter: 'basic',
    level: 'N5',
    description: 'Indicates direction of movement (slightly softer than に).',
    usage: 'Shows the direction toward which something moves.',
    examples: [
      { japanese: '東京へ行く', reading: 'とうきょうへいく', english: 'go toward Tokyo' },
      { japanese: '上へ上がる', reading: 'うえへあがる', english: 'go up' }
    ],
    notes: 'へ is read as "e" when used as a particle. Interchangeable with に for direction.',
    relatedPatterns: ['に']
  },
  {
    id: 'particle-to',
    pattern: 'と',
    name: 'And/With/Quote',
    nameJapanese: '並列・引用の「と」',
    category: 'particles',
    chapter: 'basic',
    level: 'N5',
    description: 'Exhaustive listing (and), accompaniment (with), or quotation marker.',
    usage: 'Connects items exhaustively, indicates companion, or marks quotes.',
    examples: [
      { japanese: 'りんごとバナナ', reading: 'りんごとばなな', english: 'apples and bananas' },
      { japanese: '友達と行く', reading: 'ともだちといく', english: 'go with a friend' },
      { japanese: '「はい」と言う', reading: '「はい」という', english: 'say "yes"' }
    ],
    notes: 'For exhaustive listing (complete list). Use や for non-exhaustive.',
    relatedPatterns: ['や', 'とか', 'も']
  },
  {
    id: 'particle-ya',
    pattern: 'や',
    name: 'And (non-exhaustive)',
    nameJapanese: '例示の「や」',
    category: 'particles',
    chapter: 'basic',
    level: 'N5',
    description: 'Non-exhaustive listing (and, among others).',
    usage: 'Lists examples without being complete.',
    examples: [
      { japanese: '本や雑誌を読む', reading: 'ほんやざっしをよむ', english: 'read books, magazines, etc.' }
    ],
    notes: 'Implies there are more items not mentioned.',
    relatedPatterns: ['と', 'とか', 'など']
  },
  {
    id: 'particle-no',
    pattern: 'の',
    name: 'Possessive/Nominalizer',
    nameJapanese: '所有・名詞化の「の」',
    category: 'particles',
    chapter: 'basic',
    level: 'N5',
    description: 'Shows possession or turns verbs/clauses into nouns.',
    usage: 'Connects nouns (possession) or nominalizes verbs.',
    examples: [
      { japanese: '私の本', reading: 'わたしのほん', english: 'my book' },
      { japanese: '食べるのが好き', reading: 'たべるのがすき', english: 'like eating' }
    ],
    notes: 'Very common particle. Can replace が in relative clauses.',
    relatedPatterns: ['こと', 'が']
  },
  {
    id: 'particle-mo',
    pattern: 'も',
    name: 'Also/Too',
    nameJapanese: '添加の「も」',
    category: 'particles',
    chapter: 'basic',
    level: 'N5',
    description: 'Inclusive particle meaning "also" or "too".',
    usage: 'Replaces は or が to add meaning of "also".',
    examples: [
      { japanese: '私も学生です', reading: 'わたしもがくせいです', english: 'I am also a student' },
      { japanese: 'これも美味しい', reading: 'これもおいしい', english: 'This is also delicious' }
    ],
    notes: 'Replaces は and が, but not other particles (に + も = にも).',
    relatedPatterns: ['は', 'が']
  },
  {
    id: 'particle-ka',
    pattern: 'か',
    name: 'Question Marker',
    nameJapanese: '疑問の「か」',
    category: 'particles',
    chapter: 'essential',
    level: 'N5',
    description: 'Marks questions. Also used for "or" and uncertainty.',
    usage: 'Placed at the end of a sentence to make it a question.',
    examples: [
      { japanese: '学生ですか', reading: 'がくせいですか', english: 'Are you a student?' },
      { japanese: 'りんごかバナナ', reading: 'りんごかばなな', english: 'apple or banana' }
    ],
    notes: 'In casual speech, rising intonation can replace か.',
    relatedPatterns: ['の', 'かな']
  },
  {
    id: 'particle-ne',
    pattern: 'ね',
    name: 'Confirmation',
    nameJapanese: '確認の「ね」',
    category: 'particles',
    chapter: 'basic',
    level: 'N5',
    description: 'Seeks agreement or confirmation from the listener.',
    usage: 'Added to the end of sentences.',
    examples: [
      { japanese: 'いい天気ですね', reading: 'いいてんきですね', english: "Nice weather, isn't it?" },
      { japanese: '美味しいね', reading: 'おいしいね', english: "It's delicious, right?" }
    ],
    notes: 'Similar to English tag questions like "right?" or "isn\'t it?"',
    relatedPatterns: ['よ', 'よね']
  },
  {
    id: 'particle-yo',
    pattern: 'よ',
    name: 'Emphasis',
    nameJapanese: '強調の「よ」',
    category: 'particles',
    chapter: 'basic',
    level: 'N5',
    description: 'Emphasizes information the listener may not know.',
    usage: 'Added to the end of sentences for emphasis.',
    examples: [
      { japanese: '美味しいよ', reading: 'おいしいよ', english: "It's delicious, you know!" },
      { japanese: '行くよ', reading: 'いくよ', english: "I'm going!" }
    ],
    notes: 'Stronger than ね. Gives new information or emphasis.',
    relatedPatterns: ['ね', 'よね']
  },

  // === VERB FORMS ===
  {
    id: 'masu-form',
    pattern: '〜ます',
    name: 'Polite Form',
    nameJapanese: '丁寧形',
    category: 'verb-forms',
    chapter: 'essential',
    level: 'N5',
    description: 'Polite present/future tense form of verbs.',
    usage: 'Used in formal situations and with strangers.',
    examples: [
      { japanese: '食べます', reading: 'たべます', english: 'eat (polite)' },
      { japanese: '行きます', reading: 'いきます', english: 'go (polite)' }
    ],
    conjugation: {
      'ru-verb': 'Drop る, add ます (食べる → 食べます)',
      'u-verb': 'Change u → i, add ます (行く → 行きます)',
      'irregular': 'する → します, 来る → 来ます'
    },
    relatedPatterns: ['〜ません', '〜ました', '〜ませんでした']
  },
  {
    id: 'te-form',
    pattern: '〜て',
    name: 'Te-form',
    nameJapanese: 'て形',
    category: 'verb-forms',
    chapter: 'essential',
    level: 'N5',
    description: 'Connecting form used for requests, progressive, sequence, etc.',
    usage: 'Connects actions, makes requests, forms progressive.',
    examples: [
      { japanese: '食べて', reading: 'たべて', english: 'eating / please eat' },
      { japanese: '見てください', reading: 'みてください', english: 'please look' },
      { japanese: '食べている', reading: 'たべている', english: 'is eating' }
    ],
    conjugation: {
      'ru-verb': 'Drop る, add て (食べる → 食べて)',
      'u-verb (く)': 'く → いて (書く → 書いて)',
      'u-verb (ぐ)': 'ぐ → いで (泳ぐ → 泳いで)',
      'u-verb (す)': 'す → して (話す → 話して)',
      'u-verb (む/ぶ/ぬ)': 'む/ぶ/ぬ → んで (読む → 読んで)',
      'u-verb (る/う/つ)': 'る/う/つ → って (帰る → 帰って)',
      'irregular': 'する → して, 来る → 来て, 行く → 行って'
    },
    relatedPatterns: ['〜ている', '〜てください', '〜てから']
  },
  {
    id: 'ta-form',
    pattern: '〜た',
    name: 'Plain Past',
    nameJapanese: 'た形',
    category: 'verb-forms',
    chapter: 'basic',
    level: 'N5',
    description: 'Plain past tense form.',
    usage: 'Casual past tense.',
    examples: [
      { japanese: '食べた', reading: 'たべた', english: 'ate' },
      { japanese: '行った', reading: 'いった', english: 'went' }
    ],
    conjugation: {
      'note': 'Same consonant changes as te-form, but て→た, で→だ'
    },
    relatedPatterns: ['〜ました', '〜なかった', '〜たり']
  },
  {
    id: 'nai-form',
    pattern: '〜ない',
    name: 'Plain Negative',
    nameJapanese: 'ない形',
    category: 'verb-forms',
    chapter: 'basic',
    level: 'N5',
    description: 'Plain negative form.',
    usage: 'Casual negative.',
    examples: [
      { japanese: '食べない', reading: 'たべない', english: "don't eat" },
      { japanese: '行かない', reading: 'いかない', english: "don't go" }
    ],
    conjugation: {
      'ru-verb': 'Drop る, add ない (食べる → 食べない)',
      'u-verb': 'Change u → a, add ない (行く → 行かない)',
      'exception': 'ある → ない (not あらない)'
    },
    relatedPatterns: ['〜ません', '〜なかった', '〜なくて']
  },

  // === GRAMMAR PATTERNS ===
  {
    id: 'teiru',
    pattern: '〜ている',
    name: 'Progressive/Resultant State',
    nameJapanese: '〜ている形',
    category: 'grammar',
    chapter: 'essential',
    level: 'N5',
    description: 'Indicates ongoing action or resultant state.',
    usage: 'Te-form + いる. Shows action in progress or current state.',
    examples: [
      { japanese: '食べている', reading: 'たべている', english: 'is eating' },
      { japanese: '結婚している', reading: 'けっこんしている', english: 'is married' },
      { japanese: '知っている', reading: 'しっている', english: 'know (state)' }
    ],
    notes: 'Some verbs indicate state rather than ongoing action.',
    relatedPatterns: ['〜てある', '〜ておく']
  },
  {
    id: 'tai',
    pattern: '〜たい',
    name: 'Want to',
    nameJapanese: '願望の「〜たい」',
    category: 'grammar',
    chapter: 'essential',
    level: 'N5',
    description: 'Expresses desire to do something.',
    usage: 'Verb stem + たい. Only for first person.',
    examples: [
      { japanese: '食べたい', reading: 'たべたい', english: 'want to eat' },
      { japanese: '行きたい', reading: 'いきたい', english: 'want to go' }
    ],
    notes: 'Conjugates like i-adjective. Use たがる for third person.',
    relatedPatterns: ['〜たがる', '〜てほしい', '〜がほしい']
  },
  {
    id: 'kara-reason',
    pattern: '〜から',
    name: 'Because/Since',
    nameJapanese: '理由の「から」',
    category: 'grammar',
    chapter: 'essential',
    level: 'N5',
    description: 'Expresses reason or cause.',
    usage: 'Clause + から + result.',
    examples: [
      { japanese: '暑いから窓を開けた', reading: 'あついからまどをあけた', english: 'I opened the window because it was hot' },
      { japanese: '忙しいから行けない', reading: 'いそがしいからいけない', english: "I can't go because I'm busy" }
    ],
    notes: 'Direct and slightly subjective reason.',
    relatedPatterns: ['〜ので', '〜し', '〜て']
  },
  {
    id: 'node-reason',
    pattern: '〜ので',
    name: 'Because (softer)',
    nameJapanese: '理由の「ので」',
    category: 'grammar',
    chapter: 'essential',
    level: 'N4',
    description: 'Softer, more objective way to express reason.',
    usage: 'な-adj/noun + なので, verb/i-adj + ので.',
    examples: [
      { japanese: '静かなので勉強しやすい', reading: 'しずかなのでべんきょうしやすい', english: "It's easy to study because it's quiet" },
      { japanese: '雨が降っているので傘を持っていく', reading: 'あめがふっているのでかさをもっていく', english: "I'll take an umbrella because it's raining" }
    ],
    notes: 'More polite and indirect than から.',
    relatedPatterns: ['〜から', '〜ため']
  },
  {
    id: 'conditionals-tara',
    pattern: '〜たら',
    name: 'If/When (conditional)',
    nameJapanese: '条件の「たら」',
    category: 'grammar',
    chapter: 'essential',
    level: 'N4',
    description: 'Conditional meaning "if" or "when".',
    usage: 'Ta-form + ら.',
    examples: [
      { japanese: '雨が降ったら行かない', reading: 'あめがふったらいかない', english: "If it rains, I won't go" },
      { japanese: '家に帰ったらすぐ寝る', reading: 'いえにかえったらすぐねる', english: "When I get home, I'll sleep immediately" }
    ],
    notes: 'Most versatile conditional. Can be used for hypotheticals and temporal sequences.',
    relatedPatterns: ['〜ば', '〜なら', '〜と']
  },
  {
    id: 'conditionals-ba',
    pattern: '〜ば',
    name: 'If (hypothetical)',
    nameJapanese: '仮定の「ば」',
    category: 'grammar',
    chapter: 'essential',
    level: 'N4',
    description: 'Hypothetical conditional.',
    usage: 'Change verb ending う→えば.',
    examples: [
      { japanese: '食べれば', reading: 'たべれば', english: 'if (you) eat' },
      { japanese: '安ければ買う', reading: 'やすければかう', english: "If it's cheap, I'll buy it" }
    ],
    notes: 'Focus on the condition itself. Cannot be used for past events.',
    relatedPatterns: ['〜たら', '〜なら', '〜と']
  },
  {
    id: 'nakereba',
    pattern: '〜なければならない',
    name: 'Must/Have to',
    nameJapanese: '義務の表現',
    category: 'grammar',
    chapter: 'essential',
    level: 'N4',
    description: 'Expresses obligation or necessity.',
    usage: 'Negative stem + なければならない/いけない.',
    examples: [
      { japanese: '行かなければならない', reading: 'いかなければならない', english: 'must go' },
      { japanese: '食べなきゃ', reading: 'たべなきゃ', english: 'gotta eat (casual)' }
    ],
    notes: 'Many casual contractions: なきゃ, なくちゃ, ないと.',
    relatedPatterns: ['〜べき', '〜なくてもいい', '〜ほうがいい']
  },
  {
    id: 'potential',
    pattern: '〜られる/〜える',
    name: 'Potential Form',
    nameJapanese: '可能形',
    category: 'grammar',
    chapter: 'essential',
    level: 'N4',
    description: 'Expresses ability to do something.',
    usage: 'Ru-verb: られる. U-verb: change u→e + る.',
    examples: [
      { japanese: '食べられる', reading: 'たべられる', english: 'can eat' },
      { japanese: '読める', reading: 'よめる', english: 'can read' },
      { japanese: '来られる', reading: 'こられる', english: 'can come' }
    ],
    notes: 'ら抜き言葉: Dropping ら in spoken Japanese (食べれる).',
    relatedPatterns: ['〜ことができる']
  },
  {
    id: 'passive',
    pattern: '〜られる/〜あれる',
    name: 'Passive Form',
    nameJapanese: '受身形',
    category: 'grammar',
    chapter: 'special',
    level: 'N4',
    description: 'Passive voice and suffering passive.',
    usage: 'Ru-verb: られる. U-verb: change u→a + れる.',
    examples: [
      { japanese: '食べられる', reading: 'たべられる', english: 'is eaten' },
      { japanese: '読まれる', reading: 'よまれる', english: 'is read' },
      { japanese: '雨に降られた', reading: 'あめにふられた', english: 'got rained on (suffering)' }
    ],
    notes: 'Japanese passive often implies negative experience (suffering passive).',
    relatedPatterns: ['〜させる', '〜てもらう']
  },
  {
    id: 'causative',
    pattern: '〜させる/〜あせる',
    name: 'Causative Form',
    nameJapanese: '使役形',
    category: 'grammar',
    chapter: 'special',
    level: 'N4',
    description: 'Make or let someone do something.',
    usage: 'Ru-verb: させる. U-verb: change u→a + せる.',
    examples: [
      { japanese: '食べさせる', reading: 'たべさせる', english: 'make/let eat' },
      { japanese: '行かせる', reading: 'いかせる', english: 'make/let go' }
    ],
    notes: 'を for "make", に for "let" (but varies by context).',
    relatedPatterns: ['〜させられる', '〜てもらう']
  },
  {
    id: 'sou-appearance',
    pattern: '〜そう',
    name: 'Looks like/Seems',
    nameJapanese: '様態の「そう」',
    category: 'grammar',
    chapter: 'special',
    level: 'N4',
    description: 'Indicates appearance or likelihood.',
    usage: 'Verb stem/adj stem + そう.',
    examples: [
      { japanese: '美味しそう', reading: 'おいしそう', english: 'looks delicious' },
      { japanese: '雨が降りそう', reading: 'あめがふりそう', english: 'looks like it will rain' }
    ],
    notes: 'Based on visual observation. いい → よさそう, ない → なさそう.',
    relatedPatterns: ['〜ようだ', '〜みたい', '〜らしい']
  },
  {
    id: 'volitional',
    pattern: '〜よう/〜おう',
    name: 'Volitional Form',
    nameJapanese: '意志形',
    category: 'grammar',
    chapter: 'special',
    level: 'N4',
    description: "Let's / intend to / shall we.",
    usage: 'Ru-verb: drop る, add よう. U-verb: change u→o + う.',
    examples: [
      { japanese: '食べよう', reading: 'たべよう', english: "let's eat" },
      { japanese: '行こう', reading: 'いこう', english: "let's go" }
    ],
    notes: 'Polite: 〜ましょう. Used for suggestions and intentions.',
    relatedPatterns: ['〜ましょう', '〜つもり']
  },

  // === ADJECTIVES ===
  {
    id: 'i-adjectives',
    pattern: 'い-adjectives',
    name: 'I-adjectives',
    nameJapanese: 'い形容詞',
    category: 'adjectives',
    chapter: 'basic',
    level: 'N5',
    description: 'Adjectives ending in い that conjugate directly.',
    usage: 'Conjugate by changing い ending.',
    examples: [
      { japanese: '高い', reading: 'たかい', english: 'tall/expensive' },
      { japanese: '高くない', reading: 'たかくない', english: 'not tall/expensive' },
      { japanese: '高かった', reading: 'たかかった', english: 'was tall/expensive' }
    ],
    conjugation: {
      'present': '高い',
      'negative': '高くない',
      'past': '高かった',
      'past-negative': '高くなかった',
      'te-form': '高くて',
      'adverb': '高く'
    },
    notes: 'Exception: いい (good) → よくない, よかった.',
    relatedPatterns: ['な-adjectives']
  },
  {
    id: 'na-adjectives',
    pattern: 'な-adjectives',
    name: 'Na-adjectives',
    nameJapanese: 'な形容詞',
    category: 'adjectives',
    chapter: 'basic',
    level: 'N5',
    description: 'Adjectives that use な when modifying nouns.',
    usage: 'Use だ/です for predicates, な before nouns.',
    examples: [
      { japanese: '静かだ', reading: 'しずかだ', english: 'is quiet' },
      { japanese: '静かな部屋', reading: 'しずかなへや', english: 'quiet room' },
      { japanese: '静かじゃない', reading: 'しずかじゃない', english: 'not quiet' }
    ],
    conjugation: {
      'present': '静かだ',
      'negative': '静かじゃない',
      'past': '静かだった',
      'past-negative': '静かじゃなかった',
      'te-form': '静かで',
      'adverb': '静かに'
    },
    notes: 'Some look like い-adjectives: きれい, 嫌い are な-adjectives.',
    relatedPatterns: ['い-adjectives']
  },

  // === STATE OF BEING ===
  {
    id: 'da-desu',
    pattern: 'だ/です',
    name: 'State of Being',
    nameJapanese: '断定の助動詞',
    category: 'copula',
    chapter: 'basic',
    level: 'N5',
    description: 'Expresses that something is something.',
    usage: 'Noun/na-adj + だ (casual) or です (polite).',
    examples: [
      { japanese: '学生だ', reading: 'がくせいだ', english: 'am a student' },
      { japanese: '学生です', reading: 'がくせいです', english: 'am a student (polite)' },
      { japanese: '学生じゃない', reading: 'がくせいじゃない', english: 'am not a student' }
    ],
    conjugation: {
      'casual-present': 'だ',
      'polite-present': 'です',
      'casual-negative': 'じゃない/ではない',
      'polite-negative': 'じゃありません/ではありません',
      'casual-past': 'だった',
      'polite-past': 'でした',
      'casual-past-negative': 'じゃなかった',
      'polite-past-negative': 'じゃありませんでした'
    },
    notes: 'です is NOT simply a polite form of だ - they behave differently.',
    relatedPatterns: ['である']
  }
];

// Recursive text splitter
function recursiveSplit(text, maxSize = 1500, overlap = 150) {
  const separators = ['\n\n\n', '\n\n', '\n', '. ', ' '];

  function split(text, sepIdx = 0) {
    if (text.length <= maxSize) return [text];
    if (sepIdx >= separators.length) {
      const chunks = [];
      for (let i = 0; i < text.length; i += maxSize - overlap) {
        chunks.push(text.slice(i, i + maxSize));
      }
      return chunks;
    }

    const sep = separators[sepIdx];
    const parts = text.split(sep);
    if (parts.length === 1) return split(text, sepIdx + 1);

    const result = [];
    let current = '';

    for (const part of parts) {
      const potential = current ? current + sep + part : part;
      if (potential.length <= maxSize) {
        current = potential;
      } else {
        if (current) result.push(current);
        current = part.length > maxSize ? '' : part;
        if (part.length > maxSize) {
          result.push(...split(part, sepIdx + 1));
        }
      }
    }
    if (current) result.push(current);
    return result;
  }

  return split(text);
}

async function parseGrammar() {
  console.log('📚 Parsing grammar data...\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const fullText = readAllChunks();
  console.log(`Read ${fullText.length.toLocaleString()} characters from chunks\n`);

  // Create document chunks with recursive splitting
  const chunks = recursiveSplit(fullText, 1500, 150);
  console.log(`Created ${chunks.length} chunks\n`);

  // Build the final data structure
  const grammarData = {
    metadata: {
      title: "Tae Kim's Japanese Grammar Guide",
      source: 'grammar_guide.pdf',
      extractedAt: new Date().toISOString(),
      totalChunks: chunks.length
    },
    topics: GRAMMAR_TOPICS,
    chapters: CHAPTERS,
    chunks: chunks.map((content, i) => ({
      id: `chunk-${i + 1}`,
      index: i + 1,
      content: content.trim(),
      characterCount: content.length
    }))
  };

  // Save files
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'grammar-complete.json'),
    JSON.stringify(grammarData, null, 2)
  );

  // Topics only (for Supabase)
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'topics.json'),
    JSON.stringify(GRAMMAR_TOPICS, null, 2)
  );

  // Chunks only (for Supabase vector store)
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'chunks.json'),
    JSON.stringify(grammarData.chunks, null, 2)
  );

  console.log('📊 Results:');
  console.log(`   Topics: ${GRAMMAR_TOPICS.length}`);
  console.log(`   Chapters: ${CHAPTERS.length}`);
  console.log(`   Chunks: ${chunks.length}`);
  console.log(`\n✅ Data saved to: ${OUTPUT_DIR}`);

  return grammarData;
}

parseGrammar().catch(console.error);
