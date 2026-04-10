import React from 'react';
import { Star } from 'lucide-react';
import type { FollowUpQuestion } from '../../types';
import { useTheme } from "../../context/ThemeContext";

interface RatingQuestionProps {
  question: FollowUpQuestion;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  error?: boolean;
}

export default function RatingQuestion({
  question,
  value,
  onChange,
  readOnly = false,
  error = false,
}: RatingQuestionProps) {
  const { darkMode } = useTheme();
  const max = question.max || 5;
  const currentValue = parseInt(value) || 0;

  return (
    <div className="space-y-3">
      <div className={`inline-flex items-center gap-1 p-2 rounded-2xl border transition-all duration-300 ${
        darkMode 
          ? 'bg-slate-900/40 border-slate-800/60 backdrop-blur-md shadow-[0_4px_20px_-5px_rgba(0,0,0,0.3)]' 
          : 'bg-white/60 border-slate-200/60 backdrop-blur-md shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)]'
      } ${
        error ? "border-red-500 ring-4 ring-red-500/10" : ""
      }`}>
        {Array.from({ length: max }).map((_, index) => {
          const isSelected = index < currentValue;
          const isLastSelected = index + 1 === currentValue;

          return (
            <button
              key={index}
              type="button"
              onClick={() => !readOnly && onChange((index + 1).toString())}
              disabled={readOnly}
              className={`relative group focus:outline-none transition-all duration-500 p-1 ${
                readOnly ? 'cursor-not-allowed' : 'cursor-pointer active:scale-90'
              }`}
            >
              <Star
                className={`w-5 h-5 transition-all duration-500 ${
                  isSelected
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)] scale-110'
                    : darkMode 
                      ? 'text-slate-700 fill-slate-800/50 group-hover:text-slate-500' 
                      : 'text-slate-200 fill-slate-50 group-hover:text-slate-300'
                } ${isLastSelected ? 'animate-in zoom-in-110 duration-300' : ''}`}
              />
              {isLastSelected && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
      
      {currentValue > 0 && (
        <div className="animate-in fade-in slide-in-from-left-2 duration-500">
          <span className={`text-[11px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border transition-all duration-300 ${
            darkMode 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
              : 'bg-amber-50 border-amber-200 text-amber-600'
          }`}>
            Score: {currentValue} / {max}
          </span>
        </div>
      )}
    </div>
  );
}
