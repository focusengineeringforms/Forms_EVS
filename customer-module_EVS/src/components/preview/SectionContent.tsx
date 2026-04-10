import type { Section } from "../../types";
import QuestionRenderer from "../QuestionRenderer";
import { useQuestionLogic } from "../../hooks/useQuestionLogic";


interface SectionContentProps {
  section: Section;
  formTitle: string;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  readOnly?: boolean;
  language?: 'en' | 'ar' | 'both';
  rightWidget?: React.ReactNode;
}

const SECTION_TRANSLATIONS: Record<string, string> = {
  "EVS NPS FEEDBACK": "تقييم خدمة EVS",
};

export default function SectionContent({
  section,
  formTitle,
  answers,
  onAnswerChange,
  readOnly = false,
  language = 'en',
  rightWidget,
}: SectionContentProps) {
  const { getOrderedVisibleQuestions } = useQuestionLogic();
  const visibleQuestions = getOrderedVisibleQuestions(
    section.questions,
    answers
  );

  let sectionTitle = section.title;
  if (language === 'ar' || language === 'both') {
    const arTitle = SECTION_TRANSLATIONS[sectionTitle.toUpperCase()];
    if (arTitle) {
      sectionTitle = language === 'ar' ? arTitle : `${sectionTitle} / ${arTitle}`;
    }
  }

  return (
    <div className="w-full">
      {section.title !== formTitle && section.title !== "Section 1" && (
        <div className="relative mb-2 w-full flex justify-center items-start">
          <div className="text-center flex flex-col items-center w-full px-2">
            <h2
              className="text-xl md:text-2xl font-black mb-1 text-slate-900 leading-tight tracking-tight"
              style={language !== 'en' ? { fontFamily: 'Tahoma, Arial', textAlign: 'center' } : {}}
            >
              {sectionTitle}
            </h2>
            {section.description && (
              <p className="text-[10px] md:text-sm max-w-4xl text-slate-500 leading-snug">{section.description}</p>
            )}
          </div>
          {rightWidget && (
            <div className={`absolute top-0 ${language === 'ar' || language === 'both' ? 'left-0' : 'right-0'} z-50`}>
              {rightWidget}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4 md:space-y-6">
        {visibleQuestions.map((q) => (
          <div
            key={q.id}
            className={`${
              q.showWhen
                ? "mt-2 ml-4 p-2 border-l-4 border-blue-400 bg-blue-50/30 rounded-r-lg"
                : ""
            }`}
          >
            <QuestionRenderer
              question={q}
              value={answers[q.id]}
              onChange={(value) => onAnswerChange(q.id, value)}
              readOnly={readOnly}
              language={language}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
