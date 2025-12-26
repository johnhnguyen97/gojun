# Gojun (語順) - Japanese Word Order Learning App

## Project Overview

Gojun is a Japanese language learning app that teaches word order through interactive sentence translation exercises. Users input English sentences and learn how to reorder words for Japanese (SOV - Subject-Object-Verb) structure.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Vercel serverless functions (`/api` directory)
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API for translations
- **NLP**: compromise.js for English parsing

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
│   ├── GrammarGuide.tsx      # Searchable grammar patterns (PDF-analyzed data)
│   ├── FavoriteButton.tsx    # Save favorite words
│   ├── FavoritesViewer.tsx   # View saved favorites
│   ├── KanaChart.tsx         # Hiragana/Katakana reference
│   └── ToolboxButton.tsx     # Floating action button
├── contexts/
│   ├── AuthContext.tsx       # Auth state & session
│   └── ThemeContext.tsx      # Dark/light mode
├── services/
│   ├── japaneseApi.ts        # Translation API calls
│   ├── englishParser.ts      # English sentence parsing & reordering
│   └── grammarService.ts     # Grammar data access
├── types/
│   └── index.ts              # TypeScript interfaces
├── lib/
│   └── supabase.ts           # Supabase client
├── App.tsx                   # Main app component
└── main.tsx                  # Entry point

api/                          # Vercel serverless functions
├── translate-sentence.ts     # AI translation endpoint
├── api-key.ts                # API key management
└── grammar-context.ts        # Grammar data endpoint

grammar-data/                 # PDF-extracted grammar data
├── grammar-guide.json        # Full grammar guide
├── vocabulary.json           # Vocabulary data
├── topics.json               # Grammar topics
└── chunks.json               # Grammar chunks for search

supabase/migrations/          # Database migrations
```

## Key Features

1. **Sentence Reorder Game**: Core learning - enter English, arrange Japanese words
2. **Grammar Guide**: Searchable grammar patterns from analyzed PDF
3. **Atomic Breakdown**: Detailed grammar explanations with examples
4. **Favorites**: Save words for later review
5. **Kana Charts**: Hiragana/Katakana reference

## Environment Variables

Create `.env.local` with:
```
VITE_SUPABASE_URL=https://evqzqaqfanfuehavuxsr.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_URL=https://evqzqaqfanfuehavuxsr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server

# Build
npm run build            # TypeScript check + Vite build

# Supabase
npm run db:list          # List migrations status
npm run db:push          # Push migrations to remote
npm run db:new <name>    # Create new migration
npm run supabase <cmd>   # Run any supabase command

# Supabase with password (for db:push)
SUPABASE_DB_PASSWORD='<password>' npm run db:push
```

## Database

**Project ref**: `evqzqaqfanfuehavuxsr`

### Tables
- `grammar_topics` - Grammar patterns and explanations
- `grammar_chunks` - Searchable grammar chunks
- `user_api_keys` - Encrypted Anthropic API keys
- `user_favorites` - Saved favorite words

### Migration Tips
- Files must match pattern `<timestamp>_name.sql` (e.g., `20251225_grammar_tables.sql`)
- Use `npm run db:push` with `SUPABASE_DB_PASSWORD` env var
- If migrations are out of sync: `npm run supabase migration repair --status applied <timestamp>`

## Code Patterns

### English to Japanese Reordering
The `englishParser.ts` service:
1. Parses English with compromise.js
2. Assigns grammatical roles (subject, verb, object, etc.)
3. Reorders to Japanese SOV structure

### Translation API
`japaneseApi.ts` calls `/api/translate-sentence` which:
1. Takes parsed English structure
2. Calls Claude API for Japanese translation
3. Returns translations with grammar notes and atomic breakdown

### Grammar Notes
Each translation includes:
- Japanese word + reading + romaji
- Particle explanations
- Grammar notes with atomic breakdown (detailed component analysis)

## Deployment

- **Frontend**: Vercel (auto-deploy from GitHub)
- **API**: Vercel serverless functions
- **Database**: Supabase hosted

## Recent Cleanup (Dec 2025)

Removed features (planned for future re-addition via Notion):
- Workspace/dashboard system
- Calendar widget
- Flashcard/SRS system
- Learning calendar

Kept:
- Core reorder game
- Grammar guide with PDF data
- Favorites & Kana chart
- Authentication
