import React from 'react';
import type { FollowUpQuestion } from '../../types';
import { useTheme } from "../../context/ThemeContext";

interface EmojiStarFeedbackProps {
  question: FollowUpQuestion;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  error?: boolean;
}

const STAR_EMOJIS = ['⭐', '⭐', '⭐', '⭐', '⭐'];
const STAR_LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function EmojiStarFeedback({
  value,
  onChange,
  readOnly = false,
  error = false,
}: EmojiStarFeedbackProps) {
  const { darkMode } = useTheme();
  const currentValue = parseInt(value) || 0;

  return (
    <div className="space-y-4 max-w-sm">
      <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${
        darkMode 
          ? 'bg-slate-900/40 border-slate-800/60 backdrop-blur-md shadow-[0_4px_20px_-5px_rgba(0,0,0,0.3)]' 
          : 'bg-white/60 border-slate-200/60 backdrop-blur-md shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)]'
      } ${
        error ? "border-red-500 ring-4 ring-red-500/10" : ""
      }`}>
        {Array.from({ length: 5 }).map((_, index) => {
          const isSelected = index < currentValue;
          const isCurrent = index + 1 === currentValue;
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => !readOnly && onChange((index + 1).toString())}
              disabled={readOnly}
              className={`relative group focus:outline-none transition-all duration-500 ${
                readOnly ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-500 ${
                isCurrent ? 'bg-amber-500/20 opacity-100' : 'opacity-0 group-hover:opacity-40 bg-amber-500/10'
              }`} />
              
              <span className={`relative text-2xl transition-all duration-500 block ${
                readOnly ? 'opacity-50' : 'group-hover:scale-125 group-active:scale-95'
              } ${isSelected ? 'filter-none scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'grayscale opacity-30 blur-[0.5px]'}`}>
                {STAR_EMOJIS[index]}
              </span>
              
              {isCurrent && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center">
        {currentValue > 0 ? (
          <div className="animate-in fade-in slide-in-from-top-1 duration-500">
            <div className={`px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-[0.2em] shadow-sm transition-all duration-300 ${
              darkMode 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}>
              {STAR_LABELS[currentValue - 1]}
            </div>
            <div className="text-[10px] font-black text-slate-500/60 dark:text-slate-500 uppercase tracking-widest mt-2 text-center">
              Rating: {currentValue} / 5
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 opacity-40">
            <div className="h-px w-8 bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              Tap to evaluate
            </span>
            <div className="h-px w-8 bg-slate-300 dark:bg-slate-700" />
          </div>
        )}
      </div>
    </div>
  );
}
