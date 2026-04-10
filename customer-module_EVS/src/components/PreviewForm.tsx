import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Question, Response, Section, FollowUpQuestion } from "../types";
import { useQuestionLogic } from "../hooks/useQuestionLogic";
import ThankYouMessage from "./ThankYouMessage";
import FormHeader from "./preview/FormHeader";
import SectionProgress from "./preview/SectionProgress";
import SectionContent from "./preview/SectionContent";
import NavigationButtons from "./preview/NavigationButtons";
import { useTheme } from "../context/ThemeContext";
import { Beaker } from "lucide-react";

const SAMPLE_IMAGE_DATA =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

const getSampleText = (question: FollowUpQuestion) => {
  const cleaned = question.text?.replace(/[*:]/g, "").trim();
  return cleaned ? `Sample ${cleaned}` : "Sample answer";
};

const createSampleAnswer = (question: FollowUpQuestion): any => {
  const sampleText = getSampleText(question);

  switch (question.type) {
    case "text":
    case "paragraph":
      return sampleText;
    case "email":
      return "sample@example.com";
    case "url":
      return "https://example.com";
    case "tel":
      return "+1234567890";
    case "yesNoNA":
    case "radio":
      return question.options?.[0] ?? sampleText;
    case "checkbox":
      if (question.options?.length) {
        const values = question.options.slice(
          0,
          Math.min(2, question.options.length)
        );
        return values.length ? values : [sampleText];
      }
      return [sampleText];
    case "search-select":
      return question.options?.[0] ?? sampleText;
    case "date":
      return new Date().toISOString().split("T")[0];
    case "time":
      return "12:00";
    case "file":
      if (question.allowedFileTypes?.includes("image")) {
        return SAMPLE_IMAGE_DATA;
      }
      return "Sample file uploaded";
    case "range": {
      const min = question.min ?? 0;
      const max = question.max ?? min + 10;
      const step = question.step && question.step > 0 ? question.step : 1;
      const steps = Math.floor((max - min) / step);
      const value = min + step * Math.floor(steps / 2);
      return Math.min(max, value).toString();
    }
    case "rating": {
      const min = question.min ?? 1;
      const max = question.max ?? Math.max(min, 5);
      const value = Math.max(min, Math.min(max, min === max ? min : min + 1));
      return value.toString();
    }
    case "scale": {
      const min = question.min ?? 0;
      const max = question.max ?? 10;
      const step = question.step && question.step > 0 ? question.step : 1;
      const steps = Math.floor((max - min) / step);
      const value = min + step * Math.floor(steps / 2);
      return Math.min(max, value).toString();
    }
    case "radio-grid": {
      const value: Record<string, string> = {};
      const rows = question.gridOptions?.rows ?? [];
      const column = question.gridOptions?.columns?.[0] ?? "";
      rows.forEach((row) => {
        value[row] = column;
      });
      return value;
    }
    case "checkbox-grid": {
      const value: Record<string, string[]> = {};
      const rows = question.gridOptions?.rows ?? [];
      const column = question.gridOptions?.columns?.[0];
      rows.forEach((row) => {
        value[row] = column ? [column] : [];
      });
      return value;
    }
    case "radio-image":
      return question.options?.[0] ?? "";
    default:
      return sampleText;
  }
};

const normalizeTriggerValue = (
  question: FollowUpQuestion | undefined,
  value: any
) => {
  if (value === undefined || value === null) {
    return value;
  }
  if (!question) {
    return value;
  }
  if (question.type === "checkbox") {
    return Array.isArray(value) ? value : [value];
  }
  return value;
};

interface PreviewFormProps {
  questions: Question[];
  onSubmit: (response: Response) => void;
}

