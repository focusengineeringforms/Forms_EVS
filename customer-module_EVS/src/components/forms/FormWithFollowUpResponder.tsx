import React, { useState, useEffect } from "react";
import ProductNPSBuckets from "./ProductNPSBuckets";
import {
  Save,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useFormPersistence } from "../../hooks/useFormPersistence";

interface FollowUpQuestion {
  id: string;
  text: string;
  type: string;
  required: boolean;
  showWhen: {
    questionId: string;
    value: string;
  };
  parentId: string;
  description?: string;
  followUpConfig?: Record<
    string,
    {
      hasFollowUp: boolean;
      required: boolean;
      linkedFormId?: string;
    }
  >;
}

interface Question {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options?: string[];
  allowedFileTypes?: string[];
  description?: string;
  followUpConfig?: Record<
    string,
    {
      hasFollowUp: boolean;
      required: boolean;
      linkedFormId?: string;
    }
  >;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

interface Form {
  id: string;
  title: string;
  description: string;
  logoUrl?: string;
  imageUrl?: string;
  sections: Section[];
  followUpQuestions: FollowUpQuestion[];
}

interface FormResponse {
  [questionId: string]: any;
}

interface FormWithFollowUpResponderProps {
  formId: string;
  onSubmitted?: (response: any) => void;
  onError?: (error: string) => void;
}

export const FormWithFollowUpResponder: React.FC<
  FormWithFollowUpResponderProps
> = ({ formId, onSubmitted, onError }) => {
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const { clearSavedData } = useFormPersistence({
    formId,
    responses,
    onResponsesRestore: setResponses,
  });

  useEffect(() => {
    loadForm();
  }, [formId]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forms/${formId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load form");
      }

      const result = await response.json();
      setForm(result.data.form);
    } catch (error) {
      console.error("Error loading form:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load form";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Clear validation error for this field
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });

    // Clear any global errors
    setError(null);
  };

  const getVisibleFollowUpQuestions = (): FollowUpQuestion[] => {
    if (!form) return [];

    return form.followUpQuestions.filter((followUp) => {
      if (!followUp.showWhen) return false;

      const parentAnswer = responses[followUp.showWhen.questionId];
      return parentAnswer === followUp.showWhen.value;
    });
  };

  const getAllVisibleQuestions = (): (Question | FollowUpQuestion)[] => {
    if (!form) return [];

    const questions: (Question | FollowUpQuestion)[] = [];

    // Add main questions from sections
    form.sections.forEach((section) => {
      questions.push(...section.questions);
    });

    // Add visible follow-up questions
    questions.push(...getVisibleFollowUpQuestions());

    return questions;
  };

  const validateQuestion = (
    question: Question | FollowUpQuestion
  ): string | null => {
    if (!question.required) return null;

    const value = responses[question.id];

    if (value === undefined || value === null || value === "") {
      return `${question.text} is required`;
    }

    // For arrays (like multiple choice), check if empty
    if (Array.isArray(value) && value.length === 0) {
      return `${question.text} is required`;
    }

    return null;
  };

  const validateCurrentStep = (): boolean => {
    const allQuestions = getAllVisibleQuestions();
    const currentQuestions = [allQuestions[currentStep]].filter(Boolean);

    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    currentQuestions.forEach((question) => {
      const error = validateQuestion(question);
      if (error) {
        newErrors[question.id] = error;
        hasErrors = true;
      }
    });

    setValidationErrors(newErrors);
    return !hasErrors;
  };

