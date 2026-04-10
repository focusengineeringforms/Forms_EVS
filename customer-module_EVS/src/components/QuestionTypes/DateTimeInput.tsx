import React from "react";
import type { FollowUpQuestion } from "../../types";
import { useTheme } from "../../context/ThemeContext";

interface DateTimeInputProps {
  question: FollowUpQuestion;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  error?: boolean;
}

export default function DateTimeInput({
  question,
  value,
  onChange,
  readOnly = false,
  error = false,
}: DateTimeInputProps) {
  const { darkMode } = useTheme();
  const type = question.type === "date" ? "date" : "time";

  return (
    <input
      type={type}
      value={value || ""}
      onChange={(e) => !readOnly && onChange(e.target.value)}
      disabled={readOnly}
      required={question.required}
      className={`w-full px-3 py-1.5 border rounded-lg text-[11px] font-medium transition-all duration-200 ${
        darkMode 
          ? 'bg-slate-900/50 border-slate-800 text-slate-200 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 [color-scheme:dark] placeholder-slate-700' 
          : 'bg-white/50 border-slate-200 text-slate-900 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400'
      } ${readOnly ? "opacity-50 cursor-not-allowed" : ""} ${
        error ? "border-red-500 ring-4 ring-red-500/10" : ""
      }`}
    />
  );
}
