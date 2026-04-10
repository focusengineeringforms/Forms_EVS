import React from "react";
import type { FollowUpQuestion } from "../types";
import { questionTypes } from "../utils/questionTypes";
import DateTimeInput from "./QuestionTypes/DateTimeInput";
import FileInput from "./QuestionTypes/FileInput";
import GridQuestion from "./QuestionTypes/GridQuestion";
import RadioImageQuestion from "./QuestionTypes/RadioImageQuestion";
import RatingQuestion from "./QuestionTypes/RatingQuestion";
import ScaleQuestion from "./QuestionTypes/ScaleQuestion";
import SearchSelect from "./QuestionTypes/SearchSelect";
import ParagraphInput from "./QuestionTypes/ParagraphInput";
import SliderFeedback from "./QuestionTypes/SliderFeedback";
import EmojiStarFeedback from "./QuestionTypes/EmojiStarFeedback";
import EmojiReactionFeedback from "./QuestionTypes/EmojiReactionFeedback";
import ProductNPSBuckets from "./forms/ProductNPSBuckets";
import { useTheme } from "../context/ThemeContext";
import { AlertTriangle } from "lucide-react";
import type { QuestionType } from "../types";

const TRANSLATIONS: Record<string, string> = {
  "OVERALL, HOW LIKELY ARE YOU TO RECOMMEND EVS TO YOUR FRIENDS OR COLLEAGUES?": "بشكل عام، ما مدى احتمالية أن توصي بشركة EVS لأصدقائك أو زملائك؟",
  "SPECIFICALLY, HOW SATISFIED ARE YOU WITH YOUR RECENT SERVICE EXPERIENCE?": "تحديدًا، ما مدى رضاك عن تجربة الخدمة الأخيرة؟",
  "PLEASE LET US KNOW WHY YOU GAVE US THESE RATINGS.": "يرجى إعلامنا بالسبب الذي جعلك تعطينا هذه التقييمات."
};

interface QuestionRendererProps {
  question: FollowUpQuestion;
  value: any;
  onChange?: (value: any) => void;
  readOnly?: boolean;
  error?: string;
  language?: 'en' | 'ar' | 'both';
}

