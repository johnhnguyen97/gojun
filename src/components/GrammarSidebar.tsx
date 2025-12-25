import type { WordSlot, GrammarNote } from '../types';

interface GrammarData {
  sentenceIndex: number;
  original: string;
  wordSlots: WordSlot[];
  structureDescription: string;
  grammarNotes: GrammarNote[];
  isActive: boolean;
}

interface GrammarSidebarProps {
  grammarData: GrammarData[];
  activeSentenceIndex: number;
  onSelectSentence: (index: number) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export function GrammarSidebar({
  grammarData,
  activeSentenceIndex,
  onSelectSentence,
  onClose,
  isMobile = false
}: GrammarSidebarProps) {
  const activeData = grammarData.find(d => d.sentenceIndex === activeSentenceIndex);

  // Collect particles from active sentence
  const particlesUsed = activeData?.wordSlots
    .filter(slot => slot.japaneseWord?.particle)
    .map(slot => ({
      word: slot.japaneseWord!.japanese,
      particle: slot.japaneseWord!.particle!,
      meaning: slot.japaneseWord!.particleMeaning,
      explanation: slot.japaneseWord!.particleExplanation
    })) || [];

  return (
    <div className={`${isMobile ? '' : 'h-full flex flex-col'}`}>
      {/* Header */}
      <div className={`${isMobile ? 'mb-4' : 'sticky top-0 bg-white z-10 border-b border-gray-200'} p-4`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-amber-800 flex items-center gap-2">
            <span>📚</span> Grammar Notes
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sentence tabs */}
        {grammarData.length > 1 && (
          <div className="flex gap-1 mt-3 flex-wrap">
            {grammarData.map((data) => (
              <button
                key={data.sentenceIndex}
                onClick={() => onSelectSentence(data.sentenceIndex)}
                className={`px-3 py-1 text-sm rounded-full transition-all ${
                  data.sentenceIndex === activeSentenceIndex
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={data.original.substring(0, 50)}
              >
                #{data.sentenceIndex + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`${isMobile ? '' : 'flex-1 overflow-y-auto'} p-4 pt-0`}>
        {activeData ? (
          <div className="space-y-4">
            {/* Current sentence preview */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-sm text-gray-700 italic">"{activeData.original}"</p>
            </div>

            {/* Sentence structure */}
            {activeData.structureDescription && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Structure
                </h3>
                <p className="text-sm text-gray-700">{activeData.structureDescription}</p>
              </div>
            )}

            {/* Particles breakdown */}
            {particlesUsed.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Particles (助詞)
                </h3>
                <div className="space-y-2">
                  {particlesUsed.map((p, index) => (
                    <div key={index} className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="font-bold text-gray-800">{p.word}</span>
                        <span className="text-blue-600">+</span>
                        <span className="font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded text-sm">
                          {p.particle}
                        </span>
                      </div>
                      {p.meaning && (
                        <p className="text-xs text-blue-800 font-medium">"{p.meaning}"</p>
                      )}
                      {p.explanation && (
                        <p className="text-xs text-gray-600 mt-1">{p.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grammar notes */}
            {activeData.grammarNotes.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Grammar Points
                </h3>
                <div className="space-y-3">
                  {activeData.grammarNotes.map((note, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-amber-700">{note.title}</span>
                        {note.titleJapanese && (
                          <span className="text-xs text-gray-500">({note.titleJapanese})</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{note.explanation}</p>

                      {/* Atomic breakdown */}
                      {note.atomicBreakdown && note.atomicBreakdown.length > 0 && (
                        <div className="mt-3 p-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                          <h4 className="text-xs font-semibold text-purple-700 mb-2">
                            🔬 Atomic Breakdown
                          </h4>
                          <div className="space-y-1.5">
                            {note.atomicBreakdown.map((atom, atomIndex) => (
                              <div key={atomIndex} className="flex items-start gap-2 text-xs">
                                <div className="flex items-center gap-1.5 min-w-fit">
                                  <span className="font-bold text-purple-900 bg-white px-2 py-0.5 rounded border border-purple-300">
                                    {atom.component}
                                  </span>
                                  <span className="text-purple-600 font-medium px-1.5 py-0.5 bg-purple-100 rounded">
                                    {atom.type}
                                  </span>
                                </div>
                                {atom.meaning && (
                                  <span className="text-gray-700 italic flex-1">
                                    {atom.meaning}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {note.example && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <p className="text-gray-800 font-medium">{note.example}</p>
                          {note.exampleTranslation && (
                            <p className="text-gray-500 text-xs mt-1">{note.exampleTranslation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Word breakdown */}
            {activeData.wordSlots.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Word Breakdown
                </h3>
                <div className="space-y-1">
                  {activeData.wordSlots.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{slot.japaneseWord?.japanese}</span>
                        <span className="text-gray-500 text-xs">({slot.japaneseWord?.reading})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-600">{slot.englishWord.text}</span>
                        <span className="text-xs text-gray-400 ml-1">({slot.englishWord.role})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic text-center py-8">
            Select a sentence to view grammar notes
          </p>
        )}
      </div>
    </div>
  );
}
