import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "../../api/client";
import SectionContent from "../preview/SectionContent";
import FormHeader from "../preview/FormHeader";
import NavigationButtons from "../preview/NavigationButtons";
import { BrandedError } from "./BrandedError";
import { CheckCircle2, Globe } from "lucide-react";
import { useFormPersistence } from "../../hooks/useFormPersistence";
import { useTheme } from "../../context/ThemeContext";
import { useNotification } from "../../context/NotificationContext";
import { useQuestionLogic } from "../../hooks/useQuestionLogic";
import {
  getLevel2Options,
  getLevel3Options,
  getLevel4Options,
  getLevel5Options,
  getLevel6Options,
} from "../../config/npsHierarchy";

interface Form {
  id: string;
  title: string;
  description: string;
  logoUrl?: string;
  sections: any[];
  locationEnabled?: boolean;
}

interface CustomerFormFillerProps {
  tenantSlug: string;
}

export default function CustomerFormFiller({
  tenantSlug,
}: CustomerFormFillerProps) {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inviteId = searchParams.get("inviteId");
  
  // Language Support - Reactive Detection
  const language = React.useMemo(() => {
    const lang = searchParams.get("lang")?.toLowerCase();
    if (lang === 'ar') return 'ar';
    if (lang === 'both') return 'both';
    return 'en';
  }, [searchParams]);

  const translations = {
    en: {
      loading: "Loading form...",
      submit: "SUBMIT",
      next: "Next",
      previous: "Go Back",
      thankYou: "Thank you for your response!",
      locationRequired: "LOCATION VERIFICATION REQUIRED *",
      formNotFound: "Form Not Found",
      duplicate: "Already Submitted",
      requiredFields: "Please fill in all required fields",
      sending: "Sending...",
      success: "Successfully Submitted"
    },
    ar: {
      loading: "جاري تحميل النموذج...",
      submit: "إرسال",
      next: "التالي",
      previous: "رجوع",
      thankYou: "شكراً لك على استجابتك!",
      locationRequired: "مطلوب التحقق من الموقع *",
      formNotFound: "النموذج غير موجود",
      duplicate: "تم الإرسال مسبقاً",
      requiredFields: "يرجى ملء جميع الحقول المطلوبة",
      sending: "جاري الإرسال...",
      success: "تم الإرسال بنجاح"
    }
  };

  const t = translations[language === 'both' ? 'ar' : language];

  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [locationDisplayName, setLocationDisplayName] = useState<string | null>(
    null
  );
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const { darkMode } = useTheme();
  
  const getMainSections = () => {
    if (!form) return [];
    return form.sections.filter((s) => !s.isSubsection);
  };

  // Theme preference - we want it to look "neat" and "premium"
  const mainSections = getMainSections();
  const totalSteps = mainSections.length > 0 ? mainSections.length : 1;
  const progress = ((currentSectionIndex + 1) / totalSteps) * 100;

  const { showSuccess, showConfirm, showError: showNotifyError } = useNotification();
  const { getOrderedVisibleQuestions } = useQuestionLogic();

  const isValidFileInput = (value: any): boolean => {
    if (!value) return false;

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (parsed && parsed.url && parsed.location) {
          return !!parsed.url;
        }
      } catch {}
      return value.trim().length > 0;
    }

    return false;
  };

  const isAnswerProvided = (q: any, answer: any) => {
    if (!q.required) return true;
    if (q.type === "file") {
      return isValidFileInput(answer);
    }
    if (q.type === "productNPSTGWBuckets") {
      if (!answer || typeof answer !== "object" || !answer.level1) return false;

      // Level 2
      const l2Opts = getLevel2Options(answer.level1);
      if (l2Opts.length > 0 && !answer.level2) return false;

      // Level 3
      if (answer.level2) {
        const l3Opts = getLevel3Options(answer.level1, answer.level2);
        if (l3Opts.length > 0 && !answer.level3) return false;
      }

      // Level 4
      if (answer.level3) {
        const l4Opts = getLevel4Options(answer.level1, answer.level2, answer.level3);
        if (l4Opts.length > 0 && !answer.level4) return false;
      }

      // Level 5
      if (answer.level4) {
        const l5Opts = getLevel5Options(
          answer.level1,
          answer.level2,
          answer.level3,
          answer.level4
        );
        if (l5Opts.length > 0 && !answer.level5) return false;
      }

      // Level 6
      if (answer.level5) {
        const l6Opts = getLevel6Options(
          answer.level1,
          answer.level2,
          answer.level3,
          answer.level4,
          answer.level5
        );
        if (l6Opts.length > 0 && !answer.level6) return false;
      }

      return true;
    }
    if (q.type === "checkbox") {
      return Array.isArray(answer) && answer.length > 0;
    }
    if (q.type === "radio-grid" || q.type === "checkbox-grid" || q.type === "grid") {
      if (!answer || typeof answer !== "object") return false;
      
      const rows = q.gridOptions?.rows || q.rows || [];
      if (rows.length === 0) return true;

      // Strict validation: every row must be answered
      return rows.every((row: any) => {
        const rowId = typeof row === 'string' ? row : (row.id || row);
        const rowAnswer = answer[rowId];
        if (q.type === "checkbox-grid") {
          return Array.isArray(rowAnswer) && rowAnswer.length > 0;
        }
        return rowAnswer !== undefined && rowAnswer !== null && String(rowAnswer).trim() !== "";
      });
    }
    return (
      answer !== undefined &&
      answer !== null &&
      String(answer).trim() !== ""
    );
  };

  const validateSections = (sectionsToValidate: any[]) => {
    let isValid = true;
    const newErrors = new Set<string>();

    sectionsToValidate.forEach((section) => {
      if (!section) return;

      // Include subsections in validation
      const allQuestions = [...section.questions];
      const subSections =
        form?.sections.filter(
          (s) => s.isSubsection && s.parentSectionId === section.id
        ) || [];
      subSections.forEach((ss) => {
        allQuestions.push(...ss.questions);
      });

      // Get visible questions based on answers and logic
      const visibleQuestions = getOrderedVisibleQuestions(
        allQuestions,
        responses
      );

      visibleQuestions.forEach((q) => {
        if (!q.required) return;

        if (!isAnswerProvided(q, responses[q.id])) {
          isValid = false;
          newErrors.add(q.id);
        }
      });
    });

    setValidationErrors(newErrors);

    if (!isValid) {
      showNotifyError("Please answer all required questions");
      setTimeout(() => {
        const firstError = document.querySelector('[data-error="true"]');
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }

    return isValid;
  };

  const { clearSavedData } = useFormPersistence({
    formId: formId || "",
    responses,
    onResponsesRestore: setResponses,
  });

  useEffect(() => {
    const fetchForm = async () => {
      if (!formId) return;

      try {
        const response = await apiClient.getPublicForm(formId, tenantSlug, inviteId);
        if (!response) {
          setError("Form data unavailable");
          setLoading(false);
          return;
        }
        const fetchedForm = response.form;

        if (fetchedForm && (!fetchedForm.sections || fetchedForm.sections.length === 0)) {
          fetchedForm.sections = [
            {
              id: "default",
              title: fetchedForm.title,
              description: fetchedForm.description,
              questions: fetchedForm.followUpQuestions || [],
            },
          ];
        }

        if (fetchedForm && fetchedForm.sections) {
          fetchedForm.sections = fetchedForm.sections.map((section: any) => {
            const allQuestions = [...section.questions];
            section.questions.forEach((q: any) => {
              if (q.followUpQuestions && Array.isArray(q.followUpQuestions)) {
                q.followUpQuestions.forEach((fq: any) => {
                  if (!allQuestions.find((existing) => existing.id === fq.id)) {
                    allQuestions.push(fq);
                  }
                });
              }
            });
            return { 
              ...section, 
              id: section.id || section._id,
              nextSectionId: section.nextSectionId || (section as any)._nextSectionId,
              questions: allQuestions 
            };
          });
        }

        setForm(fetchedForm);
      } catch (err: any) {
        if (err.response?.message === 'ALREADY_SUBMITTED') {
          showConfirm(
            "You have already responded to this form using this link. Are you sure you want to re-submit?",
            async () => {
              try {
                const retryResponse = await apiClient.getPublicForm(formId!, tenantSlug);
                if (retryResponse && retryResponse.form) {
                  setForm(retryResponse.form);
                }
              } catch (retryErr: any) {
                setError("Failed to load form after confirmation");
              }
            },
            "Already Responded",
            "Yes, Continue",
            "Go Home",
            () => navigate(`/${tenantSlug}`)
          );
          return;
        }
        setError("Failed to load form");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId, tenantSlug]);

  useEffect(() => {
    if (!form || form.locationEnabled === false) {
      console.log("Location collection is disabled for this form.");
      return;
    }

    const getLocationNow = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
            setLocationError(null);
          },
          (err) => {
            console.warn("Location access denied or unavailable:", err.message);
            // Only show error if location is explicitly required and enabled
            if (form.locationEnabled) {
              setLocationError("Location access required");
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, 
          }
        );
      }
    };

    getLocationNow();
  }, [form]);

  useEffect(() => {
    const reverseGeocode = async () => {
      if (!location || reverseGeocoding) return;
      setReverseGeocoding(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=10&addressdetails=1`
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.display_name) {
            setLocationDisplayName(data.display_name);
          }
        }
      } catch (error) {
        console.warn("Reverse geocoding failed");
      } finally {
        setReverseGeocoding(false);
      }
    };
    reverseGeocode();
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !formId) return;

    const mainSections = getMainSections();
    const currentMainSection = mainSections[currentSectionIndex];
    if (!validateSections([currentMainSection])) {
      return;
    }

    if (currentSectionIndex < mainSections.length - 1) {
      handleNextSection();
      return;
    }

    setSubmitting(true);
    try {
      const submissionData: any = { 
        answers: responses,
        inviteId: inviteId || null
      };

      if (location) {
        submissionData.location = {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          source: "browser",
          capturedAt: new Date().toISOString(),
        };
      }

      await apiClient.submitResponse(formId, tenantSlug, submissionData);
      clearSavedData();
      showSuccess("Form submitted successfully!");
      setSubmitted(true);
    } catch (err) {
      showNotifyError("Failed to submit form");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

// Removed duplicated getMainSections from here

  const handleNextSection = () => {
    const mainSections = getMainSections();
    if (currentSectionIndex < mainSections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'} flex flex-col items-center justify-center gap-4`}>
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
        </div>
        <p className="text-sm font-bold tracking-widest uppercase animate-pulse">{t.loading}</p>
      </div>
    );
  }

// ... inside CustomerFormFiller ...
  if (error || !form) {
    return (
      <BrandedError 
        title="Form Expired or Invalid" 
        message={error || "The link you followed may be incorrect, expired, or you have already submitted this feedback."}
        logoUrl={form?.logoUrl || (form as any)?.tenantBranding?.logo || (tenantSlug === 'evs' ? "https://evsuae.com/wp-content/uploads/2023/12/EVS-Logo.png" : undefined)}
        darkMode={darkMode}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (submitted) {
    return (
      <div dir={language === 'ar' || language === 'both' ? 'rtl' : 'ltr'} className={`h-screen w-full flex flex-col items-center justify-center p-4 text-center ${darkMode ? 'bg-[#0a0b1e] text-white' : 'bg-slate-50 text-slate-900'} font-sans overflow-hidden`}>
        <div className="w-full max-w-md animate-in zoom-in-95 duration-700">
          {(form.logoUrl || (form as any).tenantBranding?.logo) && (
            <img
              src={form.logoUrl || (form as any).tenantBranding?.logo}
              alt="Logo"
              className="h-20 md:h-28 mx-auto mb-6 object-contain"
            />
          )}
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight leading-tight" style={language !== 'en' ? { fontFamily: 'Tahoma, Arial' } : {}}>{t.thankYou}</h1>
            <p className={`text-sm font-bold opacity-60`} style={language !== 'en' ? { fontFamily: 'Tahoma, Arial' } : {}}>
              {language === 'en' ? 'Your feedback is invaluable to us.' : 'نحن نقدر رأيك كثيراً.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={language === 'ar' || language === 'both' ? 'rtl' : 'ltr'}
      style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}
      className={`w-full ${darkMode ? 'bg-[#0a0b1e] text-white' : 'bg-white text-slate-900'} font-sans overflow-hidden`}
    >
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-200" style={{ flexShrink: 0 }}>
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-indigo-500 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Logo */}
      <div style={{ flexShrink: 0 }} className="w-full flex justify-center pt-2 pb-1">
        <FormHeader logoUrl={form.logoUrl || (form as any).tenantBranding?.logo} />
      </div>

      {/* Scrollable form area */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }} className="w-full no-scrollbar">
        <form
          id="customer-form"
          onSubmit={handleSubmit}
          style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          className="w-full max-w-3xl mx-auto px-3 md:px-6"
        >
          {(() => {
            const currentMainSection = mainSections[currentSectionIndex];
            if (!currentMainSection) return null;

            const subsections = form.sections.filter(
              (s) => s.isSubsection && s.parentSectionId === currentMainSection.id
            );
            const allSectionsToDisplay = [currentMainSection, ...subsections];

            const languageDropdownWidget = (
              <div className={`flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity`}>
                <Globe className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <select
                  value={language}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('lang', newLang);
                    setSearchParams(newParams, { replace: true });
                  }}
                  className={`py-1 pl-2.5 pr-7 rounded-xl text-[10px] md:text-[11px] font-bold cursor-pointer focus:outline-none border shadow-sm transition-all ${
                    darkMode
                      ? 'bg-[#151731] text-white border-slate-700/50'
                      : 'bg-white text-slate-900 border-slate-200'
                  }`}
                  style={{ WebkitAppearance: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.3rem center', backgroundSize: '0.8em' }}
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="both">Both</option>
                </select>
              </div>
            );

            return (
              <div className="py-2">
                {allSectionsToDisplay.map((section, idx) => (
                  <SectionContent
                    key={section.id}
                    section={section}
                    formTitle={form.title}
                    answers={responses}
                    onAnswerChange={handleResponseChange}
                    language={language}
                    rightWidget={idx === 0 ? languageDropdownWidget : undefined}
                  />
                ))}
              </div>
            );
          })()}

          {/* Submit button */}
          <div style={{ paddingBottom: '10px', paddingTop: '8px' }}>
            <NavigationButtons
              isFirstSection={currentSectionIndex === 0}
              isLastSection={currentSectionIndex === totalSteps - 1}
              onPrevious={handlePrevSection}
              onNext={handleNextSection}
              onSubmit={handleSubmit}
              submitDisabled={submitting}
              submitting={submitting}
              language={language}
              translations={t}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
