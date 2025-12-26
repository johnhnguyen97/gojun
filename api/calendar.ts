// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// JLPT search terms for each level
const JLPT_SEARCH_TERMS: Record<string, string[]> = {
  N5: ['食べる', '飲む', '行く', '来る', '見る', '聞く', '読む', '書く', '話す', '買う', '寝る', '起きる', '大きい', '小さい', '新しい', '古い', '高い', '安い', '人', '水', '本', '車', '学校', '家', '朝', '夜', '今日', '明日', '友達', '先生'],
  N4: ['届ける', '届く', '申し込む', '集める', '集まる', '決める', '決まる', '調べる', '育てる', '続ける', '伝える', '慣れる', '増える', '減る', '見つける', '予約', '経験', '関係', '習慣', '準備', '説明', '注意', '相談', '連絡', '約束', '丁寧', '複雑', '簡単', '必要'],
  N3: ['影響', '価値', '環境', '機会', '期間', '基本', '現在', '原因', '効果', '行動', '最近', '事実', '実際', '状況', '状態', '信じる', '確認', '参加', '成功', '失敗', '完全', '重要', '普通', '特別', '自然', '深い', '厳しい', '優しい'],
  N2: ['維持', '印象', '運営', '演奏', '応用', '解決', '改善', '拡大', '活動', '感動', '共通', '具体的', '傾向', '現象', '構成', '財産', '姿勢', '実現', '柔軟', '順調', '慎重', '整理', '責任', '選択'],
  N1: ['曖昧', '圧倒的', '一貫', '栄養', '概念', '核心', '画期的', '寛容', '基盤', '虚偽', '緊迫', '功績', '錯覚', '思惑', '脆弱', '洗練', '妥協', '端的', '致命的', '抽象的', '徹底', '把握']
};

const DAYS_JAPANESE = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
const DAYS_ENGLISH = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

async function fetchWordFromJisho(searchTerm: string) {
  try {
    const response = await fetch(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(searchTerm)}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.data || data.data.length === 0) return null;
    const entry = data.data[0];
    const japanese = entry.japanese[0];
    const sense = entry.senses[0];
    return {
      word: japanese.word || japanese.reading,
      reading: japanese.reading,
      meaning: sense.english_definitions.slice(0, 3).join(', '),
      partOfSpeech: sense.parts_of_speech[0] || 'word'
    };
  } catch { return null; }
}

async function fetchKanjiData(kanji: string) {
  try {
    // Use kanjiapi.dev for kanji data
    const response = await fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(kanji)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return {
      kanji: data.kanji,
      onyomi: data.on_readings || [],
      kunyomi: data.kun_readings || [],
      meaning: data.meanings ? data.meanings.slice(0, 3).join(', ') : 'kanji',
      strokeCount: data.stroke_count || null,
      grade: data.grade || null,
      jlpt: data.jlpt || null
    };
  } catch {
    // Fallback: try Jisho API for kanji
    try {
      const response = await fetch(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(kanji)}%23kanji`);
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.data || data.data.length === 0) return null;
      const entry = data.data[0];
      return {
        kanji: kanji,
        onyomi: [],
        kunyomi: [],
        meaning: entry.senses?.[0]?.english_definitions?.slice(0, 3).join(', ') || 'kanji',
        strokeCount: null,
        grade: null,
        jlpt: null
      };
    } catch { return null; }
  }
}

async function fetchHolidays(year: number) {
  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/JP`);
    if (!response.ok) return [];
    return await response.json();
  } catch { return []; }
}

