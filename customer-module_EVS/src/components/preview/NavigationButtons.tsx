import React from "react";
import { CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface NavigationButtonsProps {
  isFirstSection: boolean;
  isLastSection: boolean;
  onPrevious: () => void;
  onNext: (e: React.FormEvent) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitDisabled: boolean;
  submitting?: boolean;
  language?: 'en' | 'ar' | 'both';
  translations: any;
}

export default function NavigationButtons({
  isFirstSection,
  isLastSection,
  onPrevious,
  onNext,
  onSubmit,
  submitDisabled,
  submitting = false,
  language = 'en',
  translations,
}: NavigationButtonsProps) {
  const { darkMode } = useTheme();

  return (
    <div className="flex flex-col items-center gap-6 w-full">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-2">
        {!isFirstSection && (
          <button
            type="button"
            onClick={onPrevious}
            className={`premium-button w-full sm:w-auto px-6 border-2 flex-1
              ${darkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200' 
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800'
              }
            `}
          >
            <ChevronLeft className={`h-4 w-4 ${language === 'ar' || language === 'both' ? 'rotate-180' : ''}`} />
            <span>{translations.previous}</span>
          </button>
        )}

        {!isLastSection ? (
          <button
            type="button"
            onClick={onNext}
            disabled={submitting}
            className="flex justify-center items-center flex-[2] w-full bg-[#00A859] hover:bg-[#00904C] text-white rounded-[1.25rem] shadow-xl group py-4 md:py-5 px-6 transition-all active:scale-[0.98]"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>{translations.next}</span>
                <CheckCircle2 className="h-5 w-5" />
              </>
            )}
          </button>
        ) : (
          <button
            type="submit"
            onClick={onSubmit}
            disabled={submitting || submitDisabled}
            className="flex justify-center items-center flex-[2] w-full bg-[#00A859] hover:bg-[#00904C] text-white rounded-[1.25rem] shadow-xl group py-5 px-6 transition-all active:scale-[0.98]"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="tracking-wider font-bold uppercase">{translations.submit}</span>
              </div>
            )}
          </button>

        )}
      </div>
    </div>
  );
}