  const validateAllResponses = (): boolean => {
    const allQuestions = getAllVisibleQuestions();
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    allQuestions.forEach((question) => {
      const error = validateQuestion(question);
      if (error) {
        newErrors[question.id] = error;
        hasErrors = true;
      }
    });

    setValidationErrors(newErrors);

    if (hasErrors) {
      setError("Please fill in all required fields");
    }

    return !hasErrors;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      const allQuestions = getAllVisibleQuestions();
      if (currentStep < allQuestions.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAllResponses()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          questionId: formId,
          answers: responses,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit form");
      }

      const result = await response.json();

      // Check for follow-up form redirection based on answers
      let followUpFormId: string | null = null;
      if (form) {
        // Collect all questions (main and follow-up)
        const allQuestions = [
          ...form.sections.flatMap((s) => s.questions),
          ...form.followUpQuestions,
        ];

        for (const question of allQuestions) {
          const answer = responses[question.id];
          if (answer && question.followUpConfig) {
            if (Array.isArray(answer)) {
              for (const val of answer) {
                if (question.followUpConfig[val]?.linkedFormId) {
                  followUpFormId = question.followUpConfig[val].linkedFormId;
                  break;
                }
              }
            } else if (question.followUpConfig[answer]?.linkedFormId) {
              followUpFormId = question.followUpConfig[answer].linkedFormId;
            }
          }
          if (followUpFormId) break;
        }
      }

      setSuccess("Form submitted successfully!");

      clearSavedData();

      if (onSubmitted) {
        onSubmitted({ ...result.data, followUpFormId });
      }

      // Reset form after successful submission
      setTimeout(() => {
        setResponses({});
        setCurrentStep(0);
        setSuccess(null);
      }, 2000);
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit form";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question | FollowUpQuestion) => {
    const value = responses[question.id];
    const hasError = validationErrors[question.id];

    return (
      <div key={question.id} className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-primary-600 mb-2">
            {question.text}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {question.description && (
            <p className="text-primary-500 mb-4">{question.description}</p>
          )}
        </div>

        {(question.type === "radio" || question.type === "yesNoNA") &&
          (() => {
            const optionList =
              (question as Question).options &&
              (question as Question).options!.length > 0
                ? (question as Question).options!
                : question.type === "yesNoNA"
                ? ["Yes", "No", "N/A"]
                : [];
            return (
              <div className="space-y-2">
                {optionList.map((option) => (
                  <label
                    key={option}
                    className="flex items-center p-3 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={value === option}
                      onChange={(e) =>
                        handleInputChange(question.id, e.target.value)
                      }
                      className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300"
                    />
                    <span className="flex-1 text-primary-600">{option}</span>
                  </label>
                ))}
              </div>
            );
          })()}

        {question.type === "checkbox" && (question as Question).options && (
          <div className="space-y-2">
            {(question as Question).options!.map((option, index) => (
              <label
                key={option}
                className="flex items-center p-3 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  value={option}
                  checked={(value || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = value || [];
                    if (e.target.checked) {
                      handleInputChange(question.id, [
                        ...currentValues,
                        option,
                      ]);
                    } else {
                      handleInputChange(
                        question.id,
                        currentValues.filter((v: string) => v !== option)
                      );
                    }
                  }}
                  className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300 rounded"
                />
                <span className="flex-1 text-primary-600">{option}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === "text" && (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="w-full p-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-primary-600"
            placeholder="Enter your answer"
          />
        )}

        {question.type === "paragraph" && (
          <textarea
            value={value || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            rows={4}
            className="w-full p-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-primary-600"
            placeholder="Enter your detailed response"
          />
        )}

        {question.type === "email" && (
          <input
            type="email"
            value={value || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="w-full p-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-primary-600"
            placeholder="Enter your email address"
          />
        )}

        {question.type === "tel" && (
          <input
            type="tel"
            value={value || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="w-full p-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-primary-600"
            placeholder="Enter your phone number"
          />
        )}

        {question.type === "date" && (
          <input
            type="date"
            value={value || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="w-full p-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-primary-600"
          />
        )}

        {(question.type === "productNPSTGWBuckets") && (
          <ProductNPSBuckets
            value={value}
            onChange={(newValue) => handleInputChange(question.id, newValue)}
          />
        )}

        {hasError && (
          <div className="flex items-center text-red-600 text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            {hasError}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-primary-600">Loading form...</span>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-2">Form not found</div>
        <p className="text-primary-600">
          The requested form could not be loaded.
        </p>
      </div>
    );
  }

  const allQuestions = getAllVisibleQuestions();
  const currentQuestion = allQuestions[currentStep];
  const isLastStep = currentStep === allQuestions.length - 1;
  const isFirstStep = currentStep === 0;
  const hasIncompleteRequiredResponses = allQuestions.some((question) => {
    if (!question.required) {
      return false;
    }
    const value = responses[question.id];
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    if (typeof value === "string") {
      return value.trim() === "";
    }
    return value === undefined || value === null;
  });
  const submitDisabled = submitting || hasIncompleteRequiredResponses;
  const submitButtonClasses = submitting
    ? "flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg cursor-not-allowed font-medium"
    : submitDisabled
    ? "flex items-center px-8 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
    : "flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium";

  return (
    <div className="relative flex max-w-6xl mx-auto gap-6">
      {/* Main Form Container */}
      <div className="flex-1 p-6 bg-white rounded-lg shadow-lg">
        {/* Form Header */}
        <div className="mb-8">
          {form.logoUrl && (
            <div className="mb-4">
              <img
                src={form.logoUrl}
                alt="Logo"
                className="h-12 object-contain"
              />
            </div>
          )}

          <h1 className="text-2xl font-bold text-primary-600 mb-2">
            {form.title}
          </h1>
          <p className="text-primary-500">{form.description}</p>

          {form.imageUrl && (
            <div className="mt-4">
              <img
                src={form.imageUrl}
                alt="Form"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {allQuestions.length > 1 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-primary-600 mb-2">
              <span>
                Step {currentStep + 1} of {allQuestions.length}
              </span>
              <span>
                {Math.round(((currentStep + 1) / allQuestions.length) * 100)}%
                Complete
              </span>
            </div>
            <div className="w-full bg-primary-100 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / allQuestions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Current Question */}
          {currentQuestion && (
            <div className="mb-8">
              {renderQuestion(currentQuestion)}

              {/* Follow-up Indicator */}
              {"showWhen" in currentQuestion && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Follow-up Question:</strong> This question appears
                    because you selected "{currentQuestion.showWhen.value}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            {!isFirstStep && (
              <button
                type="button"
                onClick={handlePrevious}
                className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </button>
            )}

            <div className="ml-auto flex items-center gap-3">
              {!isLastStep && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              )}
              <button
                type="submit"
                disabled={submitDisabled}
                className={submitButtonClasses}
              >
                {submitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Form
                    <Save className="h-4 w-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Form Summary (only show on last step) */}
          {isLastStep && allQuestions.length > 1 && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Review Your Responses
              </h3>
              <div className="space-y-4">
                {allQuestions.map((question, index) => {
                  const response = responses[question.id];
                  if (!response && !question.required) return null;

                  return (
                    <div
                      key={question.id}
                      className="border-b border-gray-200 pb-2"
                    >
                      <div className="text-sm font-medium text-gray-800">
                        {question.text}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {Array.isArray(response)
                          ? response.join(", ")
                          : response || "No response"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Sticky Section Navigation Sidebar */}
      {allQuestions.length > 1 && (
        <div className="w-20 flex-shrink-0">
          <div className="sticky top-6 bg-white rounded-lg shadow-lg p-4 border-2 border-primary-200">
            <div className="text-xs font-semibold text-primary-700 mb-3 text-center">
              Questions
            </div>
            <div className="space-y-2">
              {allQuestions.map((question, index) => {
                const isAnswered =
                  responses[question.id] !== undefined &&
                  responses[question.id] !== null &&
                  responses[question.id] !== "";
                const isCurrent = currentStep === index;

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setCurrentStep(index)}
                    className={`
                      w-full h-10 rounded-lg text-sm font-medium transition-all duration-200
                      ${
                        isCurrent
                          ? "bg-blue-600 text-white shadow-md scale-110"
                          : isAnswered
                          ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
                      }
                    `}
                    title={`Question ${index + 1}: ${question.text}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Progress indicator */}
            <div className="mt-4 pt-4 border-t border-primary-200">
              <div className="text-xs text-center text-primary-600 mb-2">
                {currentStep + 1}/{allQuestions.length}
              </div>
              <div className="w-full bg-primary-100 rounded-full h-1.5">
                <div
                  className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((currentStep + 1) / allQuestions.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormWithFollowUpResponder;
