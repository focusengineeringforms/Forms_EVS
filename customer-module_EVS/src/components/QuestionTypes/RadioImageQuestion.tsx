import React from "react";
import type { FollowUpQuestion } from "../../types";
import { useTheme } from "../../context/ThemeContext";
import { Check } from "lucide-react";

interface RadioImageQuestionProps {
  question: FollowUpQuestion;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  error?: boolean;
}

export default function RadioImageQuestion({
  question,
  value,
  onChange,
  readOnly = false,
  error = false,
}: RadioImageQuestionProps) {
  const { darkMode } = useTheme();
  if (!question.options?.length) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 max-w-2xl">
      {question.options.map((imageUrl) => {
        const isSelected = value === imageUrl;
        return (
          <label
            key={imageUrl}
            className={`group relative aspect-[4/5] rounded-2xl overflow-hidden border transition-all duration-500 ${
              readOnly ? "cursor-not-allowed" : "cursor-pointer"
            } ${
              isSelected
                ? darkMode 
                  ? "border-blue-500 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] scale-[1.02]" 
                  : "border-blue-500 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.2)] scale-[1.02]"
                : error
                  ? "border-red-500 shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)] scale-[0.98]"
                  : darkMode
                    ? "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                    : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
            }`}
          >
            <div className="absolute inset-0 z-0">
              <img 
                src={imageUrl} 
                alt="" 
                className={`w-full h-full object-cover transition-all duration-700 ${
                  isSelected ? 'scale-110 blur-[1px] opacity-40' : 'group-hover:scale-110'
                }`} 
              />
              <div className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-500 ${
                isSelected 
                  ? darkMode ? 'from-slate-900 via-slate-900/80 to-transparent' : 'from-white via-white/80 to-transparent'
                  : 'from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40'
              }`} />
            </div>
            
            <input
              type="radio"
              name={question.id}
              value={imageUrl}
              checked={isSelected}
              onChange={(e) => !readOnly && onChange(e.target.value)}
              disabled={readOnly}
              className="sr-only"
              required={question.required && !value}
            />

            <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
              isSelected 
                ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
                : "bg-black/20 backdrop-blur-md border border-white/30 text-transparent"
            }`}>
              <Check className={`w-3.5 h-3.5 transition-transform duration-500 ${isSelected ? 'scale-110' : 'scale-50'}`} strokeWidth={4} />
            </div>

            <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 transition-all duration-500 ${
              isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <div className={`px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-[0.2em] shadow-sm ${
                darkMode 
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' 
                  : 'bg-blue-50 border-blue-200 text-blue-600'
              }`}>
                Selected
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
