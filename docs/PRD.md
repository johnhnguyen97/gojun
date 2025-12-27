# Gojun (語順) - Product Requirements Document

**Version:** 1.0
**Last Updated:** December 26, 2025
**Status:** Active Development
**Product Owner:** John Nguyen

---

## 1. Executive Summary

### 1.1 Product Overview
Gojun (語順, meaning "word order") is a comprehensive Japanese learning web application designed to help English speakers master Japanese sentence structure through AI-powered translation, detailed grammar breakdowns, and daily vocabulary practice. The application bridges the gap between simple translation tools and full language courses by providing deep, contextual understanding of how Japanese sentences are constructed.

### 1.2 Vision Statement
To become the most intuitive and effective tool for English speakers learning Japanese sentence structure, combining AI-powered translation with comprehensive grammar education and daily practice tools.

### 1.3 Problem Statement
Existing Japanese learning tools either:
- Provide translations without explaining the underlying grammar
- Overwhelm beginners with complex linguistic terminology
- Lack personalization for different JLPT levels
- Don't break down verb conjugations into learnable components
- Offer no daily practice or retention features

### 1.4 Solution
Gojun addresses these issues by:
- Breaking every sentence into atomic components (verb stems, conjugation suffixes, particles)
- Providing contextual grammar explanations matched to the user's JLPT level
- Offering daily Word of the Day and Kanji of the Day features
- Integrating with Google Calendar for spaced repetition reminders
- Supporting both free (Groq) and premium (Claude) AI providers

---

## 2. Target Users

### 2.1 Primary Users
| User Type | Description | Needs |
|-----------|-------------|-------|
| **Beginner Learners (N5-N4)** | Just starting Japanese, knows hiragana/katakana | Simple explanations, romaji support, basic vocabulary |
| **Intermediate Learners (N3-N2)** | Understands basic grammar, building vocabulary | Verb conjugation breakdowns, grammar pattern recognition |
| **JLPT Test Preppers** | Studying for specific JLPT level | Level-filtered content, grammar reference by level |
| **Self-Learners** | Learning independently without formal classes | Comprehensive explanations, reference materials |

### 2.2 User Personas

**Persona 1: Sarah - The Anime Fan**
- Age: 22, College Student
- Goal: Understand anime without subtitles
- JLPT Level: N5 (beginner)
- Usage: Daily, 15-30 minutes
- Needs: Fun, visual learning, common phrases

**Persona 2: Mike - The Business Traveler**
- Age: 35, Software Engineer
- Goal: Communicate during Japan business trips
- JLPT Level: N4-N3
- Usage: Weekly, before trips
- Needs: Practical sentences, polite forms, quick reference

**Persona 3: Yuki - The Heritage Learner**
- Age: 28, Second-generation Japanese-American
- Goal: Connect with Japanese family, read Japanese media
- JLPT Level: N3-N2
- Usage: Daily, 30-60 minutes
- Needs: Kanji practice, natural expressions, cultural context

---

## 3. Core Features

### 3.1 Sentence Translation Engine

#### Description
The primary feature - translates English sentences to natural Japanese with comprehensive breakdowns.

#### Functional Requirements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| ST-001 | Accept English text input (single sentence or paragraph) | P0 | ✅ Done |
| ST-002 | Split paragraphs into individual sentences (max 6) | P0 | ✅ Done |
| ST-003 | Translate to natural Japanese using AI (Claude/Groq) | P0 | ✅ Done |
| ST-004 | Break down into atomic grammar units | P0 | ✅ Done |
| ST-005 | Display kanji with furigana readings | P0 | ✅ Done |
| ST-006 | Show romaji for each word | P0 | ✅ Done |
| ST-007 | Identify part of speech for each word | P0 | ✅ Done |
| ST-008 | Provide English meaning for each component | P0 | ✅ Done |
| ST-009 | Generate contextual grammar notes | P0 | ✅ Done |
| ST-010 | Support verb conjugation splitting (93% accuracy) | P0 | ✅ Done |

#### Technical Implementation
- **AI Providers:** Claude API (premium), Groq API (free default)
- **Prompt Engineering:** Structured JSON output with atomic breakdown instructions
- **Caching:** None (real-time translation)
- **Rate Limiting:** Per-user based on API provider limits

#### User Flow
```
1. User enters English text
2. Click "変換" (Convert) button or Ctrl+Enter
3. Loading state with skeleton UI
4. Display translated sentence with word cards
5. Show grammar notes in sidebar
6. User can click words for detailed breakdown
```

---

### 3.2 Grammar Reference System

#### Description
Comprehensive grammar database with 32 topics and 536 searchable chunks, organized by JLPT level.

