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
    <div className={`space-y-4 py-2 w-full max-w-4xl mx-auto transition-all duration-500`}>
      
      {/* Circular Buttons Container */}
      <div className={`relative overflow-visible ${isLargeScale ? 'px-2 sm:px-4' : ''}`}>
        
        <div className={`flex items-center ${isLargeScale ? 'justify-between w-full' : 'justify-center gap-4 sm:gap-14'} py-4 no-scrollbar flex-nowrap overflow-x-auto overflow-y-visible`}>

          {options.map((val) => {
            const isSelected = value === val.toString();
            const isLargeScale = max > 5;
            
            // Branding colors based on the value
            const getButtonStyles = () => {
              if (isSelected) {
                if (isLargeScale) {
                  return 'bg-[#2563EB] border-[#2563EB] text-white';
                } else {
                  return 'bg-[#E11D48] border-[#E11D48] text-white';
                }
              }
              return darkMode 
                ? 'bg-[#0B0C10] border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white' 
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800';
            };

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
                  ${isLargeScale 
                    ? "w-[26px] h-[26px] min-[380px]:w-8 min-[380px]:h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 text-[10px] sm:text-base md:text-xl" 
                    : "w-10 h-10 sm:w-13 sm:h-13 md:w-16 md:h-16 text-xs sm:text-xl md:text-2xl"} 
                  ${getButtonStyles()}
                  ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} 
                  z-10
                `}
                style={{ 
                  backgroundColor: isSelected ? (isLargeScale ? '#2563EB' : '#E11D48') : undefined,
                  borderColor: isSelected ? (isLargeScale ? '#2563EB' : '#E11D48') : undefined,
                  color: isSelected ? '#FFFFFF' : undefined
                }}

              >
                {val}
              </button>
            );
          })}
        </div>
      </div>

      {/* Labels below the scale */}
      <div className="flex justify-between items-center w-full mt-4 px-4">
         <div className="flex flex-col items-start gap-1">
            <span className={`text-xs md:text-sm font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>0</span>
            <span className={`text-xs md:text-sm font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{leftLabel}</span>
         </div>
         
         <div className="h-[1px] flex-1 mx-4 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />

         <div className="flex flex-col items-end gap-1">
            <span className={`text-xs md:text-sm font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{max}</span>
            <span className={`text-xs md:text-sm font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{rightLabel}</span>
         </div>
      </div>

    </div>
  );
}

