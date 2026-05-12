import React from 'react';
import type { FollowUpQuestion } from '../../types';
import { useTheme } from "../../context/ThemeContext";

interface ScaleQuestionProps {
  question: FollowUpQuestion;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export default function ScaleQuestion({
  question,
  value,
  onChange,
  readOnly = false,
}: ScaleQuestionProps) {
  const { darkMode } = useTheme();
  
  // Logic to determine min/max based on question content or defaults
  const min = question.min ?? (question.id?.includes('nps') || question.text?.toLowerCase().includes('recommend') ? 0 : 1);
  const max = question.max ?? (question.id?.includes('nps') || question.text?.toLowerCase().includes('recommend') ? 10 : 5);
  const step = question.step || 1;

  // Generate range of values
  const options: number[] = [];
  for (let i = min; i <= max; i += step) {
    options.push(i);
  }

  // Use custom labels if provided, otherwise defaults that match the mockup
  const leftLabel = question.subParam1 || (max === 10 ? "Not at all likely" : "Very unsatisfied");
  const rightLabel = question.subParam2 || (max === 10 ? "Extremely likely" : "Very satisfied");

  return (
    <div className="space-y-2 px-1 py-1 w-full max-w-2xl transition-all duration-300">
      
      {/* Circular Buttons Container */}
      <div className="relative group overflow-visible py-1">
        <div className={`flex flex-wrap justify-start ${max > 5 ? 'gap-1 sm:gap-2' : 'gap-1.5 sm:gap-3'} mt-0.5 overflow-visible`}>
        {options.map((val) => {
          const isSelected = value === val.toString();
          const isLargeScale = max > 5;
          return (
            <button
              key={val}
              type="button"
              onClick={() => {
                if (readOnly) return;
                const stringVal = val.toString();
                onChange(value === stringVal ? "" : stringVal);
              }}
              disabled={readOnly}
                className={`nps-circle shrink-0 relative
                ${isLargeScale ? "w-6 h-6 sm:w-8 sm:h-8 text-[9px]" : "w-7 h-7 sm:w-9 sm:h-9 text-[10px]"} 
                ${isSelected 
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-110 z-20' 
                    : darkMode 
                      ? 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800'
                }
                ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              {val}
            </button>
          );
        })}
        </div>
      </div>

      {/* Labels below the scale */}
      <div className="flex justify-between w-full max-w-lg mt-0.5 px-0.5">
         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter w-1/2 text-left">{leftLabel}</span>
         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter w-1/2 text-right">{rightLabel}</span>
      </div>

    </div>
  );
}