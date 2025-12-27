import { useState, useEffect, useRef } from 'react';

interface WordNote {
  word: string;
  note: string;
  updated_at: string;
}

interface WordNoteButtonProps {
  word: string;
  reading: string;
  english: string;
  onPopupChange?: (isOpen: boolean) => void;
}

export function WordNoteButton({ word, reading, english, onPopupChange }: WordNoteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [hasNote, setHasNote] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load note from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('gojun-word-notes');
    if (stored) {
      const notes: WordNote[] = JSON.parse(stored);
      const existing = notes.find(n => n.word === word);
      if (existing) {
        setNote(existing.note);
        setHasNote(true);
      }
    }
  }, [word]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        onPopupChange?.(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onPopupChange]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isOpen;
    setIsOpen(newState);
    onPopupChange?.(newState);
  };

  const saveNote = () => {
    const stored = localStorage.getItem('gojun-word-notes');
    let notes: WordNote[] = stored ? JSON.parse(stored) : [];

    const existingIndex = notes.findIndex(n => n.word === word);

    if (note.trim()) {
      const newNote: WordNote = {
        word,
        note: note.trim(),
        updated_at: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        notes[existingIndex] = newNote;
      } else {
        notes.push(newNote);
      }
      setHasNote(true);
    } else {
      notes = notes.filter(n => n.word !== word);
      setHasNote(false);
    }

    localStorage.setItem('gojun-word-notes', JSON.stringify(notes));
    setIsOpen(false);
    onPopupChange?.(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all active:scale-90 ${
          hasNote
            ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm'
            : 'bg-white/90 shadow-sm border border-gray-200 hover:bg-purple-50 hover:border-purple-300 text-gray-400 hover:text-purple-500'
        }`}
        title={hasNote ? 'Edit note' : 'Add note'}
      >
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {/* Popup */}
      {isOpen && (
        <div
          ref={popupRef}
          className="absolute z-[100] w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-[scaleIn_0.15s_ease-out]"
          style={{ bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-3 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
            <div className="font-bold text-sm truncate">{word}</div>
            <div className="text-xs text-white/70 truncate">{reading} • {english}</div>
          </div>

          {/* Note input */}
          <div className="p-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write a quick note..."
              className="w-full h-16 p-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
              autoFocus
            />

            {/* Actions */}
            <div className="flex justify-end gap-1 mt-2">
              {hasNote && (
                <button
                  onClick={() => {
                    setNote('');
                    saveNote();
                  }}
                  className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={saveNote}
                className="px-3 py-1 text-xs bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded font-medium hover:shadow-md transition-all"
              >
                Save
              </button>
            </div>
          </div>

          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white" style={{ marginTop: '-1px' }} />
        </div>
      )}
    </div>
  );
}
