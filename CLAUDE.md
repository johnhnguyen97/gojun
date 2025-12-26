# Gojun (語順) - Japanese Word Order Learning App

## Project Overview

Gojun is a Japanese language learning app that teaches word order through interactive sentence translation exercises. Users input English sentences and learn how to reorder words for Japanese (SOV - Subject-Object-Verb) structure.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Vercel serverless functions (`/api` directory)
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API for translations
- **NLP**: compromise.js for English parsing

---

## Design Agents (Mental Models)

When working on features, think from these perspectives:

### 🎨 UI/UX Designer Agent
**Role**: Focus on user experience, visual consistency, and intuitive interactions

**Principles**:
- **Consistency**: Same animation patterns, color schemes, and spacing throughout
- **Feedback**: Every action should have visual feedback (hover, active, loading states)
- **Accessibility**: Touch-friendly (44px min tap targets), readable fonts, good contrast
- **Delight**: Subtle animations that feel natural (ease-out for entrances, ease-in for exits)
- **Mobile-first**: Design for small screens, enhance for larger

**Animation Guidelines**:
- Modal open: `scale(0.95) → scale(1)` + `opacity 0 → 1` (200ms ease-out)
- Modal close: reverse with 150ms ease-in
- List items: stagger fade-in (50ms delay between items)
- Buttons: `scale(1.05)` on hover, `scale(0.95)` on active
- Icons: Use transforms, not layout changes

**Color Palette**:
- Primary: Amber/Orange gradient (`from-amber-500 to-orange-500`)
- Secondary: Indigo/Purple gradient (`from-indigo-500 to-purple-500`)
- Success: Green/Emerald (`from-green-400 to-emerald-500`)
- Background: Warm gradient (`from-amber-50 via-orange-50 to-yellow-50`)
- Cards: `bg-white/80 backdrop-blur-sm` with subtle borders

### 📚 Student/Note-taker Agent
**Role**: Think like a language learner organizing their study materials

**Principles**:
- **Organization**: Categories, tags, folders that make sense for studying
- **Quick capture**: Fast way to save words/notes during lessons
- **Review-friendly**: Easy to browse and quiz yourself
- **Context**: Words should have example sentences, not just definitions
- **Progress tracking**: Know what you've learned vs what needs review

**Note Structure**:
- **Favorites**: Quick-save words with auto-detected category
- **Dictionary**: Personal vocabulary with custom definitions
- **Notes**: Notion-style pages for longer study notes
- **Word notes**: Quick annotations on specific words

**Categories for Japanese**:
- Noun (名詞)
- Verb - Transitive (他動詞)
- Verb - Intransitive (自動詞)
- い-Adjective (い形容詞)
- な-Adjective (な形容詞)
- Adverb (副詞)
- Particle (助詞)
- Expression (表現)

### 📖 Grammar Expert Agent
**Role**: Ensure accurate Japanese/English grammar explanations

**Principles**:
- **Accuracy**: Correct particle usage, verb conjugations, word order
- **Clarity**: Explain grammar in simple terms with examples
- **Comparison**: Show English vs Japanese structure differences
- **Patterns**: Identify common grammar patterns (は vs が, て-form, etc.)
- **Levels**: Tag content by JLPT level (N5-N1)

**Japanese Word Order (SOV)**:
```
English: I eat sushi (SVO)
Japanese: 私は 寿司を 食べます (SOV)
         (I-topic) (sushi-object) (eat)
```

**Key Grammar Concepts**:
- Topic marker (は) vs Subject marker (が)
- Object marker (を)
- Direction/goal (に, へ)
- Location (で)
- Verb conjugations (ます-form, て-form, た-form)
- Adjective types and conjugation

---

## Project Structure

