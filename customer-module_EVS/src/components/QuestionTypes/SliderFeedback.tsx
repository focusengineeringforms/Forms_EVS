import React from 'react';
import type { FollowUpQuestion } from '../../types';
import { useTheme } from "../../context/ThemeContext";

interface SliderFeedbackProps {
  question: FollowUpQuestion;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  error?: boolean;
}

const EMOJI_LEVELS = [
  { emoji: '😞', label: 'Very Bad', range: [1] },
  { emoji: '😕', label: 'Bad', range: [2, 3] },
  { emoji: '😐', label: 'Okay', range: [4, 5, 6, 7] },
  { emoji: '😊', label: 'Good', range: [8, 9] },
  { emoji: '❤️', label: 'Excellent', range: [10] },
];

export default function SliderFeedback({
  value,
  onChange,
  readOnly = false,
  error = false,
}: SliderFeedbackProps) {
  const { darkMode } = useTheme();
  const currentValue = parseInt(value) || 5;

  const getColor = (val: number) => {
    if (val <= 3) return 'from-rose-500/80 to-pink-500/80';
    if (val <= 5) return 'from-orange-500/80 to-amber-500/80';
    if (val <= 7) return 'from-amber-500/80 to-emerald-500/80';
    return 'from-emerald-500/80 to-cyan-500/80';
  };

  const getEmoji = (val: number) => {
    const level = EMOJI_LEVELS.find(l => l.range.includes(val));
    return level?.emoji || '😐';
  };

  const getLabel = (val: number) => {
    const level = EMOJI_LEVELS.find(l => l.range.includes(val));
    return level?.label || 'Okay';
  };

  return (
    <div className="space-y-5 px-1 max-w-md">
      <div className={`p-4 rounded-2xl border transition-all duration-500 ${
        darkMode 
          ? 'bg-slate-900/40 border-slate-800/60 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.3)]' 
          : 'bg-white/60 border-slate-200/60 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]'
      } ${
        error ? "border-red-500 ring-4 ring-red-500/10" : ""
      }`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl shadow-sm transition-all duration-500 ${
              darkMode ? 'bg-slate-800/80' : 'bg-slate-50'
            }`}>
              {getEmoji(currentValue)}
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>{currentValue}</span>
                <span className="text-[10px] font-black text-slate-500/60 dark:text-slate-500 uppercase tracking-widest">/ 10</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-sm transition-all duration-300 ${
                darkMode 
                  ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' 
                  : 'bg-blue-50 border border-blue-100 text-blue-600'
              }`}>
                {getLabel(currentValue)}
              </div>
            </div>
          </div>
        </div>

        <div className="relative pt-2">
          <div className="flex justify-between mb-2">
            {[1, 5, 10].map(val => (
              <span key={val} className="text-[9px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-widest">{val}</span>
            ))}
          </div>
          <div className="relative h-6 flex items-center group">
            <div className={`absolute inset-0 h-1.5 rounded-full ${darkMode ? 'bg-slate-800/50' : 'bg-slate-200/50'}`} />
            <div
              className={`absolute top-1/2 -translate-y-1/2 left-0 h-1.5 rounded-full bg-gradient-to-r ${getColor(currentValue)} transition-all duration-500 z-10`}
              style={{ width: `${((currentValue - 1) / 9) * 100}%` }}
            />
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={currentValue}
              onChange={(e) => !readOnly && onChange(e.target.value)}
              disabled={readOnly}
              className={`relative w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-500 bg-transparent transition-all duration-300 z-20 ${
                readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:scale-y-125'
              }`}
            />
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-5 gap-1 p-1 rounded-xl border border-dashed transition-all duration-500 ${
        darkMode ? 'bg-slate-950/20 border-slate-800/40' : 'bg-slate-50/50 border-slate-200/60'
      }`}>
        {EMOJI_LEVELS.map((level) => {
          const isActive = level.range.includes(currentValue);
          return (
            <div key={level.emoji} className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-500 ${
              isActive 
                ? darkMode ? 'bg-slate-800/50 scale-105' : 'bg-white shadow-sm scale-105'
                : 'opacity-20 grayscale'
            }`}>
              <div className="text-sm mb-1">{level.emoji}</div>
              <div className={`text-[8px] font-black uppercase tracking-widest text-center ${
                isActive ? (darkMode ? 'text-blue-400' : 'text-blue-600') : 'text-slate-500/50'
              }`}>
                {level.label.split(' ')[0]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
