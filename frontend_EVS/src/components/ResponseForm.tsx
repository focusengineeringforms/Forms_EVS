import React, { useState, useEffect } from "react";
import { Send, ArrowLeft, AlertCircle } from "lucide-react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import type { Question, Response, FollowUpQuestion } from "../types";
import QuestionRenderer from "./QuestionRenderer";
import { useQuestionLogic } from "../hooks/useQuestionLogic";
import ThankYouMessage from "./ThankYouMessage";
import ParentResponseSelector from "./ParentResponseSelector";
import { apiClient } from "../api/client";
 
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
    case "slider-feedback":
      return "7";
    case "emoji-star-feedback":
      return "4";
    case "emoji-reaction-feedback":
      return "4";
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

const isValidFileInput = (value: any): boolean => {
  if (!value) return false;
  
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && parsed.url && parsed.location) {
        return !!parsed.url;
      }
    } catch {
    }
    return value.trim().length > 0;
  }
  
  return false;
};

interface ResponseFormProps {
  questions?: Question[];
  onSubmit?: (response: Response) => void;
}

export default function ResponseForm({
  questions: propQuestions,
  onSubmit,
}: ResponseFormProps) {
  const { id,tenantSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [selectedParentResponse, setSelectedParentResponse] =
    useState<Response | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getOrderedVisibleQuestions } = useQuestionLogic();
  const [showDuplicateMessage, setShowDuplicateMessage] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{ isDuplicate: boolean; email: string }>({
  isDuplicate: false,
  email: ''
});

  // Fetch form from backend
useEffect(() => {
  const fetchForm = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      // Check if there's an inviteId in the URL
      const inviteId = searchParams.get('inviteId');
      // Get tenantSlug from URL params
       // Make sure you have this
      
      let response;
      if (inviteId) {
        // Use public endpoint for invites - pass tenantSlug!
        console.log("🔑 Using public endpoint with inviteId:", inviteId);
        response = await apiClient.getPublicForm(id, tenantSlug);
        setForm(response.form || response);
      } else {
        // Use authenticated endpoint for admin users
        console.log("🔒 Using authenticated endpoint");
        response = await apiClient.getFormById(id);
        setForm(response.form);
      }
      
      setError(null);
    } catch (err: any) {
      console.error("Error fetching form:", err);
      setError(err.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  fetchForm();
}, [id, searchParams, tenantSlug]); // Add tenantSlug to dependencies // 👈 Add inviteId to dependencies

  

  useEffect(() => {
    if (selectedParentResponse) {
      setAnswers({});
    }
  }, [selectedParentResponse]);
  
 useEffect(() => {
  if (!form) return;
  const sections =
    form.sections && form.sections.length > 0
      ? form.sections
      : [{ id: "default", title: form.title, description: form.description, questions: [] }];
  
  if (currentSectionIndex >= sections.length && sections.length > 0) {
    setCurrentSectionIndex(sections.length - 1);
  }
}, [form, currentSectionIndex, answers]);


  const question = form;
  const isChildForm = question?.parentFormId !== undefined;
  const parentForm = null; // TODO: Implement parent form fetching if needed

  const parentResponseId = searchParams.get("parentResponse");
  const parentResponses: any[] = [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
              <span className="text-primary-600 font-medium">
                Loading form...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-primary-800 mb-4">
              Form Not Found
            </h2>
            <p className="text-primary-600 mb-8 max-w-md mx-auto">
              {error ||
                "The form you're looking for doesn't exist or has been removed."}
            </p>
            <button onClick={() => navigate("/forms")} className="btn-primary">
              Return to Forms
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use sections from the form
  const allFormSections =
    question.sections && question.sections.length > 0
      ? question.sections
      : [
          {
            id: "default",
            title: question.title,
            description: question.description,
            questions: [],
          },
        ];

  const getAvailableSections = () => {
    if (!allFormSections || !Array.isArray(allFormSections)) {
      return [];
    }

    const baseSections: typeof allFormSections = [];
    const linkedSections: typeof allFormSections = [];

    for (const section of allFormSections) {
      if (!section) continue;

      if (!section.linkedToOption && !section.linkedToQuestionId) {
        baseSections.push(section);
      } else {
        const allQuestions = allFormSections
          .flatMap((s) => s?.questions || [])
          .filter((q) => q && !q.showWhen);

        for (const question of allQuestions) {
          const answer = answers[question.id];
          if (answer && question.followUpConfig?.[answer]?.linkedSectionId === section.id) {
            linkedSections.push(section);
            break;
          }
        }
      }
    }

    const result: typeof allFormSections = [];
    const addedSectionIds = new Set<string>();

    for (const baseSection of baseSections) {
      result.push(baseSection);
      addedSectionIds.add(baseSection.id);

      const questionsInSection = (baseSection.questions || []).filter(
        (q) => q && !q.showWhen
      );

      for (const question of questionsInSection) {
        const answer = answers[question.id];
        if (answer && question.followUpConfig?.[answer]?.linkedSectionId) {
          const linkedSectionId = question.followUpConfig[answer].linkedSectionId;
          const linkedSection = linkedSections.find(
            (s) => s && s.id === linkedSectionId && !addedSectionIds.has(s.id)
          );
          if (linkedSection) {
            result.push(linkedSection);
            addedSectionIds.add(linkedSection.id);
          }
        }
      }
    }

    for (const linkedSection of linkedSections) {
      if (!addedSectionIds.has(linkedSection.id)) {
        result.push(linkedSection);
        addedSectionIds.add(linkedSection.id);
      }
    }

    return result;
  };

  const formSections = getAvailableSections();

  console.log("All form sections:", allFormSections);
  console.log("Available sections:", formSections);
  console.log("Current answers:", answers);

  // Debug: Log all questions in current section
  if (formSections[currentSectionIndex]) {
    console.log(
      "Current section questions:",
      formSections[currentSectionIndex].questions
    );
    console.log(
      "Questions with showWhen:",
      formSections[currentSectionIndex].questions.filter((q) => q.showWhen)
    );
  }

  if (submitted) {
    return <ThankYouMessage logoUrl={form?.logoUrl} />;
  }

  if (showDuplicateMessage) {
    return <ThankYouMessage isDuplicate={true} email={duplicateInfo.email} logoUrl={form?.logoUrl} />;
  }

  if (isChildForm && !selectedParentResponse) {
    if (parentResponses.length === 0) {
      return (
        <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-500 mb-4">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-xl font-semibold">
              Parent Form Response Required
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This is a follow-up form that requires a response to "
            {parentForm?.title}" first. Please complete the parent form before
            proceeding.
          </p>
          <button
            onClick={() => navigate(`/forms/${question.parentFormId}/respond`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Respond to Parent Form
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Select Parent Response
        </h2>

        <ParentResponseSelector
          parentForm={parentForm!}
          responses={parentResponses}
          onSelect={setSelectedParentResponse}
        />
      </div>
    );
  }

  const findLinkedFormInAnswers = (): string | null => {
    const checkQuestionRecursively = (
      q: any,
      answers: Record<string, any>
    ): string | null => {
      const answer = answers[q.id];
      
      if (answer && q.followUpConfig?.[answer]?.linkedFormId) {
        return q.followUpConfig[answer].linkedFormId;
      }

      if (
        q.followUpQuestions &&
        Array.isArray(q.followUpQuestions) &&
        answer
      ) {
        for (const followUp of q.followUpQuestions) {
          if (
            followUp.showWhen?.questionId === q.id &&
            followUp.showWhen?.value === answer
          ) {
            const result = checkQuestionRecursively(followUp, answers);
            if (result) return result;
          }
        }
      }

      return null;
    };

    for (const section of allFormSections) {
      for (const q of section.questions) {
        if (!q.showWhen) {
          const result = checkQuestionRecursively(q, answers);
          if (result) return result;
        }
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  let isValid = true;
  formSections.forEach((section) => {
    const visibleQuestions = getOrderedVisibleQuestions(
      section.questions,
      answers
    );
    const hasRequiredAnswers = visibleQuestions.every((q) => {
      if (!q.required) return true;
      
      if (q.type === "file") {
        return isValidFileInput(answers[q.id]);
      }
      
      return answers[q.id];
    });
    if (!hasRequiredAnswers) {
      isValid = false;
    }
  });

  if (!isValid) {
    alert(
      "Please fill in all required fields in all sections before submitting."
    );
    return;
  }

  const response: Response = {
    id: crypto.randomUUID(),
    questionId: question.id,
    answers,
    timestamp: new Date().toISOString(),
    parentResponseId: selectedParentResponse?.id,
    submissionMetadata: {
      source: 'internal'
    }
  };

  try {
    const submitData: any = { ...response };

    // Only attempt geolocation if enabled in form settings
    if (navigator.geolocation && form?.locationEnabled !== false) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 0
          });
        });

        submitData.location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'browser'
        };
      } catch (geoErr) {
        console.warn("Geolocation not available or denied:", geoErr);
      }
    }

    const inviteId = searchParams.get('inviteId');
    
    if (inviteId) {
      try {
        // Use public endpoint for invite submissions
        console.log("📝 Submitting via public endpoint with inviteId:", inviteId);
        await apiClient.submitPublicResponse(question.id, {
          inviteId,
          answers: submitData.answers,
          location: submitData.location
        });
        
        // ✅ Success - show thank you message
        setSubmitted(true);
        
      } catch (err: any) {
        console.error("Error submitting response:", err);
        
        // 🔴 CHECK IF IT'S A DUPLICATE SUBMISSION
        if (err.response?.message === 'ALREADY_SUBMITTED' || err.message?.includes('already been used')) {
          // Show duplicate message with email if available
          const email = err.response?.data?.email || '';
          setDuplicateInfo({
            isDuplicate: true,
            email: email
          });
          setShowDuplicateMessage(true);
        } else {
          alert("Failed to submit response. Please try again.");
        }
      }
    } else {
      // Use authenticated endpoint for admin users
      console.log("🔒 Submitting via authenticated endpoint");
      await apiClient.submitResponse(question.id, submitData);
      
      // Check if there's a follow-up form linked to any selected option
      const linkedFormId = findLinkedFormInAnswers();
      if (linkedFormId) {
        setTimeout(() => {
          navigate(`/forms/${linkedFormId}/respond?parentResponse=${response.id}`);
        }, 500);
        return;
      }

      if (onSubmit) {
        onSubmit(response);
      }
      setSubmitted(true);
    }
  } catch (err: any) {
    console.error("Error submitting response:", err);
    if (!err.response?.message?.includes('ALREADY_SUBMITTED')) {
      alert("Failed to submit response. Please try again.");
    }
  }
};

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    const currentSection = formSections[currentSectionIndex];
    if (!currentSection) return;

    const visibleQuestions = getOrderedVisibleQuestions(
      currentSection.questions,
      answers
    );
    const hasRequiredAnswers = visibleQuestions.every(
      (q) => !q.required || answers[q.id]
    );

    if (!hasRequiredAnswers) {
      alert(
        "Please fill in all required fields in this section before proceeding."
      );
      return;
    }

    if (currentSectionIndex + 1 < formSections.length) {
      setCurrentSectionIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLoadSampleAnswers = () => {
    const allQuestions: FollowUpQuestion[] = [];
    formSections.forEach((section) => {
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

 

  const currentSection = formSections[currentSectionIndex];
  const isLastSection = currentSectionIndex === formSections.length - 1;
  const isFirstSection = currentSectionIndex === 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-4 sm:py-8 md:py-12 lg:py-16 px-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 sm:mb-6 mb-4 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Forms
        </button>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-gray-800 overflow-hidden transition-all duration-300">
          {/* Form Header - Ultra Compact */}
          <div className="bg-white dark:bg-gray-900 px-6 py-10 border-b border-neutral-100 flex flex-col items-center">
            {form.logoUrl && (
              <img
                src={form.logoUrl}
                alt="Brand Logo"
                className="h-40 sm:h-56 w-auto object-contain mb-6 transition-all hover:scale-105 duration-500"
              />
            )}
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter uppercase text-center">
              {form.title}
            </h1>
          </div>

          {/* Form Content - Ultra Compact */}
          <form onSubmit={handleSubmit} className="px-4 sm:px-12 py-4 bg-white dark:bg-gray-900 flex flex-col space-y-4 overflow-hidden h-full">
            
            {/* Questions Container - Tight Spacing */}
            <div className="space-y-4 flex-grow">
              {getOrderedVisibleQuestions(
                currentSection.questions,
                answers
              ).map((q) => (
                <div
                  key={q.id}
                  className="w-full flex-shrink-0"
                >
                  <QuestionRenderer
                    question={q}
                    value={answers[q.id]}
                    onChange={(value) => handleAnswerChange(q.id, value)}
                  />
                </div>
              ))}
              
              {/* Dynamic Location Question */}
              {isLastSection && form?.locationEnabled && (
                <div className="py-2 px-4 bg-green-50/50 rounded-xl border-l-4 border-green-500 flex items-center space-x-3">
                  <Send className="w-4 h-4 text-green-600 -rotate-90" />
                  <span className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase">
                    LOCATION VERIFICATION REQUIRED *
                  </span>
                </div>
              )}
            </div>

            {/* Navigation Buttons - Tighter Interaction */}
            <div className="flex justify-center items-center pt-2">
              {!isLastSection ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto px-10 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg text-sm tracking-wide"
                >
                  NEXT SECTION
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180 inline" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full sm:w-auto px-12 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-all font-black shadow-xl shadow-green-600/30 ring-4 ring-green-600/10 active:scale-95 text-sm tracking-widest uppercase"
                >
                  <Send className="w-5 h-5 mr-3 inline" />
                  SUBMIT RESPONSE
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