```
src/
├── components/
│   ├── Auth.tsx              # Login/signup
│   ├── Settings.tsx          # API key & preferences
│   ├── SentenceInput.tsx     # Text input for sentences
│   ├── SentenceDisplay.tsx   # Game UI with drag-and-drop
│   ├── WordCard.tsx          # Individual word display
│   ├── GrammarSidebar.tsx    # Grammar notes sidebar
│   ├── GrammarPanel.tsx      # Grammar explanations
│   ├── GrammarGuide.tsx      # Searchable grammar patterns
│   ├── FavoriteButton.tsx    # Save favorite words (auto-detect category)
│   ├── WordNoteButton.tsx    # Quick notes on words
│   ├── NotesPanel.tsx        # Notion-style notes (Favorites + Notes + Dictionary)
│   ├── KanaChart.tsx         # Hiragana/Katakana reference
│   └── ToolboxButton.tsx     # Floating action button menu
├── contexts/
│   └── AuthContext.tsx       # Auth state & session
├── services/
│   ├── japaneseApi.ts        # Translation API calls
│   ├── englishParser.ts      # English sentence parsing
│   ├── favoritesApi.ts       # Favorites CRUD
│   └── grammarService.ts     # Grammar data access
├── types/
│   └── index.ts              # TypeScript interfaces
├── lib/
│   └── supabase.ts           # Supabase client
├── App.tsx                   # Main app component
├── main.tsx                  # Entry point
└── index.css                 # Global styles & animations

api/                          # Vercel serverless functions
├── translate-sentence.ts     # AI translation endpoint
├── save-api-key.ts           # Save encrypted API key
├── check-api-key.ts          # Check if key exists
├── delete-api-key.ts         # Remove API key
├── save-favorite.ts          # Save favorite word
├── get-favorites.ts          # Get user favorites
├── delete-favorite.ts        # Remove favorite
└── grammar-context.ts        # Grammar data endpoint
```

---

## Key Features

### 1. Sentence Reorder Game (Core)
- Enter English sentence
- Input hides, game appears with animation
- Drag/drop or click to arrange Japanese words
- Instant feedback on correct/incorrect
- "New Sentence" returns to input

### 2. Notes Panel (Toolbox → Notes)
Three tabs:
- **★ Favorites**: Auto-categorized saved words
- **📄 My Notes**: Notion-style pages with blocks
- **📖 Dictionary**: Personal vocabulary list

### 3. Word Actions (on word cards)
- **Star button**: Quick favorite (auto-detects category)
- **Note button**: Quick note popup for that word

### 4. Grammar Guide
- Searchable grammar patterns
- JLPT level filtering
- Detailed explanations with examples

### 5. Kana Charts
- Hiragana & Katakana reference
- Animated grid display

---

## Animation Classes (index.css)

```css
/* Modal animations */
.animate-scaleIn     /* scale(0.9) → scale(1) */
.animate-fadeInUp    /* translateY(10px) → 0 */
.animate-fadeInRight /* translateX(20px) → 0 */

/* List animations */
.stagger-children    /* Children fade in with 50ms delays */
.grid-stagger        /* Grid items scale in with delays */

/* Special effects */
.animate-float       /* Gentle up/down floating */
.portal-emerge       /* Spin out from nothing (blackhole effect) */
.portal-collapse     /* Spin back into nothing */
.portal-glow         /* Pulsing glow effect */
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://evqzqaqfanfuehavuxsr.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_URL=https://evqzqaqfanfuehavuxsr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_DB_PASSWORD=<db-password>
```

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5173)

# Build
npm run build            # TypeScript check + Vite build

# Database
npm run db:push          # Push migrations (needs SUPABASE_DB_PASSWORD)
npm run db:list          # List migration status
npm run supabase <cmd>   # Run any supabase command

# Git (GPG signing enabled)
git commit -S -m "message"   # Signed commit
git push origin master       # Push to trigger Vercel deploy
```

---

## Database Tables

**Project ref**: `evqzqaqfanfuehavuxsr`

| Table | Purpose |
|-------|---------|
| `user_api_keys` | Encrypted Anthropic API keys |
| `user_favorites` | Saved favorite words with categories |
| `grammar_topics` | Grammar patterns and explanations |
| `grammar_chunks` | Searchable grammar chunks |

---

## Local Storage Keys

| Key | Purpose |
|-----|---------|
| `gojun-note-pages` | Notion-style note pages |
| `gojun-word-notes` | Quick notes on specific words |
| `gojun-dictionary` | Personal dictionary entries |

---

## Deployment

- **Frontend + API**: Vercel (auto-deploy from GitHub on signed commits)
- **Database**: Supabase hosted PostgreSQL
- **GPG signing**: Required for Vercel auto-deploy

---

## Future Features (Planned in Notion)

- [ ] Workspace dashboard with widgets
- [ ] Flashcard/SRS system (SM-2 algorithm)
- [ ] Learning calendar
- [ ] Progress analytics
- [ ] JLPT practice mode
- [ ] Audio pronunciation
