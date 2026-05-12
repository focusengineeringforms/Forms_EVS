import { FollowUpQuestion } from "../../types";


interface ParagraphInputProps {
  question: FollowUpQuestion;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  error?: boolean;
  language?: 'en' | 'ar' | 'both';
}

export default function ParagraphInput({
  question,
  value,
  onChange,
  readOnly = false,
  error = false,
  language = 'en',
}: ParagraphInputProps) {

  // Determine placeholder based on language prop
  let placeholder = "Share your thoughts with us...";
  if (language === 'ar') {
    placeholder = "شاركنا أفكارك...";
  } else if (language === 'both') {
    placeholder = "شاركنا أفكارك... / Share your thoughts with us...";
  }
  
  return (
    <div className="relative group">
      {/* Decorative background glow on focus */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
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
        placeholder={placeholder}
        rows={3}
      />
      
      {/* Character count or similar could go here if needed, but keeping it "neat" */}
    </div>
  );
}
