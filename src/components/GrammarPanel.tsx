import type { WordSlot, GrammarNote } from '../types';

interface GrammarPanelProps {
  wordSlots: WordSlot[];
  structureDescription: string;
  grammarNotes?: GrammarNote[];
}

export function GrammarPanel({ wordSlots, structureDescription, grammarNotes }: GrammarPanelProps) {
  // Collect particles used in the sentence
  const particlesUsed = wordSlots
    .filter(slot => slot.japaneseWord?.particle)
    .map(slot => ({
      word: slot.japaneseWord!.japanese,
      particle: slot.japaneseWord!.particle!,
      meaning: slot.japaneseWord!.particleMeaning,
      explanation: slot.japaneseWord!.particleExplanation
    }));

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h2 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
          <span>📚</span> Grammar Notes
        </h2>

        {/* Sentence structure */}
        <div className="mb-4 p-3 bg-white rounded border border-amber-100">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
            Sentence Structure
          </h3>
          <p className="text-gray-800">{structureDescription}</p>
        </div>

        {/* Particles breakdown */}
        {particlesUsed.length > 0 && (
          <div className="mb-4 p-3 bg-white rounded border border-amber-100">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
              Particles Used (助詞)
            </h3>
            <div className="space-y-2">
              {particlesUsed.map((p, index) => (
                <div key={index} className="flex items-start gap-3 p-2 bg-blue-50 rounded">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-gray-800">{p.word}</span>
                    <span className="text-lg font-bold text-blue-600">+</span>
                    <span className="text-xl font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      {p.particle}
                    </span>
                  </div>
                  <div className="flex-1">
                    {p.meaning && (
                      <span className="text-sm font-medium text-blue-800">
                        "{p.meaning}"
                      </span>
                    )}
                    {p.explanation && (
                      <p className="text-xs text-gray-600 mt-1">{p.explanation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI-generated grammar notes */}
        {grammarNotes && grammarNotes.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              Grammar Points
            </h3>
            {grammarNotes.map((note, index) => (
              <div key={index} className="p-3 bg-white rounded border border-amber-100">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-base font-bold text-amber-700">{note.title}</span>
                  {note.titleJapanese && (
                    <span className="text-sm text-gray-500">({note.titleJapanese})</span>
                  )}
                </div>
                <p className="text-gray-700 text-sm">{note.explanation}</p>

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
        ) : (
          <p className="text-gray-500 text-sm italic">
            Grammar notes will appear here based on the sentence.
          </p>
        )}
      </div>
    </div>
  );
}