const holidayCulturalInfo: Record<string, { description?: string; traditions?: string[] }> = {
  "New Year's Day": { description: 'The most important holiday in Japan.', traditions: ['Hatsumode', 'Otoshidama'] },
  "Coming of Age Day": { description: 'Celebrates young adults who have turned 20.', traditions: ['Seijin-shiki ceremony'] },
  "National Foundation Day": { description: 'Commemorates the mythological founding of Japan.' },
  "Emperor's Birthday": { description: "Celebrates the birthday of the reigning Emperor." },
  "Vernal Equinox Day": { description: 'Marks the arrival of spring.', traditions: ['Visiting graves'] },
  "Showa Day": { description: 'Honors Emperor Showa.', traditions: ['Start of Golden Week'] },
  "Constitution Memorial Day": { description: "Commemorates Japan's post-war constitution." },
  "Greenery Day": { description: 'A day to commune with nature.' },
  "Children's Day": { description: "Celebrates children's happiness.", traditions: ['Flying koinobori'] },
  "Marine Day": { description: 'Gives thanks for the blessings of the ocean.' },
  "Mountain Day": { description: 'A day to appreciate mountains.' },
  "Respect for the Aged Day": { description: 'A day to honor elderly citizens.' },
  "Autumnal Equinox Day": { description: 'Marks the arrival of autumn.' },
  "Sports Day": { description: 'Promotes sports and an active lifestyle.' },
  "Culture Day": { description: 'Promotes culture and the arts.' },
  "Labour Thanksgiving Day": { description: 'A day to honor labor and production.' }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  // Handle iCal (no auth required)
  if (action === 'ical' && req.method === 'GET') {
    return handleIcal(req, res);
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    switch (action) {
      case 'daily':
        return handleDaily(req, res, supabase, user.id);
      case 'settings':
        return handleSettings(req, res, supabase, user.id);
      case 'learned':
        return handleLearned(req, res, supabase, user.id);
      default:
        return res.status(400).json({ error: 'Invalid action. Use: daily, settings, learned, or ical' });
    }
  } catch (error) {
    console.error('Calendar API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleDaily(req: VercelRequest, res: VercelResponse, supabase: any, userId: string) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data: settings } = await supabase
    .from('user_calendar_settings')
    .select('jlpt_level')
    .eq('user_id', userId)
    .single();

  const jlptLevel = settings?.jlpt_level || 'N5';

  const { data: learnedItems } = await supabase
    .from('user_learned_items')
    .select('item_type, item_key')
    .eq('user_id', userId);

  const learnedWords = new Set(learnedItems?.filter(i => i.item_type === 'word').map(i => i.item_key) || []);
  const learnedKanji = new Set(learnedItems?.filter(i => i.item_type === 'kanji').map(i => i.item_key) || []);

  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();

  const wordTerms = JLPT_SEARCH_TERMS[jlptLevel] || JLPT_SEARCH_TERMS.N5;
  const wordIndex = hashCode(dateString + jlptLevel + 'word') % wordTerms.length;
  const kanjiIndex = hashCode(dateString + jlptLevel + 'kanji') % wordTerms.length;

  const wordData = await fetchWordFromJisho(wordTerms[wordIndex]);

  // Get a kanji character from the selected word
  const kanjiChar = wordTerms[kanjiIndex].match(/[\u4e00-\u9faf]/)?.[0] || '日';
  const kanjiData = await fetchKanjiData(kanjiChar);

  const holidays = await fetchHolidays(today.getFullYear());
  const todaysHolidays = holidays.filter((h: { date: string }) => h.date === dateString);

  return res.status(200).json({
    date: dateString,
    dayOfWeek: DAYS_ENGLISH[dayOfWeek],
    dayOfWeekJapanese: DAYS_JAPANESE[dayOfWeek],
    jlptLevel,
    wordOfTheDay: wordData ? {
      word: wordData.word,
      reading: wordData.reading,
      meaning: wordData.meaning,
      partOfSpeech: wordData.partOfSpeech,
      jlptLevel,
      isLearned: learnedWords.has(wordData.word)
    } : null,
    kanjiOfTheDay: kanjiData ? {
      kanji: kanjiData.kanji,
      onyomi: kanjiData.onyomi,
      kunyomi: kanjiData.kunyomi,
      meaning: kanjiData.meaning,
      strokeCount: kanjiData.strokeCount,
      jlptLevel,
      isLearned: learnedKanji.has(kanjiData.kanji)
    } : {
      kanji: kanjiChar,
      onyomi: [],
      kunyomi: [],
      meaning: 'kanji',
      jlptLevel,
      isLearned: learnedKanji.has(kanjiChar)
    },
    holidays: todaysHolidays.map((h: { date: string; localName: string; name: string }) => {
      const cultural = holidayCulturalInfo[h.name] || {};
      return {
        date: h.date,
        localName: h.localName,
        nameEnglish: h.name,
        description: cultural.description,
        traditions: cultural.traditions,
        isNationalHoliday: true
      };
    })
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSettings(req: VercelRequest, res: VercelResponse, supabase: any, userId: string) {
  if (req.method === 'GET') {
    const { data } = await supabase
      .from('user_calendar_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    return res.status(200).json({
      jlptLevel: data?.jlpt_level || 'N5',
      icalToken: data?.ical_token || null
    });
  }

  if (req.method === 'PUT') {
    const { jlptLevel, generateIcalToken } = req.body || {};
    const validLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];
    if (jlptLevel && !validLevels.includes(jlptLevel)) {
      return res.status(400).json({ error: 'Invalid JLPT level' });
    }

    const updateData: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() };
    if (jlptLevel) updateData.jlpt_level = jlptLevel;
    if (generateIcalToken) updateData.ical_token = randomBytes(24).toString('base64url');

    const { data, error } = await supabase
      .from('user_calendar_settings')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'Failed to update settings' });

    return res.status(200).json({
      jlptLevel: data.jlpt_level,
      icalToken: data.ical_token
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleLearned(req: VercelRequest, res: VercelResponse, supabase: any, userId: string) {
  if (req.method === 'GET') {
    const { data } = await supabase
      .from('user_learned_items')
      .select('*')
      .eq('user_id', userId)
      .order('learned_date', { ascending: false });

    return res.status(200).json({
      items: (data || []).map(item => ({
        id: item.id,
        itemType: item.item_type,
        itemKey: item.item_key,
        reading: item.reading,
        meaning: item.meaning,
        jlptLevel: item.jlpt_level,
        learnedDate: item.learned_date
      }))
    });
  }

  if (req.method === 'POST') {
    const { itemType, itemKey, reading, meaning, jlptLevel } = req.body || {};
    if (!itemType || !itemKey || !meaning) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('user_learned_items')
      .upsert({
        user_id: userId,
        item_type: itemType,
        item_key: itemKey,
        reading: reading || null,
        meaning,
        jlpt_level: jlptLevel || null,
        learned_date: new Date().toISOString().split('T')[0]
      }, { onConflict: 'user_id,item_type,item_key' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'Failed to mark as learned' });

    return res.status(200).json({
      id: data.id,
      itemType: data.item_type,
      itemKey: data.item_key,
      meaning: data.meaning
    });
  }

  if (req.method === 'DELETE') {
    const { itemType, itemKey } = req.body || {};
    if (!itemType || !itemKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await supabase
      .from('user_learned_items')
      .delete()
      .eq('user_id', userId)
      .eq('item_type', itemType)
      .eq('item_key', itemKey);

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleIcal(req: VercelRequest, res: VercelResponse) {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).send('Missing token');
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).send('Server error');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: settings } = await supabase
    .from('user_calendar_settings')
    .select('jlpt_level')
    .eq('ical_token', token)
    .single();

  if (!settings) {
    return res.status(404).send('Calendar not found');
  }

  const jlptLevel = settings.jlpt_level || 'N5';
  const wordTerms = JLPT_SEARCH_TERMS[jlptLevel] || JLPT_SEARCH_TERMS.N5;
  const today = new Date();
  const events: string[] = [];

  const escapeIcal = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const formatDate = (date: Date) => date.toISOString().split('T')[0].replace(/-/g, '');

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    const dateFormatted = formatDate(date);
    const wordIndex = hashCode(dateString + jlptLevel + 'word') % wordTerms.length;

    events.push(`BEGIN:VEVENT
UID:wotd-${dateFormatted}@gojun.app
DTSTAMP:${formatDate(new Date())}T000000Z
DTSTART;VALUE=DATE:${dateFormatted}
SUMMARY:${escapeIcal(`Word: ${wordTerms[wordIndex]}`)}
DESCRIPTION:${escapeIcal(`JLPT ${jlptLevel} Word of the Day`)}
END:VEVENT`);
  }

  const holidays = await fetchHolidays(today.getFullYear());
  for (const h of holidays) {
    const hDate = new Date(h.date);
    const diff = (hDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (diff >= 0 && diff <= 365) {
      events.push(`BEGIN:VEVENT
UID:holiday-${h.date.replace(/-/g, '')}@gojun.app
DTSTAMP:${formatDate(new Date())}T000000Z
DTSTART;VALUE=DATE:${h.date.replace(/-/g, '')}
SUMMARY:${escapeIcal(`${h.localName}`)}
DESCRIPTION:${escapeIcal(h.name)}
END:VEVENT`);
    }
  }

  const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Gojun//Japanese Learning//EN
CALSCALE:GREGORIAN
X-WR-CALNAME:Gojun (${jlptLevel})
${events.join('\n')}
END:VCALENDAR`;

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  return res.status(200).send(ical);
}
