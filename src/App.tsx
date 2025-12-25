import { useState, useCallback } from 'react';
import { SentenceInput } from './components/SentenceInput';
import { SentenceDisplay } from './components/SentenceDisplay';
import { GrammarPanel } from './components/GrammarPanel';
import { parseEnglishSentence, describeSentenceStructure } from './services/englishParser';
import { translateSentence } from './services/japaneseApi';
import type { WordSlot, SentenceStructure, GrammarNote } from './types';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [sentenceStructure, setSentenceStructure] = useState<SentenceStructure | null>(null);
  const [wordSlots, setWordSlots] = useState<WordSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [structureDescription, setStructureDescription] = useState('');
  const [grammarNotes, setGrammarNotes] = useState<GrammarNote[]>([]);

  const handleSentenceSubmit = useCallback(async (sentence: string) => {
    setIsLoading(true);
    setShowAnswers(false);
    setSelectedSlotId(null);

    try {
      // Parse the English sentence first (for basic structure)
      const structure = parseEnglishSentence(sentence);

      // Get AI translation for the full sentence
      const aiTranslation = await translateSentence(sentence, structure.parsedWords);

      // Update structure with AI results
      structure.wordOrderDisplay = aiTranslation.wordOrderDisplay;
      structure.fullTranslation = aiTranslation.fullTranslation;

      setSentenceStructure(structure);
      setStructureDescription(describeSentenceStructure(structure));
      setGrammarNotes(aiTranslation.grammarNotes || []);

      // Create word slots from AI translation (already in Japanese order)
      const slots: WordSlot[] = aiTranslation.words.map((word, index) => ({
        id: `slot-${index}`,
        englishWord: {
          text: word.english,
          tag: word.partOfSpeech,
          role: word.role as 'subject' | 'verb' | 'object' | 'adjective' | 'adverb' | 'other'
        },
        japaneseWord: word,
        isFilledCorrectly: null,
        userAnswer: null
      }));

      setWordSlots(slots);
    } catch (error) {
      console.error('Error processing sentence:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSlotClick = useCallback((slotId: string) => {
    setSelectedSlotId(prev => prev === slotId ? null : slotId);
  }, []);

  const handleWordBankClick = useCallback((slotId: string, japanese: string) => {
    setWordSlots(prevSlots =>
      prevSlots.map(slot => {
        if (slot.id === slotId) {
          // If japanese is empty, clear the slot
          if (!japanese) {
            return {
              ...slot,
              userAnswer: null,
              isFilledCorrectly: null
            };
          }
          const isCorrect = slot.japaneseWord?.japanese === japanese;
          return {
            ...slot,
            userAnswer: japanese,
            isFilledCorrectly: isCorrect
          };
        }
        return slot;
      })
    );
    setSelectedSlotId(null);
  }, []);

  const handleReset = useCallback(() => {
    setWordSlots(prevSlots =>
      prevSlots.map(slot => ({
        ...slot,
        userAnswer: null,
        isFilledCorrectly: null
      }))
    );
    setShowAnswers(false);
    setSelectedSlotId(null);
  }, []);

  const handleShowAnswers = useCallback(() => {
    setShowAnswers(true);
    setWordSlots(prevSlots =>
      prevSlots.map(slot => ({
        ...slot,
        userAnswer: slot.japaneseWord?.japanese || null,
        isFilledCorrectly: true
      }))
    );
  }, []);

  const allCorrect = wordSlots.length > 0 &&
    wordSlots.every(slot => slot.isFilledCorrectly === true);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            語順 <span className="text-2xl text-gray-500">(Gojun)</span>
          </h1>
          <p className="text-gray-600">
            Learn Japanese word order by rearranging English sentences
          </p>
        </header>

        {/* Input */}
        <div className="mb-8">
          <SentenceInput onSubmit={handleSentenceSubmit} isLoading={isLoading} />
        </div>

        {/* Sentence Display */}
        {sentenceStructure && (
          <>
            <SentenceDisplay
              originalSentence={sentenceStructure.original}
              wordSlots={wordSlots}
              selectedSlotId={selectedSlotId}
              onSlotClick={handleSlotClick}
              onWordBankClick={handleWordBankClick}
              showAnswers={showAnswers}
              wordOrderDisplay={sentenceStructure.wordOrderDisplay}
              fullTranslation={sentenceStructure.fullTranslation}
            />

            {/* Controls */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleShowAnswers}
                className="px-4 py-2 text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
              >
                Show Answers
              </button>
            </div>

            {/* Success message */}
            {allCorrect && !showAnswers && (
              <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg text-center">
                <span className="text-green-800 font-medium text-lg">
                  🎉 正解！(Seikai!) - Correct!
                </span>
              </div>
            )}

            {/* Grammar Panel */}
            <GrammarPanel
              wordSlots={wordSlots}
              structureDescription={structureDescription}
              grammarNotes={grammarNotes}
            />
          </>
        )}

        {/* Instructions when no sentence */}
        {!sentenceStructure && !isLoading && (
          <div className="text-center p-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">
              Enter an English sentence above to get started!
            </p>
            <p className="text-gray-400 mt-2">
              Try: "I eat sushi" or "She reads a book"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
