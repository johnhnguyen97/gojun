import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDailyData, getSettings, updateSettings, markAsLearned, removeLearnedStatus, getIcalUrl } from '../../services/calendarApi';
import type { DailyCalendarData, CalendarSettings, JLPTLevel } from '../../types/calendar';

interface LearningCalendarProps {
  onClose: () => void;
}

export function LearningCalendar({ onClose }: LearningCalendarProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<DailyCalendarData | null>(null);
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [showIcalModal, setShowIcalModal] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);

    try {
      const [daily, userSettings] = await Promise.all([
        getDailyData(session.access_token),
        getSettings(session.access_token)
      ]);
      setDailyData(daily);
      setSettings(userSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLevelChange = async (newLevel: JLPTLevel) => {
    if (!session?.access_token) return;

    try {
      const updated = await updateSettings(session.access_token, { jlptLevel: newLevel });
      setSettings(updated);
      // Reload daily data with new level
      const daily = await getDailyData(session.access_token);
      setDailyData(daily);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update level');
    }
  };

  const handleToggleLearned = async (type: 'word' | 'kanji', isCurrentlyLearned: boolean) => {
    if (!session?.access_token || !dailyData) return;

    const item = type === 'word' ? dailyData.wordOfTheDay : dailyData.kanjiOfTheDay;
    if (!item) return;

    try {
      if (isCurrentlyLearned) {
        await removeLearnedStatus(
          session.access_token,
          type,
          type === 'word' ? (item as typeof dailyData.wordOfTheDay)!.word : (item as typeof dailyData.kanjiOfTheDay)!.kanji
        );
      } else {
        await markAsLearned(session.access_token, {
          itemType: type,
          itemKey: type === 'word' ? (item as typeof dailyData.wordOfTheDay)!.word : (item as typeof dailyData.kanjiOfTheDay)!.kanji,
          reading: type === 'word' ? (item as typeof dailyData.wordOfTheDay)!.reading : undefined,
          meaning: item.meaning,
          jlptLevel: dailyData.jlptLevel
        });
      }

      // Reload data
      const daily = await getDailyData(session.access_token);
      setDailyData(daily);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update learned status');
    }
  };

  const handleGenerateIcalToken = async () => {
    if (!session?.access_token) return;

    setGeneratingToken(true);
    try {
      const updated = await updateSettings(session.access_token, { generateIcalToken: true });
      setSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate calendar URL');
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCopyIcalUrl = async () => {
    if (!settings?.icalToken) return;

    try {
      await navigator.clipboard.writeText(getIcalUrl(settings.icalToken));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = getIcalUrl(settings.icalToken);
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!session) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
          <p className="text-center text-gray-600 dark:text-gray-300">Please sign in to use the Learning Calendar.</p>
          <button onClick={onClose} className="mt-4 w-full py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📅</span> Learning Calendar
            </h2>
            <div className="flex items-center gap-3">
              {/* Level Selector */}
              <select
                value={settings?.jlptLevel || 'N5'}
                onChange={(e) => handleLevelChange(e.target.value as JLPTLevel)}
                className="bg-white/20 text-white border border-white/30 rounded-lg px-3 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="N5" className="text-gray-800">N5</option>
                <option value="N4" className="text-gray-800">N4</option>
                <option value="N3" className="text-gray-800">N3</option>
                <option value="N2" className="text-gray-800">N2</option>
                <option value="N1" className="text-gray-800">N1</option>
              </select>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg">
                {error}
                <button onClick={loadData} className="ml-2 underline">Retry</button>
              </div>
            ) : dailyData ? (
              <div className="space-y-6">
                {/* Date Display */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">
                    {new Date(dailyData.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-lg text-indigo-600 dark:text-indigo-400 font-medium">
                    {dailyData.dayOfWeekJapanese}
                  </div>
                </div>

                {/* Word of the Day */}
                {dailyData.wordOfTheDay && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-indigo-100 dark:border-indigo-900">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Word of the Day
                      </span>
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                        {dailyData.jlptLevel}
                      </span>
                    </div>
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold text-gray-800 dark:text-white mb-1">
                        {dailyData.wordOfTheDay.word}
                      </div>
                      <div className="text-xl text-gray-500 dark:text-gray-400">
                        {dailyData.wordOfTheDay.reading}
                      </div>
                      <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                        {dailyData.wordOfTheDay.partOfSpeech}
                      </div>
                    </div>
                    <div className="text-center text-lg text-gray-700 dark:text-gray-300 mb-4">
                      "{dailyData.wordOfTheDay.meaning}"
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleToggleLearned('word', dailyData.wordOfTheDay!.isLearned)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          dailyData.wordOfTheDay.isLearned
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {dailyData.wordOfTheDay.isLearned ? '✓ Learned' : 'Mark as Learned'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Kanji of the Day */}
                {dailyData.kanjiOfTheDay && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-purple-100 dark:border-purple-900">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                        Kanji of the Day
                      </span>
                      <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                        {dailyData.jlptLevel}
                      </span>
                    </div>
                    <div className="text-center mb-4">
                      <div className="text-6xl font-bold text-gray-800 dark:text-white mb-2">
                        {dailyData.kanjiOfTheDay.kanji}
                      </div>
                      {dailyData.kanjiOfTheDay.strokeCount && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                          {dailyData.kanjiOfTheDay.strokeCount} strokes
                        </div>
                      )}

                      {/* Readings */}
                      <div className="space-y-1 mb-3">
                        {dailyData.kanjiOfTheDay.onyomi && dailyData.kanjiOfTheDay.onyomi.length > 0 && (
                          <div className="text-sm">
                            <span className="text-purple-500 dark:text-purple-400 font-medium">音: </span>
                            <span className="text-gray-600 dark:text-gray-300">
                              {dailyData.kanjiOfTheDay.onyomi.join('、')}
                            </span>
                          </div>
                        )}
                        {dailyData.kanjiOfTheDay.kunyomi && dailyData.kanjiOfTheDay.kunyomi.length > 0 && (
                          <div className="text-sm">
                            <span className="text-purple-500 dark:text-purple-400 font-medium">訓: </span>
                            <span className="text-gray-600 dark:text-gray-300">
                              {dailyData.kanjiOfTheDay.kunyomi.join('、')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-center text-lg text-gray-700 dark:text-gray-300 mb-4">
                      "{dailyData.kanjiOfTheDay.meaning}"
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleToggleLearned('kanji', dailyData.kanjiOfTheDay!.isLearned)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          dailyData.kanjiOfTheDay.isLearned
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {dailyData.kanjiOfTheDay.isLearned ? '✓ Learned' : 'Mark as Learned'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Holidays */}
                {dailyData.holidays.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-amber-100 dark:border-amber-900">
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Today's Holiday
                    </span>
                    {dailyData.holidays.map((holiday, idx) => (
                      <div key={idx} className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🎌</span>
                          <div>
                            <div className="text-xl font-bold text-gray-800 dark:text-white">
                              {holiday.localName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {holiday.nameEnglish}
                            </div>
                          </div>
                        </div>
                        {holiday.description && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                            {holiday.description}
                          </p>
                        )}
                        {holiday.traditions && holiday.traditions.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {holiday.traditions.map((t, i) => (
                              <span key={i} className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-white/50 dark:bg-gray-800/50">
            <button
              onClick={() => setShowIcalModal(true)}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-colors flex items-center justify-center gap-2"
            >
              <span>📤</span> Export to Calendar
            </button>
          </div>
        </div>
      </div>

      {/* iCal Export Modal */}
      {showIcalModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowIcalModal(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 pointer-events-auto">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Subscribe to Calendar</h3>

              {settings?.icalToken ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Copy this URL and add it to Google Calendar, Apple Calendar, or any calendar app that supports iCal subscriptions.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getIcalUrl(settings.icalToken)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    />
                    <button
                      onClick={handleCopyIcalUrl}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        copied
                          ? 'bg-green-500 text-white'
                          : 'bg-indigo-500 text-white hover:bg-indigo-600'
                      }`}
                    >
                      {copied ? '✓' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <strong>Google Calendar:</strong> Settings → Add calendar → From URL
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Generate a subscription URL to sync your Word of the Day, Kanji of the Day, and Japanese holidays with your calendar.
                  </p>
                  <button
                    onClick={handleGenerateIcalToken}
                    disabled={generatingToken}
                    className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50"
                  >
                    {generatingToken ? 'Generating...' : 'Generate Subscription URL'}
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowIcalModal(false)}
                className="mt-4 w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default LearningCalendar;
