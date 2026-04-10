import React from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

interface NavigationButtonsProps {
  isFirstSection: boolean;
  isLastSection: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  isSubmitting?: boolean;
}

export default function NavigationButtons({
  isFirstSection,
  isLastSection,
  onPrevious,
  onNext,
  onSubmit,
  submitDisabled,
  isSubmitting = false,
}: NavigationButtonsProps) {
  const submitButtonClasses = submitDisabled || isSubmitting
    ? "flex items-center px-10 py-3 bg-[#00a651] opacity-50 text-white rounded-lg cursor-not-allowed font-bold text-sm tracking-wider uppercase shadow-none"
    : "flex items-center px-10 py-3 bg-[#00a651] text-white rounded-lg hover:bg-[#008d44] transition-colors font-bold text-sm tracking-wider uppercase shadow-md";

  return (
    <div className="flex flex-col items-center space-y-2 pt-1 mt-2 w-full">
      <div className="flex justify-center w-full gap-4">
        {!isFirstSection && (
          <button
            type="button"
            onClick={onPrevious}
            disabled={isSubmitting}
            className="flex items-center px-8 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            PREVIOUS
          </button>
        )}

        {!isLastSection && (
          <button
            type="button"
            onClick={onNext}
            disabled={isSubmitting}
            className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            NEXT
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        )}
      </div>

      {isLastSection && (
        <div className="flex justify-center w-full">
          <button
            type="submit"
            onClick={onSubmit}
            disabled={submitDisabled || isSubmitting}
            className={submitButtonClasses}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                SUBMITTING...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2 bg-white/20 rounded-full p-0.5" />
                SUBMIT RESPONSE
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