#### Functional Requirements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| GR-001 | Store grammar topics in Supabase database | P0 | ✅ Done |
| GR-002 | Full-text search across all grammar content | P0 | ✅ Done |
| GR-003 | Filter by JLPT level (N5-N1) | P0 | ✅ Done |
| GR-004 | Filter by category (particles, verb forms, patterns) | P0 | ✅ Done |
| GR-005 | Display examples with translations | P0 | ✅ Done |
| GR-006 | Show conjugation tables where applicable | P1 | ✅ Done |
| GR-007 | Link related grammar points | P2 | 🔄 Planned |

#### Database Schema
```sql
-- grammar_topics table
id TEXT PRIMARY KEY,
pattern TEXT NOT NULL,        -- e.g., "は", "ている"
name TEXT NOT NULL,           -- e.g., "Topic Marker"
name_japanese TEXT,           -- e.g., "主題助詞"
category TEXT,                -- particles, verb_forms, patterns
level TEXT,                   -- N5, N4, N3, N2, N1
description TEXT,
examples JSONB,
conjugation JSONB

-- grammar_chunks table (for search)
id TEXT PRIMARY KEY,
chunk_index INTEGER,
content TEXT,                 -- searchable text chunks
fts tsvector                  -- full-text search index
```

---

### 3.3 Japanese Learning Calendar

#### Description
Full-featured calendar with daily vocabulary, kanji practice, and Japanese holidays.

#### Functional Requirements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| CAL-001 | Month/Week/Day calendar views | P0 | ✅ Done |
| CAL-002 | Word of the Day by JLPT level | P0 | ✅ Done |
| CAL-003 | Kanji of the Day with stroke order | P0 | ✅ Done |
| CAL-004 | Japanese holidays with descriptions | P0 | ✅ Done |
| CAL-005 | Japanese locale (day names in Japanese) | P1 | ✅ Done |
| CAL-006 | Click to view word/kanji details | P0 | ✅ Done |
| CAL-007 | JLPT level selector (N5-N1) | P0 | ✅ Done |
| CAL-008 | Google Calendar sync | P1 | ✅ Done |
| CAL-009 | Custom events and tasks | P2 | 🔄 Planned |
| CAL-010 | Add WOTD to Google Tasks | P2 | 🔄 Planned |

#### Technical Implementation
- **Calendar Library:** @fullcalendar/react with daygrid, timegrid, interaction plugins
- **Locale:** @fullcalendar/core/locales/ja for Japanese day names
- **WOTD Algorithm:** Deterministic based on date + JLPT level (same word for all users on same day)
- **Kanji Source:** Supabase kanji table with JLPT levels, readings, meanings

---

### 3.4 Kanji Stroke Order Animation

#### Description
Interactive kanji display with animated stroke order using KanjiVG data.

#### Functional Requirements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| KA-001 | Display kanji with colored strokes | P0 | ✅ Done |
| KA-002 | Animate stroke order sequentially | P0 | ✅ Done |
| KA-003 | Play/Stop animation controls | P0 | ✅ Done |
| KA-004 | Hide stroke numbers for clean display | P0 | ✅ Done |
| KA-005 | Show On'yomi and Kun'yomi readings | P0 | ✅ Done |
| KA-006 | Display stroke count and JLPT level | P0 | ✅ Done |