export default function PreviewForm({ questions, onSubmit }: PreviewFormProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const { getOrderedVisibleQuestions } = useQuestionLogic();

  const question = questions.find((q) => q.id === id);

  if (!question) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-50'} flex items-center justify-center p-4 transition-colors duration-300`}>
        <div className={`max-w-sm w-full ${darkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100'} border rounded-xl p-5 text-center`}>
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${darkMode ? 'bg-red-500/20 text-red-500' : 'bg-red-100 text-red-600'} mb-3`}>
            <Beaker className="h-5 w-5" />
          </div>
          <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-900'} mb-1.5`}>Preview Error</h3>
          <p className={`text-xs ${darkMode ? 'text-red-400/80' : 'text-red-500'} mb-5`}>The form you're looking for doesn't exist or may have been removed.</p>
          <button 
            onClick={() => navigate("/forms")}
            className="px-5 py-2 bg-red-500 text-white text-sm rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Return to Forms
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return <ThankYouMessage />;
  }

  // Initialize sections if they don't exist
  const sections: Section[] =
    question.sections?.length > 0
      ? question.sections
      : [
          {
            id: "default",
            title: question.title,
            description: question.description,
            questions: question.followUpQuestions,
          },
        ];

  const isAnswerProvided = (value: any) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === "string") {
      return value.trim() !== "";
    }
    return value !== undefined && value !== null;
  };

  const hasMissingRequiredAnswers = () => {
    return sections.some((section) => {
      const visibleQuestions = getOrderedVisibleQuestions(
        section.questions,
        answers
      );
      return visibleQuestions.some(
        (q) => q.required && !isAnswerProvided(answers[q.id])
      );
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (hasMissingRequiredAnswers()) {
      alert("Please fill in all required fields before submitting.");
      return;
    }

    const response: Response = {
      id: crypto.randomUUID(),
      questionId: question.id,
      answers,
      timestamp: new Date().toISOString(),
    };
    onSubmit(response);
    setSubmitted(true);
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    const currentSection = sections[currentSectionIndex];

    if (currentSection.nextSectionId) {
      if (currentSection.nextSectionId === "end") {
        handleSubmit(new Event("submit") as any);
        return;
      }

      const targetSectionIndex = sections.findIndex(
        (s) => s.id === currentSection.nextSectionId
      );

      if (targetSectionIndex !== -1) {
        setCurrentSectionIndex(targetSectionIndex);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    // Move to next section without validation
    if (currentSectionIndex + 1 < sections.length) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      // For preview, we just go back sequentially for simplicity, 
      // or we could implement history if needed.
      setCurrentSectionIndex(currentSectionIndex - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLoadSampleAnswers = () => {
    const allQuestions: FollowUpQuestion[] = [];
    sections.forEach((section) => {
      (section.questions || []).forEach((item) => {
        allQuestions.push(item);
      });
    });

    const questionMap = new Map<string, FollowUpQuestion>();
    allQuestions.forEach((item) => {
      questionMap.set(item.id, item);
    });

    const sampleAnswers: Record<string, any> = {};
    allQuestions.forEach((item) => {
      sampleAnswers[item.id] = createSampleAnswer(item);
    });

    allQuestions.forEach((item) => {
      const condition = item.showWhen;
      if (!condition?.questionId) {
        return;
      }
      if (condition.value === undefined || condition.value === null) {
        return;
      }
      const parentQuestion = questionMap.get(condition.questionId);
      const normalizedValue = normalizeTriggerValue(
        parentQuestion,
        condition.value
      );
      if (normalizedValue !== undefined) {
        sampleAnswers[condition.questionId] = normalizedValue;
      }
    });

    setAnswers(sampleAnswers);
  };

  const currentSection = sections[currentSectionIndex];
  const isLastSection = (() => {
    if (!currentSection) return true;
    if (currentSection.nextSectionId === 'end') return true;
    if (currentSection.nextSectionId && sections.some(s => s.id === currentSection.nextSectionId)) return false;
    return currentSectionIndex === sections.length - 1;
  })();
  const isFirstSection = currentSectionIndex === 0;
  const submitDisabled = hasMissingRequiredAnswers();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-700'} selection:bg-blue-500/30 text-[11px] transition-colors duration-300`}>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-[400px] h-[400px] ${darkMode ? 'bg-blue-600/5' : 'bg-blue-600/10'} rounded-full blur-[100px] -translate-y-1/2`} />
        <div className={`absolute bottom-0 right-1/4 w-[400px] h-[400px] ${darkMode ? 'bg-indigo-600/5' : 'bg-indigo-600/10'} rounded-full blur-[100px] translate-y-1/2`} />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 py-12">
        <div className={`mb-10 rounded-2xl border ${darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white shadow-sm shadow-slate-200/50'} overflow-hidden backdrop-blur-sm p-6`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                <Beaker className="h-3.5 w-3.5" />
              </div>
              <span className={`text-[10px] font-black tracking-widest uppercase ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                PREVIEW MODE
              </span>
            </div>
            <button
              type="button"
              onClick={handleLoadSampleAnswers}
              className={`inline-flex items-center px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                darkMode 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20' 
                  : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'
              }`}
            >
              Load Sample Answers
            </button>
          </div>

          <FormHeader
            title={question.title}
            description={question.description}
            imageUrl={question.imageUrl}
          />

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            {sections.length > 1 && (
              <SectionProgress
                currentSection={currentSectionIndex}
                totalSections={sections.length}
              />
            )}

            <SectionContent
              section={currentSection}
              formTitle={question.title}
              answers={answers}
              onAnswerChange={handleAnswerChange}
            />

            <NavigationButtons
              isFirstSection={isFirstSection}
              isLastSection={isLastSection}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSubmit={handleSubmit}
              submitDisabled={submitDisabled}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
