import React from "react";
import type { FollowUpQuestion } from "../../types";

interface ParagraphInputProps {
  question: FollowUpQuestion;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export default function ParagraphInput({
  question,
  value,
  onChange,
  readOnly = false,
}: ParagraphInputProps) {
  return (
    <div className="w-full">
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={question.required}
        readOnly={readOnly}
        className={`w-full px-5 py-4 border border-gray-200 rounded-3xl transition-all duration-500 outline-none resize-none ${
          readOnly
             ? "bg-gray-100 border-gray-300 cursor-not-allowed"
             : "bg-gray-50/50 hover:bg-white focus:bg-white border-gray-200 focus:border-[#00a651] focus:ring-4 focus:ring-[#00a651]/5 shadow-inner"
        } min-h-[100px] text-gray-800 placeholder-gray-400 font-medium text-sm tracking-tight`}
        placeholder="Please type your detailed feedback here..."
        rows={3}
      />
    </div>
  );
}