export default function QuestionRenderer({
  question,
  value,
  onChange = () => {},
  readOnly = false,
  error,
  language = 'en'
}: QuestionRendererProps) {
  const { darkMode } = useTheme();

  const renderInput = () => {
    switch (question.type) {
      case "paragraph":
        return (
          <ParagraphInput
            question={question}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            error={!!error}
            language={language}
          />
        );

      case "search-select":
        return (
          <SearchSelect
            options={
              question.options?.map((opt) => ({ value: opt, label: opt })) || []
            }
            value={value || ""}
            onChange={onChange}
            placeholder="Select an option..."
            required={question.required}
            readOnly={readOnly}
            error={!!error}
          />
        );

      case "select" as any:
        return (
          <select
            value={value || ""}
            onChange={(e) => !readOnly && onChange(e.target.value)}
            required={question.required}
            disabled={readOnly}
            className={`w-full px-3 py-1.5 border border-slate-200 rounded-xl text-[11px] font-medium bg-white text-slate-900 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 ${readOnly ? "opacity-50 cursor-not-allowed" : ""} ${
              error ? "border-red-500 ring-4 ring-red-500/10" : ""
            }`}
          >
            <option value="">Select an option</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "yesNoNA" as any:
      case "radio":
      case "checkbox": {
        const options =
          question.options && question.options.length > 0
            ? question.options
            : (question.type as string) === "yesNoNA"
            ? ["Yes", "No", "N/A"]
            : [];
        const inputType = question.type === "checkbox" ? "checkbox" : "radio";
        return (
          <div className="grid gap-2">
            {options.map((option) => (
              <label
                key={option}
                className={`flex items-center space-x-3 cursor-pointer p-2 rounded-lg border transition-all duration-200 ${
              (question.type === "checkbox" ? Array.isArray(value) && value.includes(option) : value === option)
                ? 'border-blue-500/50 bg-blue-500/5'
                : error 
                  ? 'border-red-500 bg-red-50/50'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="relative flex items-center">
                  <input
                    type={inputType}
                    name={question.id}
                    value={option}
                    checked={
                      question.type === "checkbox"
                        ? Array.isArray(value) && value.includes(option)
                        : value === option
                    }
                    onChange={(e) => {
                      if (readOnly) return;
                      if (question.type === "checkbox") {
                        const newValue = Array.isArray(value) ? [...value] : [];
                        if (e.target.checked) {
                          newValue.push(option);
                        } else {
                          const index = newValue.indexOf(option);
                          if (index > -1) {
                            newValue.splice(index, 1);
                          }
                        }
                        onChange(newValue);
                      } else {
                        onChange(option);
                      }
                    }}
                    required={question.required && !value}
                    disabled={readOnly}
                    className={`h-3.5 w-3.5 text-blue-600 focus:ring-blue-500/20 border-slate-300 bg-white ${
                      readOnly ? "cursor-not-allowed" : ""
                    } ${question.type === 'radio' ? 'rounded-full' : 'rounded'}`}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-700 transition-colors group-hover:text-blue-600">{option}</span>
              </label>
            ))}
          </div>
        );
      }

      case "radio-grid":
      case "checkbox-grid":
        return (
          <GridQuestion
            question={question}
            value={value || {}}
            onChange={onChange}
            type={question.type === "radio-grid" ? "radio" : "checkbox"}
            readOnly={readOnly}
            error={!!error}
          />
        );

      case "radio-image":
        return (
          <RadioImageQuestion
            question={question}
            value={value}
            onChange={onChange}
            error={!!error}
          />
        );

      case "rating":
        return (
          <RatingQuestion
            question={question}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            error={!!error}
          />
        );

      case "slider-feedback":
        return (
          <SliderFeedback
            question={question}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            error={!!error}
          />
        );

      case "emoji-star-feedback":
        return (
          <EmojiStarFeedback
            question={question}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            error={!!error}
          />
        );

      case "emoji-reaction-feedback":
        return (
          <EmojiReactionFeedback
            question={question}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            error={!!error}
          />
        );

      case "productNPSTGWBuckets":
        return (
          <ProductNPSBuckets
            value={value}
            onChange={onChange}
            disabled={readOnly}
            error={!!error}
          />
        );

      case "scale":
        return (
          <ScaleQuestion
            question={question}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            error={!!error}
            language={language}
          />
        );

      case "file":
        return (
          <FileInput
            question={question}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            isValidationError={!!error}
          />
        );

      case "date":
      case "time":
        return (
          <DateTimeInput
            question={question}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            error={!!error}
          />
        );

      default:
        return (
          <input
            type={question.type}
            value={value || ""}
            onChange={(e) => !readOnly && onChange && onChange(e.target.value)}
            required={question.required}
            disabled={readOnly}
            className={`w-full px-4 py-3 md:py-4 border border-slate-200 rounded-xl text-xs md:text-sm font-medium bg-white text-slate-900 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400 ${readOnly ? "opacity-50 cursor-not-allowed" : ""} ${
              error ? "border-red-500 ring-4 ring-red-500/10" : ""
            }`}
            placeholder={`Enter response...`}
          />
        );
    }
  };

  let questionText = question.text?.trim() || "";
  const showLabel = questionText.length > 0;

  if (showLabel) {
    const cleanText = questionText.toUpperCase();
    const arText = TRANSLATIONS[cleanText] || TRANSLATIONS[questionText];
    
    if (arText) {
      if (language === 'ar') {
        questionText = arText;
      } else if (language === 'both') {
        questionText = `${questionText} / ${arText}`;
      }
    }
  }

  return (
    <div className="space-y-1 md:space-y-1.5" data-error={!!error}>
      {question.imageUrl ? (
        <div className="relative inline-flex mb-1">
          <img
            src={question.imageUrl}
            alt={questionText || "Question image"}
            className="max-h-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 object-contain shadow-sm"
          />
          {question.required && !showLabel ? (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-lg border border-white dark:border-slate-950">*</span>
          ) : null}
        </div>
      ) : null}
      
      {showLabel ? (
        <label
          className={`block font-extrabold text-sm md:text-base tracking-wide leading-snug uppercase ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}
          style={(() => {
            if (language === 'ar' || language === 'both') return { fontFamily: 'Tahoma, Arial, sans-serif', textAlign: 'right' as const };
            return { textAlign: 'left' as const };
          })()}
        >
          {questionText}
          {question.required && <span className="text-rose-500 ml-1 italic">*</span>}
        </label>
      ) : null}
      
      {question.description ? (
        <p className={`text-[9px] md:text-xs font-medium leading-relaxed max-w-2xl ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {question.description}
        </p>
      ) : null}


      {question.type !== "scale" && (question.subParam1 || question.subParam2) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {question.subParam1 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
              {question.subParam1}
            </span>
          )}
          {question.subParam2 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {question.subParam2}
            </span>
          )}
        </div>
      )}
      
      <div className="mt-2 transition-all duration-300">
        {renderInput()}
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-3 h-3 text-rose-500" />
          <p className="text-[10px] sm:text-xs font-bold text-rose-500 italic">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

