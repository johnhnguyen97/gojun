import { useState, useEffect } from 'react';
import type { WordSlot, JapaneseWord } from '../types';
import { FavoriteButton } from './FavoriteButton';

// Tooltip component for hover info
function Tooltip({ word }: { word: JapaneseWord }) {
  const isParticle = word.partOfSpeech === 'particle';
  const isAuxiliary = word.partOfSpeech?.includes('auxiliary') || word.role === 'auxiliary';

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-50 min-w-[200px] max-w-[280px]">
      <div className="font-bold text-lg mb-1">
        {word.japanese} <span className="text-gray-400 font-normal">({word.reading})</span>
      </div>
      <div className="text-gray-300 text-xs mb-2">{word.romaji}</div>

      {/* Part of speech */}
      <div className="text-xs text-blue-300 mb-2">{word.partOfSpeech}</div>

      {/* Meaning */}
      {(isParticle || isAuxiliary) && word.particleMeaning && (
        <div className="bg-gray-800 rounded p-2 mb-2">
          <span className="text-yellow-300 font-medium">Meaning: </span>
          <span>{word.particleMeaning}</span>
        </div>
      )}

      {/* Explanation */}
      {word.particleExplanation && (
        <div className="text-gray-300 text-xs">
          {word.particleExplanation}
        </div>
      )}

      {/* English */}
      <div className="mt-2 pt-2 border-t border-gray-700">
        <span className="text-green-300">English: </span>
        <span>{word.english}</span>
      </div>

      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
    </div>
  );
}

interface SentenceDisplayProps {
  originalSentence: string;
  wordSlots: WordSlot[];
  selectedSlotId: string | null;
  onSlotClick: (slotId: string) => void;
  onWordBankClick: (slotId: string, answer: string) => void;
  showAnswers: boolean;
  wordOrderDisplay?: string;
  fullTranslation?: string;
}

