import React from 'react';
import type { FollowUpQuestion } from '../../types';
import { useTheme } from "../../context/ThemeContext";

interface EmojiReactionFeedbackProps {
  question: FollowUpQuestion;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  error?: boolean;
}

const EMOJI_REACTIONS = [
  { emoji: '😢', label: 'Sad', value: '1' },
  { emoji: '😕', label: 'Dull', value: '2' },
  { emoji: '😐', label: 'Neutral', value: '3' },
  { emoji: '😊', label: 'Smile', value: '4' },
  { emoji: '😂', label: 'Laugh', value: '5' },
];

export default function EmojiReactionFeedback({
  value,
  onChange,
  readOnly = false,
  error = false,
}: EmojiReactionFeedbackProps) {
  const { darkMode } = useTheme();
  const selectedReaction = EMOJI_REACTIONS.find(r => r.value === value);

  return (
    <div className="space-y-6 max-w-md">
      <div className={`grid grid-cols-5 gap-2 p-2 rounded-2xl border transition-all duration-300 ${
        darkMode 
          ? 'bg-slate-900/40 border-slate-800/60 backdrop-blur-md shadow-[0_4px_20px_-5px_rgba(0,0,0,0.3)]' 
          : 'bg-white/60 border-slate-200/60 backdrop-blur-md shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)]'
      } ${
        error ? "border-red-500 ring-4 ring-red-500/10" : ""
      }`}>
        {EMOJI_REACTIONS.map((reaction) => {
          const isSelected = value === reaction.value;
          return (
            <button
              key={reaction.value}
              type="button"
              onClick={() => !readOnly && onChange(reaction.value)}
              disabled={readOnly}
              className={`relative flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all duration-500 group ${
                readOnly ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
              } ${
                isSelected
                  ? darkMode 
                    ? 'bg-blue-500/15 shadow-[inset_0_0_12px_rgba(59,130,246,0.1)]' 
                    : 'bg-blue-50/80 shadow-[inset_0_0_12px_rgba(59,130,246,0.05)]'
                  : 'hover:bg-slate-500/5'
              }`}
            >
              <div className={`absolute inset-0 rounded-xl transition-opacity duration-500 ${
                isSelected 
                  ? darkMode ? 'opacity-100 bg-blue-500/5' : 'opacity-100 bg-blue-500/5' 
                  : 'opacity-0'
              }`} />
              
              <span className={`relative text-2xl transition-all duration-500 ${
                isSelected 
                  ? 'scale-110 filter-none drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]' 
                  : 'grayscale-[0.6] opacity-40 blur-[0.3px] group-hover:grayscale-0 group-hover:opacity-100 group-hover:blur-0'
              }`}>
                {reaction.emoji}
              </span>
              
              <span className={`relative mt-2 text-[8px] font-bold uppercase tracking-[0.1em] transition-all duration-300 ${
                isSelected 
                  ? darkMode ? 'text-blue-400' : 'text-blue-600' 
                  : 'text-slate-400 opacity-0 group-hover:opacity-100'
              }`}>
                {reaction.label}
              </span>

              {isSelected && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center min-h-[32px]">
        {selectedReaction ? (
          <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
            <div className={`px-4 py-1 rounded-full border text-[11px] font-black uppercase tracking-[0.25em] shadow-sm transition-all duration-300 ${
              darkMode 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}>
              {selectedReaction.label} Mode
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 opacity-30">
            <div className="h-px w-6 bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Select Reaction
            </span>
            <div className="h-px w-6 bg-slate-300 dark:bg-slate-700" />
          </div>
        )}
      </div>
    </div>
  );
}