#### Technical Implementation
- **SVG Source:** Kan-G CDN (https://kan-g.vnaka.dev/k/{unicode}.svg)
- **Animation:** CSS strokeDasharray/strokeDashoffset with JavaScript timing
- **Color Palette:** 12 colors cycling through strokes
- **Number Removal:** Regex strips `<g class="kgNumbers">` from SVG

#### Color Palette
```javascript
const STROKE_COLORS = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#9333ea', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
  '#be185d', // pink
  '#854d0e', // brown
  '#4f46e5', // indigo
  '#059669', // emerald
  '#d97706', // amber
  '#7c3aed', // violet
];
```

---

### 3.5 Kana Reference Chart

#### Description
Interactive hiragana and katakana reference with pronunciation.

#### Functional Requirements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| KN-001 | Display hiragana chart (46 basic + combinations) | P0 | ✅ Done |
| KN-002 | Display katakana chart | P0 | ✅ Done |
| KN-003 | Toggle between hiragana/katakana | P0 | ✅ Done |
| KN-004 | Show romaji pronunciation | P0 | ✅ Done |
| KN-005 | Audio pronunciation on click | P2 | 🔄 Planned |

---

### 3.6 Favorites & Notes System

#### Description
Save and organize favorite translations and personal notes.

#### Functional Requirements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FN-001 | Save sentence translations to favorites | P0 | ✅ Done |
| FN-002 | Add personal notes to saved items | P1 | ✅ Done |
| FN-003 | View favorites list | P0 | ✅ Done |
| FN-004 | Delete favorites | P0 | ✅ Done |
| FN-005 | Export favorites | P2 | 🔄 Planned |
| FN-006 | Sync across devices (requires login) | P1 | ✅ Done |

---

### 3.7 User Authentication & Settings

#### Description
User accounts for personalization and data sync.

#### Functional Requirements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| UA-001 | Google OAuth sign-in | P0 | ✅ Done |
| UA-002 | Guest mode (localStorage only) | P0 | ✅ Done |
| UA-003 | JLPT level preference | P0 | ✅ Done |
| UA-004 | AI provider selection (Groq/Claude) | P0 | ✅ Done |
| UA-005 | Store user's Claude API key (encrypted) | P1 | ✅ Done |
| UA-006 | Dark mode toggle | P2 | 🔄 Planned |

#### Security
- API keys encrypted with AES-256 before storage
- Keys stored in Supabase with user_id association
- Server-side decryption only when making API calls

---

## 4. Technical Architecture

### 4.1 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | UI framework |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Build** | Vite | Fast development/build |
| **Backend** | Vercel Serverless Functions | API endpoints |
| **Database** | Supabase (PostgreSQL) | Data storage |
| **Auth** | Supabase Auth | Google OAuth |
| **AI** | Claude API / Groq API | Translation |
| **Calendar** | FullCalendar | Calendar UI |
| **Hosting** | Vercel | Deployment |

### 4.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Sentence │ │ Grammar  │ │ Calendar │ │ Settings/Auth    │ │
│  │ Input    │ │ Sidebar  │ │ View     │ │                  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘ │
└───────┼────────────┼────────────┼────────────────┼───────────┘
        │            │            │                │
        ▼            ▼            ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                 Vercel Serverless Functions                   │
│  ┌────────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │ /api/translate │ │ /api/calendar│ │ /api/google-cal   │  │
│  │ -sentence      │ │              │ │                   │  │
│  └───────┬────────┘ └──────┬───────┘ └─────────┬─────────┘  │
└──────────┼─────────────────┼───────────────────┼────────────┘
           │                 │                   │
           ▼                 ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Claude/Groq    │ │     Supabase     │ │  Google Calendar │
│   API            │ │   (PostgreSQL)   │ │  API             │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### 4.3 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/translate-sentence` | POST | Translate English to Japanese with breakdown |
| `/api/calendar` | GET | Get WOTD, KOTD, holidays for date range |
| `/api/calendar?action=settings` | GET | Get user's calendar settings |
| `/api/google-calendar` | POST | Sync WOTD to Google Calendar |
| `/api/api-key` | POST | Store encrypted API key |
| `/api/api-key` | GET | Check if user has API key |
| `/api/grammar-context` | GET | Get grammar reference for AI prompts |

### 4.4 Database Schema

```sql
-- Users (managed by Supabase Auth)
auth.users

-- API Keys (encrypted storage)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grammar Topics
CREATE TABLE grammar_topics (
  id TEXT PRIMARY KEY,
  pattern TEXT NOT NULL,
  name TEXT NOT NULL,
  name_japanese TEXT,
  category TEXT,
  level TEXT,
  description TEXT,
  examples JSONB,
  conjugation JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grammar Chunks (for search)
CREATE TABLE grammar_chunks (
  id TEXT PRIMARY KEY,
  topic_id TEXT REFERENCES grammar_topics(id),
  chunk_index INTEGER,
  content TEXT,
  fts tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
);

-- Vocabulary (for WOTD)
CREATE TABLE vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  reading TEXT NOT NULL,
  meaning TEXT NOT NULL,
  part_of_speech TEXT,
  jlpt_level TEXT,
  example_sentence TEXT,
  example_translation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kanji (for KOTD)
CREATE TABLE kanji (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kanji CHAR(1) NOT NULL UNIQUE,
  onyomi TEXT[],
  kunyomi TEXT[],
  meaning TEXT NOT NULL,
  stroke_count INTEGER,
  jlpt_level TEXT,
  grade INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Favorites
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  breakdown JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Calendar Settings
CREATE TABLE user_calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  jlpt_level TEXT DEFAULT 'N5',
  show_wotd BOOLEAN DEFAULT true,
  show_kotd BOOLEAN DEFAULT true,
  show_holidays BOOLEAN DEFAULT true,
  google_calendar_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. User Interface

### 5.1 Design Principles
- **Clean & Minimal:** Focus on content, not chrome
- **Japanese Aesthetic:** Subtle use of traditional colors and patterns
- **Progressive Disclosure:** Show details on demand
- **Mobile-First:** Responsive design for all screen sizes

### 5.2 Color Scheme
| Color | Hex | Usage |
|-------|-----|-------|
| Amber | #f59e0b | Primary accent, buttons |
| Orange | #ea580c | Secondary accent, highlights |
| Indigo | #6366f1 | Word of the Day |
| Purple | #9333ea | Kanji of the Day |
| Emerald | #10b981 | Success states |
| Red | #ef4444 | Error states |

### 5.3 Key Screens

#### Home / Translation View
- Header with logo and settings
- Text input area with submit button
- Translated sentence display with word cards
- Grammar notes sidebar (collapsible)

#### Calendar View
- Month/Week/Day toggle
- JLPT level selector
- Color-coded entries (WOTD, KOTD, holidays)
- Click to expand details

#### Kanji Detail Popover
- Large kanji display with stroke animation
- Play/Stop button
- On'yomi and Kun'yomi readings
- Meaning and JLPT level
- Stroke count

---

## 6. Non-Functional Requirements

### 6.1 Performance
| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | ~1.2s |
| Time to Interactive | < 3s | ~2.5s |
| Translation Response | < 5s | ~3-4s |
| Lighthouse Score | > 90 | 85 |

### 6.2 Scalability
- Serverless architecture scales automatically
- Database connection pooling via Supabase
- CDN for static assets via Vercel

### 6.3 Security
- HTTPS everywhere
- API key encryption (AES-256)
- OAuth 2.0 for authentication
- Row-level security in Supabase
- No sensitive data in localStorage

### 6.4 Accessibility
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance (WCAG AA)
- Screen reader friendly

---

## 7. Roadmap

### Phase 1: Core Translation (✅ Complete)
- Basic sentence translation
- Word-by-word breakdown
- Grammar notes
- User authentication
- Favorites system

### Phase 2: Learning Calendar (✅ Complete)
- Full calendar view
- Word of the Day
- Kanji of the Day with stroke animation
- Japanese holidays
- Google Calendar sync

### Phase 3: Enhanced Features (🔄 In Progress)
- [ ] Custom events and tasks
- [ ] Flexible date range sync
- [ ] 24-hour time picker for events
- [ ] Delete WOTD events from Google Calendar
- [ ] Add WOTD to Google Tasks

### Phase 4: Retention & Practice (📋 Planned)
- [ ] Spaced repetition system (SRS)
- [ ] Flashcard mode
- [ ] Quiz mode
- [ ] Progress tracking
- [ ] Streak system

### Phase 5: Community (📋 Planned)
- [ ] Shared sentence collections
- [ ] User-contributed translations
- [ ] Discussion forums
- [ ] Leaderboards

---

## 8. Success Metrics

### 8.1 Key Performance Indicators (KPIs)
| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Active Users | 1,000 | Analytics |
| Translations/Day | 5,000 | API logs |
| User Retention (7-day) | 40% | Analytics |
| Translation Accuracy | 95% | User feedback |
| Average Session Length | 10 min | Analytics |

### 8.2 User Satisfaction
- In-app feedback mechanism
- NPS surveys quarterly
- App store ratings (future mobile app)

---

## 9. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI API costs escalate | High | Medium | Free tier default (Groq), usage limits |
| Translation quality issues | High | Low | Multiple AI providers, user feedback loop |
| KanjiVG CDN downtime | Medium | Low | Fallback to static kanji display |
| Supabase outage | High | Low | Error handling, cached data |
| Vercel deployment limits | Low | Medium | Monitor usage, upgrade plan if needed |

---

## 10. Appendix

### 10.1 Glossary
| Term | Definition |
|------|------------|
| JLPT | Japanese Language Proficiency Test (N5 easiest → N1 hardest) |
| Furigana | Small hiragana above kanji showing pronunciation |
| Romaji | Japanese written in Latin alphabet |
| On'yomi | Chinese-derived kanji reading |
| Kun'yomi | Native Japanese kanji reading |
| WOTD | Word of the Day |
| KOTD | Kanji of the Day |

### 10.2 References
- [KanjiVG Project](https://kanjivg.tagaini.net/)
- [Kan-G CDN](https://kan-g.vnaka.dev/)
- [JLPT Official](https://www.jlpt.jp/e/)
- [FullCalendar Docs](https://fullcalendar.io/docs/react)

### 10.3 Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 26, 2025 | Initial PRD |

---

*Document maintained by the Gojun development team.*
