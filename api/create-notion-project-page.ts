import { Client } from '@notionhq/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notionApiKey = process.env.NOTION_API_KEY;
  const notionParentPageId = process.env.NOTION_PAGE_ID; // Parent page to create under

  if (!notionApiKey) {
    return res.status(500).json({ error: 'Notion API key not configured' });
  }

  try {
    const notion = new Client({ auth: notionApiKey });

    // Create the project page
    const page = await notion.pages.create({
      parent: notionParentPageId
        ? { page_id: notionParentPageId }
        : { type: 'workspace' as any, workspace: true },
      icon: {
        type: 'emoji',
        emoji: '🇯🇵',
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: 'Gojun - Japanese Learning App',
              },
            },
          ],
        },
      },
      children: [
        // Project Overview
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: '📖 Project Overview' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                text: {
                  content:
                    'Gojun is an interactive Japanese learning application designed for N5-level learners. It breaks down Japanese grammar atomically to help beginners understand how particles, verbs, and grammar patterns combine to form sentences.',
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              { text: { content: '🌐 Live Site: ', annotations: { bold: true } } },
              {
                text: {
                  content: 'https://gojun.vercel.app',
                  link: { url: 'https://gojun.vercel.app' },
                },
                annotations: { code: true },
              },
            ],
          },
        },

        // Key Features
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: '✨ Key Features' } }],
          },
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '🔬 Atomic Grammar Breakdown' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                text: {
                  content:
                    'Complex Japanese grammar patterns are broken down into their smallest meaningful components:',
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                text: {
                  content:
                    'Conjugated verbs (e.g., 持っています → 持つ + て + います)',
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                text: {
                  content:
                    'Compound patterns (e.g., になることがある → に + なる + こと + が + ある)',
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                text: {
                  content: 'Each component shows its type, meaning, and grammatical role',
                },
              },
            ],
          },
        },

        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '⭐ Favorites System' } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'Save Japanese words with one click' } },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                text: {
                  content:
                    'Auto-categorization into: verbs, food, animals, everyday, time, places, numbers, family, colors, vocabulary',
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'Filter by category for focused review' } },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'Synced to Supabase with user authentication' } },
            ],
          },
        },

        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: 'あア Kana Charts' } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'Mobile-friendly, minimalist design' } },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'Hiragana and Katakana charts' } },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'Quick reference accessible from floating toolbox' } },
            ],
          },
        },

        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '🧩 Interactive Sentence Building' } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'Drag-and-drop word placement' } },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'Click-to-place alternative for mobile' } },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'Visual feedback with color-coded particles and auxiliaries' } },
            ],
          },
        },

        // Tech Stack
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: '🛠️ Tech Stack' } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'Frontend: ', annotations: { bold: true } } },
              { text: { content: 'React 18 + TypeScript + Vite' } },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'Styling: ', annotations: { bold: true } } },
              { text: { content: 'Tailwind CSS' } },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'Backend: ', annotations: { bold: true } } },
              { text: { content: 'Vercel Serverless Functions' } },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'Database: ', annotations: { bold: true } } },
              { text: { content: 'Supabase (PostgreSQL)' } },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'Authentication: ', annotations: { bold: true } } },
              { text: { content: 'Supabase Auth' } },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'AI: ', annotations: { bold: true } } },
              { text: { content: 'Claude (Anthropic) for Japanese translation & grammar analysis' } },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'Deployment: ', annotations: { bold: true } } },
              { text: { content: 'Vercel' } },
            ],
          },
        },

        // Setup Instructions
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: '⚙️ Environment Setup' } }],
          },
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: 'Required Environment Variables' } }],
          },
        },
        {
          object: 'block',
          type: 'code',
          code: {
            language: 'bash',
            rich_text: [
              {
                text: {
                  content: `# Supabase (Frontend - Safe to expose)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Supabase (Backend - Keep secret!)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Encryption for API keys
ENCRYPTION_SECRET=your_32_character_secret_here`,
                },
              },
            ],
          },
        },

        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: 'Optional Integrations' } }],
          },
        },
        {
          object: 'block',
          type: 'code',
          code: {
            language: 'bash',
            rich_text: [
              {
                text: {
                  content: `# GitHub (for automated deployments)
GITHUB_TOKEN=ghp_your_token_here

# Vercel (for manual deployments)
VERCEL_TOKEN=your_vercel_token_here

# Notion (for project documentation)
NOTION_API_KEY=ntn_your_token_here
NOTION_PAGE_ID=your_page_id_here`,
                },
              },
            ],
          },
        },

        // Database Schema
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: '🗄️ Database Schema' } }],
          },
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: 'user_favorites table' } }],
          },
        },
        {
          object: 'block',
          type: 'code',
          code: {
            language: 'sql',
            rich_text: [
              {
                text: {
                  content: `CREATE TABLE public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  reading TEXT NOT NULL,
  english TEXT NOT NULL,
  category TEXT DEFAULT 'vocabulary',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word)
);

-- Row Level Security enabled
-- Users can only view/edit their own favorites`,
                },
              },
            ],
          },
        },

        // Repository
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: '📦 Repository' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              { text: { content: 'GitHub: ', annotations: { bold: true } } },
              {
                text: {
                  content: 'https://github.com/johnhnguyen97/gojun',
                  link: { url: 'https://github.com/johnhnguyen97/gojun' },
                },
                annotations: { code: true },
              },
            ],
          },
        },

        // Future Roadmap
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: '🚀 Future Roadmap' } }],
          },
        },
        {
          object: 'block',
          type: 'toggle',
          toggle: {
            rich_text: [{ text: { content: 'Planned Features' } }],
            children: [
              {
                object: 'block',
                type: 'bulleted_list_item',
                bulleted_list_item: {
                  rich_text: [{ text: { content: 'Spaced repetition system (SRS) for favorites' } }],
                },
              },
              {
                object: 'block',
                type: 'bulleted_list_item',
                bulleted_list_item: {
                  rich_text: [{ text: { content: 'Audio pronunciation with text-to-speech' } }],
                },
              },
              {
                object: 'block',
                type: 'bulleted_list_item',
                bulleted_list_item: {
                  rich_text: [{ text: { content: 'Kanji breakdown and stroke order' } }],
                },
              },
              {
                object: 'block',
                type: 'bulleted_list_item',
                bulleted_list_item: {
                  rich_text: [{ text: { content: 'Grammar pattern library with examples' } }],
                },
              },
              {
                object: 'block',
                type: 'bulleted_list_item',
                bulleted_list_item: {
                  rich_text: [{ text: { content: 'Progress tracking and learning analytics' } }],
                },
              },
            ],
          },
        },

        // Last Updated
        {
          object: 'block',
          type: 'divider',
          divider: {},
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                text: {
                  content: `📅 Last Updated: ${new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}`,
                },
                annotations: { italic: true, color: 'gray' },
              },
            ],
          },
        },
      ],
    });

    return res.status(200).json({
      success: true,
      pageId: page.id,
      url: (page as any).url,
    });
  } catch (error: any) {
    console.error('Notion API error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create Notion page',
    });
  }
}
