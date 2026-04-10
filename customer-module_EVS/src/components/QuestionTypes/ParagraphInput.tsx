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
        className={`premium-input relative z-10 min-h-[60px] md:min-h-[80px] resize-none text-sm font-medium leading-relaxed
          ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : ""}
          ${readOnly ? "opacity-50 cursor-not-allowed" : ""}
        `}
        placeholder={placeholder}
        rows={2}
      />
      
      {/* Character count or similar could go here if needed, but keeping it "neat" */}
    </div>
  );
}