export function SentenceDisplay({
  originalSentence,
  wordSlots,
  selectedSlotId,
  onSlotClick,
  onWordBankClick,
  showAnswers,
  wordOrderDisplay,
  fullTranslation
}: SentenceDisplayProps) {
  // Shuffle Japanese words for the word bank - track by slot ID
  const [shuffledSlots, setShuffledSlots] = useState<WordSlot[]>([]);
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<string | null>(null); // 'bank-{slotId}' or slot id
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null); // For tooltip

  useEffect(() => {
    const shuffled = [...wordSlots].sort(() => Math.random() - 0.5);
    setShuffledSlots(shuffled);
  }, [wordSlots]);

  // Handle drag start from word bank - track by slot ID
  const handleDragStart = (slotId: string, source: string) => {
    setDraggedSlotId(slotId);
    setDragSource(source);
  };

  // Handle drop on a slot
  const handleDrop = (targetSlotId: string) => {
    if (draggedSlotId) {
      const draggedSlot = wordSlots.find(s => s.id === draggedSlotId);
      if (draggedSlot?.japaneseWord) {
        // If dragging from another answer slot, clear that slot first
        if (dragSource && !dragSource.startsWith('bank-') && dragSource !== targetSlotId) {
          onWordBankClick(dragSource, ''); // Clear source slot
        }
        // Use slot ID as the answer to track uniquely
        onWordBankClick(targetSlotId, draggedSlotId);
      }
    }
    setDraggedSlotId(null);
    setDragSource(null);
  };

  // Handle dropping back to word bank (remove from slot)
  const handleDropToBank = () => {
    if (dragSource && !dragSource.startsWith('bank-')) {
      onWordBankClick(dragSource, ''); // Clear the slot
    }
    setDraggedSlotId(null);
    setDragSource(null);
  };

  // Check if a slot's word is used (by slot ID, not Japanese text)
  const isSlotUsed = (slotId: string) => {
    return wordSlots.some(s => s.userAnswer === slotId);
  };

  // Get the Japanese word for a user answer (which is now a slot ID)
  const getAnswerWord = (userAnswer: string) => {
    const answerSlot = wordSlots.find(s => s.id === userAnswer);
    return answerSlot?.japaneseWord;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 1. Original English sentence */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-500 uppercase tracking-wide">Original English:</span>
        <p className="text-2xl text-gray-800 mt-1 font-medium">{originalSentence}</p>
      </div>

      {/* 2. Japanese word order slots */}
      <div className="mb-6 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
        <h3 className="text-sm font-semibold text-amber-800 mb-2 uppercase tracking-wide text-center">
          Arrange in Japanese Order (日本語の語順)
        </h3>
        <p className="text-xs text-amber-600 text-center mb-4">
          {wordOrderDisplay || 'Subject → Object → Verb'}
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {wordSlots.map((slot, index) => {
            const answerWord = slot.userAnswer ? getAnswerWord(slot.userAnswer) : null;

            return (
              <div key={slot.id} className="flex flex-col items-center">
                {/* Slot number & role */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-700 bg-amber-200 rounded-full w-5 h-5 flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs text-amber-600 capitalize">{slot.englishWord.role}</span>
                </div>

                {/* Drop zone / Slot */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(slot.id)}
                  onClick={() => {
                    if (slot.userAnswer) {
                      // Clicking filled slot picks it up
                      handleDragStart(slot.userAnswer, slot.id);
                    } else {
                      // Clicking empty slot selects it
                      onSlotClick(slot.id);
                    }
                  }}
                  className={`${
                    slot.englishWord.role === 'particle' ? 'min-w-[60px] min-h-[60px]'
                    : slot.englishWord.role === 'auxiliary' || slot.englishWord.role === 'verb-stem' ? 'min-w-[80px] min-h-[70px]'
                    : 'min-w-[120px] min-h-[100px]'
                  } p-3 border-3 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer ${
                    slot.isFilledCorrectly === true
                      ? 'border-green-500 bg-green-100 border-solid'
                      : slot.isFilledCorrectly === false
                      ? 'border-red-500 bg-red-100 border-solid'
                      : selectedSlotId === slot.id
                      ? 'border-blue-500 bg-blue-50 border-solid'
                      : slot.userAnswer
                      ? slot.englishWord.role === 'particle' ? 'border-purple-400 bg-purple-50 border-solid'
                        : (slot.englishWord.role === 'auxiliary' || slot.englishWord.role === 'verb-stem') ? 'border-green-400 bg-green-50 border-solid'
                        : 'border-amber-400 bg-white border-solid'
                      : slot.englishWord.role === 'particle' ? 'border-purple-300 bg-purple-50 border-dashed hover:border-purple-400'
                        : (slot.englishWord.role === 'auxiliary' || slot.englishWord.role === 'verb-stem') ? 'border-green-300 bg-green-50 border-dashed hover:border-green-400'
                        : 'border-amber-300 bg-white border-dashed hover:border-amber-400 hover:bg-amber-50'
                  }`}
                >
                  {answerWord ? (
                    // Show the placed Japanese word
                    <div
                      draggable
                      onDragStart={() => handleDragStart(slot.userAnswer!, slot.id)}
                      className="flex flex-col items-center cursor-grab active:cursor-grabbing"
                    >
                      <span className="text-2xl font-bold text-gray-800">
                        {answerWord.japanese}
                      </span>
                      <span className="text-sm text-gray-600 mt-1">
                        {answerWord.reading}
                      </span>
                      {answerWord.particle && (
                        <span className="text-xs text-blue-600 mt-1">
                          + {answerWord.particle}
                        </span>
                      )}
                    </div>
                  ) : showAnswers && slot.japaneseWord ? (
                    // Show answer
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-green-700">
                        {slot.japaneseWord.japanese}
                      </span>
                      <span className="text-sm text-gray-600 mt-1">
                        {slot.japaneseWord.reading}
                      </span>
                    </div>
                  ) : (
                    // Empty slot
                    <span className="text-3xl text-amber-300">?</span>
                  )}
                </div>

                {/* English word hint */}
                <span className="text-xs text-gray-500 mt-2">
                  ({slot.englishWord.text})
                </span>
              </div>
            );
          })}
        </div>

        {/* Full translation shown after answers */}
        {fullTranslation && showAnswers && (
          <p className="text-center mt-4 text-sm text-amber-700 font-medium">
            Complete sentence: {fullTranslation}
          </p>
        )}
      </div>

      {/* 3. Japanese Word Bank */}
      <div
        className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropToBank}
      >
        <h3 className="text-sm font-semibold text-blue-800 mb-4 uppercase tracking-wide text-center">
          Word Bank (単語バンク) - Click a slot first, then click a word
        </h3>
        <div className="flex flex-wrap gap-4 justify-center min-h-[60px]">
          {shuffledSlots.map((slot) => {
            if (!slot.japaneseWord) return null;
            const isUsed = isSlotUsed(slot.id);
            const isParticle = slot.englishWord.role === 'particle';
            const isAuxiliary = slot.englishWord.role === 'auxiliary' || slot.englishWord.role === 'verb-stem';
            const showTooltip = hoveredSlotId === slot.id;

            return (
              <div
                key={`bank-${slot.id}`}
                className="relative"
                onMouseEnter={() => setHoveredSlotId(slot.id)}
                onMouseLeave={() => setHoveredSlotId(null)}
              >
                {/* Tooltip on hover */}
                {showTooltip && !isUsed && <Tooltip word={slot.japaneseWord} />}

                <div
                  draggable={!isUsed}
                  onDragStart={() => handleDragStart(slot.id, `bank-${slot.id}`)}
                  onClick={() => {
                    // Only fill if a slot is selected - NO auto-select
                    if (!isUsed && selectedSlotId) {
                      onWordBankClick(selectedSlotId, slot.id);
                    }
                  }}
                  className={`flex flex-col items-center p-4 border-2 rounded-xl shadow-md transition-all ${
                    isParticle
                      ? 'min-w-[70px] bg-purple-50'
                      : isAuxiliary
                      ? 'min-w-[80px] bg-green-50'
                      : 'min-w-[100px] bg-white'
                  } ${
                    isUsed
                      ? 'opacity-30 cursor-not-allowed border-gray-200 bg-gray-50'
                      : selectedSlotId
                      ? isParticle
                        ? 'border-purple-300 hover:border-purple-500 hover:bg-purple-100 hover:-translate-y-1 hover:shadow-lg cursor-pointer'
                        : isAuxiliary
                        ? 'border-green-300 hover:border-green-500 hover:bg-green-100 hover:-translate-y-1 hover:shadow-lg cursor-pointer'
                        : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50 hover:-translate-y-1 hover:shadow-lg cursor-pointer'
                      : isParticle
                      ? 'border-purple-300 cursor-grab active:cursor-grabbing'
                      : isAuxiliary
                      ? 'border-green-300 cursor-grab active:cursor-grabbing'
                      : 'border-blue-300 cursor-grab active:cursor-grabbing'
                  }`}
                >
                  {/* Favorite Button */}
                  {!isUsed && (
                    <FavoriteButton
                      word={slot.japaneseWord.japanese}
                      reading={slot.japaneseWord.reading}
                      english={slot.japaneseWord.english}
                      isFavorited={false}
                    />
                  )}
                  {/* Japanese word */}
                  <span className={`font-bold ${
                    isParticle ? 'text-3xl text-purple-700'
                    : isAuxiliary ? 'text-2xl text-green-700'
                    : 'text-2xl text-gray-800'
                  }`}>
                    {slot.japaneseWord.japanese}
                  </span>
                  {/* Reading */}
                  {(!isParticle || slot.japaneseWord.reading !== slot.japaneseWord.japanese) && (
                    <span className="text-sm text-gray-600 mt-1">
                      {slot.japaneseWord.reading}
                    </span>
                  )}
                  {/* Romaji */}
                  <span className="text-xs text-gray-400 italic">
                    {slot.japaneseWord.romaji}
                  </span>
                  {/* Particle/Auxiliary meaning */}
                  {(isParticle || isAuxiliary) && slot.japaneseWord.particleMeaning && (
                    <span className={`text-xs mt-1 text-center font-medium ${isParticle ? 'text-purple-600' : 'text-green-600'}`}>
                      {slot.japaneseWord.particleMeaning}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <p className="text-center text-sm text-gray-500 mt-4">
        {selectedSlotId
          ? '👆 Now click a word from the bank to place it'
          : 'Click a slot to select it, then click a word to place it (or drag and drop)'
        }
      </p>
    </div>
  );
}
