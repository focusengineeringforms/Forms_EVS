import React from "react";
import { useTheme } from "../../context/ThemeContext";

interface SectionProgressProps {
  currentSection: number;
  totalSections: number;
}

export default function SectionProgress({
  currentSection,
  totalSections,
}: SectionProgressProps) {
  const { darkMode } = useTheme();
  const percentage = Math.round(((currentSection + 1) / totalSections) * 100);

  return (
    <div className={`mb-8 p-4 rounded-xl border ${darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/30'}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className={`text-[8px] font-black uppercase tracking-[0.25em] ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Current Phase
              </span>
              <span className={`text-[11px] font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {currentSection + 1 < 10 ? `0${currentSection + 1}` : currentSection + 1} of {totalSections < 10 ? `0${totalSections}` : totalSections}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-[8px] font-black uppercase tracking-[0.25em] ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Completion
              </span>
              <span className={`text-[11px] font-black ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                {percentage}%
              </span>
            </div>
          </div>
          <div className={`w-full h-1 overflow-hidden rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div 
              className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
