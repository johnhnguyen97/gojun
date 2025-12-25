import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Settings } from './components/Settings';
import { SentenceInput } from './components/SentenceInput';
import { SentenceDisplay } from './components/SentenceDisplay';
import { GrammarSidebar } from './components/GrammarSidebar';
import { ToolboxButton } from './components/ToolboxButton';
import { parseEnglishSentence, describeSentenceStructure } from './services/englishParser';
import { translateSentence } from './services/japaneseApi';
import type { WordSlot, SentenceStructure, GrammarNote } from './types';

// Split text into sentences
function splitIntoSentences(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return sentences.length > 0 ? sentences : [text];
}

// State for each sentence
interface SentenceState {
  original: string;
  structure: SentenceStructure | null;
  wordSlots: WordSlot[];
  selectedSlotId: string | null;
  showAnswers: boolean;
  structureDescription: string;
  grammarNotes: GrammarNote[];
  isLoading: boolean;
  error: string | null;
  isComplete: boolean;
}

function AppContent() {
  const { user, session, loading, hasApiKey } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Multi-sentence state - each sentence has its own state
  const [sentences, setSentences] = useState<SentenceState[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(0);

  const loadSentence = useCallback(async (sentence: string, index: number): Promise<Partial<SentenceState>> => {
    if (!session?.access_token) {
      return { error: 'Please sign in to use the translator', isLoading: false };
    }

    try {
      const structure = parseEnglishSentence(sentence);
      const aiTranslation = await translateSentence(
        sentence,
        structure.parsedWords,
        session.access_token
      );

      structure.wordOrderDisplay = aiTranslation.wordOrderDisplay;
      structure.fullTranslation = aiTranslation.fullTranslation;

      const slots: WordSlot[] = aiTranslation.words.map((word, idx) => ({
        id: `sentence-${index}-slot-${idx}`,
        englishWord: {
          text: word.english,
          tag: word.partOfSpeech,
          role: word.role as 'subject' | 'verb' | 'object' | 'adjective' | 'adverb' | 'other'
        },
        japaneseWord: word,
        isFilledCorrectly: null,
        userAnswer: null
      }));

      return {
        structure,
        wordSlots: slots,
        structureDescription: describeSentenceStructure(structure),
        grammarNotes: aiTranslation.grammarNotes || [],
        isLoading: false,
        error: null
      };
    } catch (err) {
      console.error('Error processing sentence:', err);
      return {
        error: err instanceof Error ? err.message : 'Failed to translate sentence',
        isLoading: false
      };
    }
  }, [session]);

  const handleTextSubmit = useCallback(async (text: string) => {
    if (!hasApiKey) {
      setGlobalError('Please add your Anthropic API key in Settings');
      setShowSettings(true);
      return;
    }

    const sentenceTexts = splitIntoSentences(text).slice(0, 6); // Max 6 sentences
    setIsLoadingAll(true);
    setGlobalError(null);
    setActiveSentenceIndex(0);

    // Initialize all sentences with loading state
    const initialStates: SentenceState[] = sentenceTexts.map((s) => ({
      original: s,
      structure: null,
      wordSlots: [],
      selectedSlotId: null,
      showAnswers: false,
      structureDescription: '',
      grammarNotes: [],
      isLoading: true,
      error: null,
      isComplete: false
    }));
    setSentences(initialStates);

    // Load all sentences in parallel
    const results = await Promise.all(
      sentenceTexts.map((sentence, index) => loadSentence(sentence, index))
    );

    // Update with results
    setSentences(prev => prev.map((s, i) => ({
      ...s,
      ...results[i]
    })));

    setIsLoadingAll(false);
  }, [hasApiKey, loadSentence]);

  const handleSlotClick = useCallback((sentenceIndex: number, slotId: string) => {
    setActiveSentenceIndex(sentenceIndex);
    setSentences(prev => prev.map((s, i) => {
      if (i === sentenceIndex) {
        return { ...s, selectedSlotId: s.selectedSlotId === slotId ? null : slotId };
      }
      return s;
    }));
  }, []);

  const handleWordBankClick = useCallback((sentenceIndex: number, targetSlotId: string, answerSlotId: string) => {
    setSentences(prev => prev.map((s, i) => {
      if (i !== sentenceIndex) return s;

      const newSlots = s.wordSlots.map(slot => {
        if (slot.id === targetSlotId) {
          if (!answerSlotId) {
            return { ...slot, userAnswer: null, isFilledCorrectly: null };
          }
          const isCorrect = slot.id === answerSlotId;
          return { ...slot, userAnswer: answerSlotId, isFilledCorrectly: isCorrect };
        }
        return slot;
      });

      const allCorrect = newSlots.length > 0 && newSlots.every(slot => slot.isFilledCorrectly === true);

      return {
        ...s,
        wordSlots: newSlots,
        selectedSlotId: null,
        isComplete: allCorrect
      };
    }));
  }, []);

  const handleReset = useCallback((sentenceIndex: number) => {
    setSentences(prev => prev.map((s, i) => {
      if (i !== sentenceIndex) return s;
      return {
        ...s,
        wordSlots: s.wordSlots.map(slot => ({ ...slot, userAnswer: null, isFilledCorrectly: null })),
        showAnswers: false,
        selectedSlotId: null,
        isComplete: false
      };
    }));
  }, []);

  const handleShowAnswers = useCallback((sentenceIndex: number) => {
    setSentences(prev => prev.map((s, i) => {
      if (i !== sentenceIndex) return s;
      return {
        ...s,
        showAnswers: true,
        wordSlots: s.wordSlots.map(slot => ({ ...slot, userAnswer: slot.id, isFilledCorrectly: true }))
      };
    }));
  }, []);

  const handleResetAll = useCallback(() => {
    setSentences(prev => prev.map(s => ({
      ...s,
      wordSlots: s.wordSlots.map(slot => ({ ...slot, userAnswer: null, isFilledCorrectly: null })),
      showAnswers: false,
      selectedSlotId: null,
      isComplete: false
    })));
  }, []);

  const completedCount = sentences.filter(s => s.isComplete).length;
  const totalCount = sentences.length;

  // Collect all grammar data for sidebar
  const allGrammarData = sentences.map((s, i) => ({
    sentenceIndex: i,
    original: s.original,
    wordSlots: s.wordSlots,
    structureDescription: s.structureDescription,
    grammarNotes: s.grammarNotes,
    isActive: i === activeSentenceIndex
  })).filter(s => s.grammarNotes.length > 0 || s.wordSlots.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const hasSentences = sentences.length > 0;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main layout with sidebar */}
      <div className="flex">
        {/* Main content area */}
        <div className={`flex-1 py-8 px-4 transition-all duration-300 ${hasSentences && sidebarOpen ? 'lg:mr-80' : ''}`}>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <header className="text-center mb-8 relative">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                語順 <span className="text-2xl text-gray-500">(Gojun)</span>
              </h1>
              <p className="text-gray-600">
                Learn Japanese word order by rearranging English sentences
              </p>

              <button
                onClick={() => setShowSettings(true)}
                className="absolute right-0 top-0 p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {!hasApiKey && (
                <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-lg text-amber-800 text-sm">
                  <button onClick={() => setShowSettings(true)} className="font-medium underline hover:no-underline">
                    Add your Anthropic API key
                  </button>
                  {' '}to start translating sentences.
                </div>
              )}
            </header>

            {globalError && (
              <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
                {globalError}
              </div>
            )}

            {/* Input */}
            <div className="mb-8">
              <SentenceInput onSubmit={handleTextSubmit} isLoading={isLoadingAll} />
            </div>

            {/* Progress Overview (when multiple sentences) */}
            {sentences.length > 1 && (
              <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-medium text-gray-700">
                    Progress: {completedCount} / {totalCount} sentences
                  </span>
                  <div className="flex gap-1">
                    {sentences.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveSentenceIndex(i)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          s.isComplete ? 'bg-green-500' : s.isLoading ? 'bg-gray-300 animate-pulse' : 'bg-gray-300'
                        } ${i === activeSentenceIndex ? 'ring-2 ring-amber-500 ring-offset-1' : ''}`}
                        title={`Sentence ${i + 1}: ${s.original.substring(0, 30)}...`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  {sentences.length > 0 && (
                    <button
                      onClick={handleResetAll}
                      className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Reset All
                    </button>
                  )}
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="px-3 py-1 text-sm text-amber-600 bg-amber-50 rounded hover:bg-amber-100 hidden lg:block"
                  >
                    {sidebarOpen ? 'Hide Notes' : 'Show Notes'}
                  </button>
                </div>
              </div>
            )}

            {/* All Sentences Display */}
            <div className="space-y-8">
              {sentences.map((sentence, index) => (
                <div
                  key={index}
                  className="relative"
                  onClick={() => setActiveSentenceIndex(index)}
                >
                  {/* Sentence number badge */}
                  {sentences.length > 1 && (
                    <div className={`absolute -left-4 -top-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white z-10 transition-all ${
                      sentence.isComplete ? 'bg-green-500' : index === activeSentenceIndex ? 'bg-amber-600 ring-2 ring-amber-300' : 'bg-amber-500'
                    }`}>
                      {index + 1}
                    </div>
                  )}

                  {sentence.isLoading ? (
                    <div className="p-8 bg-white rounded-lg border border-gray-200 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
                      <p className="mt-2 text-gray-600">Translating: "{sentence.original}"</p>
                    </div>
                  ) : sentence.error ? (
                    <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
                      <p className="font-medium">Error with sentence {index + 1}:</p>
                      <p>{sentence.error}</p>
                      <p className="text-sm mt-2 text-gray-600">"{sentence.original}"</p>
                    </div>
                  ) : sentence.structure ? (
                    <div className={`transition-all ${sentence.isComplete ? 'ring-2 ring-green-500 ring-offset-2 rounded-xl' : index === activeSentenceIndex ? 'ring-2 ring-amber-300 ring-offset-2 rounded-xl' : ''}`}>
                      <SentenceDisplay
                        originalSentence={sentence.structure.original}
                        wordSlots={sentence.wordSlots}
                        selectedSlotId={sentence.selectedSlotId}
                        onSlotClick={(slotId) => handleSlotClick(index, slotId)}
                        onWordBankClick={(targetSlotId, answerSlotId) => handleWordBankClick(index, targetSlotId, answerSlotId)}
                        showAnswers={sentence.showAnswers}
                        wordOrderDisplay={sentence.structure.wordOrderDisplay}
                        fullTranslation={sentence.structure.fullTranslation}
                      />

                      {/* Controls for this sentence */}
                      <div className="flex justify-center gap-4 mt-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReset(index); }}
                          className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Reset
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleShowAnswers(index); }}
                          className="px-4 py-2 text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          Show Answers
                        </button>
                      </div>

                      {/* Success message for this sentence */}
                      {sentence.isComplete && !sentence.showAnswers && (
                        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-center">
                          <span className="text-green-800 font-medium">
                            正解！(Seikai!) - Correct!
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* All Complete Celebration */}
            {totalCount > 0 && completedCount === totalCount && !sentences.some(s => s.showAnswers) && (
              <div className="mt-8 p-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl text-center text-white">
                <h2 className="text-2xl font-bold mb-2">
                  全部正解！(Zenbu Seikai!) - All Correct!
                </h2>
                <p className="text-green-100">
                  You completed all {totalCount} sentences!
                </p>
              </div>
            )}

            {/* Instructions when no sentence */}
            {sentences.length === 0 && !isLoadingAll && (
              <div className="text-center p-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">
                  Enter English text above to get started!
                </p>
                <p className="text-gray-400 mt-2">
                  You can enter a single sentence or paste a paragraph (up to 6 sentences).
                </p>
                <p className="text-gray-400 mt-1 text-sm">
                  Try: "The weather is nice today. I want to go to the park."
                </p>
              </div>
            )}

            {/* Mobile: Show grammar notes inline at bottom */}
            {hasSentences && allGrammarData.length > 0 && (
              <div className="lg:hidden mt-8">
                <GrammarSidebar
                  grammarData={allGrammarData}
                  activeSentenceIndex={activeSentenceIndex}
                  onSelectSentence={setActiveSentenceIndex}
                  isMobile={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Fixed sidebar for grammar notes */}
        {hasSentences && sidebarOpen && allGrammarData.length > 0 && (
          <div className="hidden lg:block fixed right-0 top-0 h-screen w-80 bg-white border-l border-gray-200 overflow-y-auto shadow-lg">
            <GrammarSidebar
              grammarData={allGrammarData}
              activeSentenceIndex={activeSentenceIndex}
              onSelectSentence={setActiveSentenceIndex}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Floating Toolbox Button */}
      <ToolboxButton />

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
