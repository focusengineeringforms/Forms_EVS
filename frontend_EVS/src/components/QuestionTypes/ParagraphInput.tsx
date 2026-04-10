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
        className={`w-full px-4 py-3 border-2 rounded-2xl transition-all duration-300 outline-none resize-none ${
          readOnly
             ? "bg-gray-100 border-gray-300 cursor-not-allowed"
             : "bg-white border-neutral-600 focus:border-green-600 focus:ring-8 focus:ring-green-600/10 shadow-md"
        } min-h-[110px] text-gray-900 placeholder-gray-500 font-bold text-base`}
        placeholder="Please type your detailed feedback here..."
        rows={3}
      />
    </div>
  );
}
