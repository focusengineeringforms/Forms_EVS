import { FollowUpQuestion } from '../../types';
import { useTheme } from "../../context/ThemeContext";

interface ScaleQuestionProps {
  question: FollowUpQuestion;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  error?: boolean;
  language?: 'en' | 'ar' | 'both';
}

export default function ScaleQuestion({
  question,
  value,
  onChange,
  readOnly = false,
  language = 'en',
}: ScaleQuestionProps) {
  const { darkMode } = useTheme();
  const min = question.min ?? (question.id.includes('nps') ? 0 : 1);
  const max = question.max ?? (question.id.includes('nps') ? 10 : 5);
  const step = question.step || 1;

  // Generate range of values
  const options: number[] = [];
  for (let i = min; i <= max; i += step) {
    options.push(i);
  }

  // Use custom labels if provided, otherwise defaults that match the mockup
  let leftLabel = question.subParam1 || (max === 10 ? "Not at all likely" : "Very unsatisfied");
  let rightLabel = question.subParam2 || (max === 10 ? "Extremely likely" : "Very satisfied");
  
  const arLeft = max === 10 ? "غير محتمل على الإطلاق" : "غير راضٍ جداً";
  const arRight = max === 10 ? "محتمل جداً" : "راضٍ جداً";

  // Translate if it's the default OR matches the default English strings
  if (language === 'ar' || language === 'both') {
    if (!question.subParam1 || question.subParam1 === "Not at all likely" || question.subParam1 === "Very unsatisfied") {
      leftLabel = language === 'ar' ? arLeft : `${leftLabel} / ${arLeft}`;
    }
    if (!question.subParam2 || question.subParam2 === "Extremely likely" || question.subParam2 === "Very satisfied") {
      rightLabel = language === 'ar' ? arRight : `${rightLabel} / ${arRight}`;
    }
  }

  const isLargeScale = max > 5;

  return (
    <div className="space-y-2 px-1 py-1 w-full max-w-2xl transition-all duration-300 mx-auto">
      <div className="relative group overflow-visible py-1">
        <div className={`flex flex-wrap justify-center ${max > 5 ? 'gap-1 sm:gap-2' : 'gap-1.5 sm:gap-3'} mt-0.5 overflow-visible`}>
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
              className={`relative rounded-full flex items-center justify-center font-black transition-all duration-300
                ${isLargeScale 
                  ? "w-7 h-7 sm:w-10 sm:h-10 text-[10px] sm:text-base" 
                  : "w-9 h-9 sm:w-12 sm:h-12 text-sm sm:text-lg"} 
                ${isSelected 
                  ? "bg-[#00a651] border-[#00a651] text-white shadow-lg shadow-[#00a651]/20 scale-110 z-20" 
                  : "bg-white border-slate-200 text-slate-500 hover:border-[#00a651] hover:text-[#00a651] z-10"} 
                border-2 ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-90'}
              `}
            >
              {val}
            </button>
          );
        })}
        </div>
      </div>

      <div className="flex justify-between items-center w-full px-2">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-gray-300 uppercase leading-none mb-0.5">{min}</span>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">{leftLabel}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-gray-300 uppercase leading-none mb-0.5">{max}</span>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">{rightLabel}</span>
        </div>
      </div>
    </div>

    </div>
  );
}

