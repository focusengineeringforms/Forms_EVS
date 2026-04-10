import React, { useState, useEffect, useCallback } from "react";
import {
  Send,
  ArrowLeft,
  AlertCircle,
  MapPin,
  Loader2,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import type { Question, Response, FollowUpQuestion } from "../types";
import QuestionRenderer from "./QuestionRenderer";
import { useQuestionLogic } from "../hooks/useQuestionLogic";
import ThankYouMessage from "./ThankYouMessage";
import { useNotification } from "../context/NotificationContext";
import { responsesApi } from "../api/storage";

interface CapturedLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: "browser" | "ip" | "unknown";
  capturedAt: string;
  displayName?: string;
  city?: string;
  region?: string;
  country?: string;
}
import ParentResponseSelector from "./ParentResponseSelector";
import { apiClient } from "../api/client";
import { useFormPersistence } from "../hooks/useFormPersistence";
import {
  getLevel2Options,
  getLevel3Options,
  getLevel4Options,
  getLevel5Options,
  getLevel6Options,
} from "../config/npsHierarchy";

const REVERSE_GEOCODE_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";

const getLocationFromIP = async () => {
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (response.ok) {
      const data = await response.json();
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        region: data.region,
        country: data.country_name,
        accuracy: 50000, // Rough estimate for IP accuracy
        source: "ip",
      };
    }
  } catch (error) {
    console.warn("IP geolocation failed:", error);
  }
  return null;
};

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

interface ResponseFormProps {
  questions?: Question[];
  onSubmit?: (response: Response) => void;
}

export default function ResponseForm({
  questions: propQuestions,
  onSubmit,
}: ResponseFormProps) {
  const { id, tenantSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showConfirm, showSuccess, showError: showNotifyError } = useNotification();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [capturedLocation, setCapturedLocation] =
    useState<CapturedLocation | null>(null);
  const [locationPermissionState, setLocationPermissionState] = useState<
    "idle" | "pending" | "granted" | "denied" | "error"
  >("idle");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationConfirmation, setLocationConfirmation] = useState<{
    confirmedAt: string;
    displayName?: string;
  } | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [locationSummary, setLocationSummary] = useState<string | null>(null);
  const [submittedLocationSummary, setSubmittedLocationSummary] = useState<
    string | null
  >(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedParentResponse, setSelectedParentResponse] =
    useState<Response | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branchingRules, setBranchingRules] = useState<any[]>([]);
  const [branchingAlert, setBranchingAlert] = useState<string | null>(null);
  const [visitedSectionIndices, setVisitedSectionIndices] = useState<
    Set<number>
  >(new Set([0]));
  const [showDuplicateMessage, setShowDuplicateMessage] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{ isDuplicate: boolean; email: string }>({
    isDuplicate: false,
    email: ''
  });

  const [sectionNavigationHistory, setSectionNavigationHistory] = useState<
    number[]
  >([0]);
  const [parentSectionIndex, setParentSectionIndex] = useState<number | null>(
    null
  );
  const { getOrderedVisibleQuestions } = useQuestionLogic();
  const inviteId = searchParams.get("inviteId");

  const { clearSavedData } = useFormPersistence({
    formId: id || "",
    responses: answers,
    onResponsesRestore: setAnswers,
  });

  // Fetch form from backend
  useEffect(() => {
    const fetchForm = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // Use public API with tenant slug for customer portal
        const response = await apiClient.getPublicForm(id, tenantSlug);
        console.log("Fetched form:", response);
        setForm(response.form);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching form:", err);
        setError(err.message || "Failed to load form");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id, tenantSlug]);

  useEffect(() => {
    const fetchBranchingRules = async () => {
      if (!id || !tenantSlug) return;

      try {
        console.log(
          `Fetching branching rules for form ${id} and tenant ${tenantSlug}`
        );
        const response = await apiClient.getSectionBranchingPublic(
          id,
          tenantSlug
        );
        console.log("Full branching response:", response);
        console.log("Response type:", typeof response);
        console.log("Response keys:", Object.keys(response || {}));
        if (response && response.sectionBranching) {
          console.log(
            "Found sectionBranching property with",
            response.sectionBranching.length,
            "rules"
          );
          setBranchingRules(response.sectionBranching);
          console.log("Branching rules loaded:", response.sectionBranching);
        } else {
          console.warn("No sectionBranching property in response");
        }
      } catch (err: any) {
        console.error("Failed to fetch branching rules:", err.message, err);
      }
    };

    fetchBranchingRules();
  }, [id, tenantSlug]);

  const question = form;
  const isChildForm = question?.parentFormId !== undefined;
  const parentForm = null; // TODO: Implement parent form fetching if needed

  const parentResponseId = searchParams.get("parentResponse");
  const parentResponses: any[] = [];

  useEffect(() => {
    if (selectedParentResponse) {
      setAnswers({});
    }
  }, [selectedParentResponse]);

  const requestUserLocation = useCallback((retryCount = 0) => {
    if (!("geolocation" in navigator)) {
      setLocationPermissionState("error");
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setLocationPermissionState("pending");
    setLocationError(null);
    if (retryCount === 0) {
      setCapturedLocation(null);
      setLocationConfirmation(null);
    }

    const getLocationWithOptions = (options: PositionOptions) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = position.coords;
          const captured: CapturedLocation = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            source: "browser",
            capturedAt: new Date().toISOString(),
          };

          // Log accuracy for debugging
          console.log("Location accuracy:", coords.accuracy, "meters");

          setCapturedLocation(captured);
          setLocationPermissionState("granted");
          setLocationError(null);

          // Attempt a lightweight reverse geocode for human-readable summary
          let locationData = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            source: "browser" as const,
          };

          try {
            setIsReverseGeocoding(true);

            // If browser accuracy is poor (>10km), try IP-based location
            if (coords.accuracy > 10000) {
              console.log("Browser accuracy poor, trying IP-based location");
              const ipLocation = await getLocationFromIP();
              if (
                ipLocation &&
                ipLocation.country !== "Local/Private Network" &&
                ipLocation.country !== "Unknown"
              ) {
                locationData = ipLocation;
              }
              // If IP location is local/unknown, keep using browser coords for reverse geocoding
            }

            const params = new URLSearchParams({
              lat: locationData.latitude.toString(),
              lon: locationData.longitude.toString(),
              format: "json",
            });
            const response = await fetch(
              `${REVERSE_GEOCODE_ENDPOINT}?${params.toString()}`
            );
            let extractedCity, extractedRegion, extractedCountry;
            if (response.ok) {
              const data = await response.json();
              const { city, town, village, state, county, country } =
                data.address || {};
              extractedCity = city || town || village;
              extractedRegion = state || county;
              extractedCountry = country;
            }

            extractedCity = extractedCity || locationData.city;
            extractedRegion = extractedRegion || locationData.region;
            extractedCountry = extractedCountry || locationData.country;

            const locationParts = [
              extractedCity,
              extractedRegion,
              extractedCountry,
            ]
              .filter(Boolean)
              .map((part: string) => part.trim());
            const summary = locationParts.join(", ");

            setCapturedLocation((prev) =>
              prev
                ? {
                    ...prev,
                    displayName:
                      summary ||
                      `${locationData.latitude.toFixed(
                        4
                      )}, ${locationData.longitude.toFixed(4)}`,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                    source: locationData.source,
                    accuracy: locationData.accuracy,
                    city: extractedCity,
                    region: extractedRegion,
                    country: extractedCountry,
                  }
                : prev
            );

            setLocationSummary(
              summary ||
                `${locationData.latitude.toFixed(
                  4
                )}, ${locationData.longitude.toFixed(4)}`
            );
          } catch (reverseError) {
            console.warn("Reverse geocoding failed", reverseError);
            const coordsSummary = `${locationData.latitude.toFixed(
              4
            )}, ${locationData.longitude.toFixed(4)}`;
            setLocationSummary(coordsSummary);
            setCapturedLocation((prev) =>
              prev
                ? {
                    ...prev,
                    displayName: coordsSummary,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                    accuracy: locationData.accuracy,
                    source: locationData.source,
                    city: locationData.city,
                    region: locationData.region,
                    country: locationData.country,
                  }
                : prev
            );
          } finally {
            setIsReverseGeocoding(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Try with lower accuracy if high accuracy fails and we haven't retried yet
          if (error.code === error.TIMEOUT && retryCount === 0) {
            console.log("High accuracy timeout, trying with lower accuracy...");
            getLocationWithOptions({
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 60000,
            });
          } else {
            setLocationPermissionState(
              error.code === error.PERMISSION_DENIED ? "denied" : "error"
            );
            setLocationError(
              error.code === error.PERMISSION_DENIED
                ? "Location permission was denied. Please enable it to submit the form."
                : "Unable to retrieve your location. Please try again."
            );
          }
        },
        options
      );
    };

    // Try with high accuracy first
    getLocationWithOptions({
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 30000,
    });
  }, []);

  useEffect(() => {
    if (!form) {
      return;
    }

    if (form.locationEnabled === false) {
      return;
    }

    if (locationPermissionState === "idle") {
      requestUserLocation();
    }
  }, [form, locationPermissionState, requestUserLocation]);

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
            <button
              onClick={() => navigate(tenantSlug ? `/${tenantSlug}` : -1)}
              className="btn-primary"
            >
              Return to Forms
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use sections from the form and flatten follow-up questions
  const formSections =
    question.sections && question.sections.length > 0
      ? question.sections.map((section: any) => {
          // Flatten follow-up questions into the section's questions array
          const allQuestions = [...section.questions];

          section.questions.forEach((q: any) => {
            if (q.followUpQuestions && Array.isArray(q.followUpQuestions)) {
              allQuestions.push(...q.followUpQuestions);
            }
          });

          return {
            ...section,
            id: section.id || section._id,
            nextSectionId: section.nextSectionId || (section as any)._nextSectionId,
            questions: allQuestions,
          };
        })
      : [
          {
            id: "default",
            title: question.title,
            description: question.description,
            questions: question.followUpQuestions || [],
          },
        ];

  console.log("Form sections:", formSections);
  console.log("Section navigation mapping:", formSections.map(s => ({ id: s.id, nextSectionId: s.nextSectionId })));
  console.log("Current answers:", answers);
  console.log("Branching rules:", branchingRules);

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

  // Debug: Log section IDs and visited sections
  console.log(
    "Section IDs in form:",
    formSections.map((s, i) => ({ index: i, id: s.id, title: s.title }))
  );
  console.log(
    "Visited section indices:",
    Array.from(visitedSectionIndices).sort()
  );
  console.log(
    "Visited section titles:",
    Array.from(visitedSectionIndices)
      .sort()
      .map((i) => formSections[i]?.title)
      .filter(Boolean)
  );

  if (submitted) {
    return <ThankYouMessage logoUrl={form?.logoUrl} />;
  }

  if (showDuplicateMessage) {
    return (
      <ThankYouMessage
        isDuplicate={true}
        email={duplicateInfo.email}
        logoUrl={form?.logoUrl}
      />
    );
  }

  if (isChildForm && !selectedParentResponse) {
    if (parentResponses.length === 0) {
      return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="flex items-center space-x-2 text-amber-600 mb-4">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-xl font-semibold">
              Parent Form Response Required
            </h2>
          </div>
          <p className="text-gray-600 mb-6">
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
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-900">
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

  const renderLocationStatus = () => {
    if (locationPermissionState === "pending") {
      return (
        <div className="flex items-center text-sm text-primary-600 bg-primary-50 border border-primary-200 px-4 py-3 rounded-xl">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Fetching your current location...
        </div>
      );
    }

    if (locationPermissionState === "granted" && capturedLocation) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {locationConfirmation
                ? "Location confirmed."
                : "Location captured successfully."}
            </div>
            <div className="text-xs text-green-600">
              {capturedLocation.latitude.toFixed(5)},{" "}
              {capturedLocation.longitude.toFixed(5)}
            </div>
          </div>

          {locationSummary && (
            <div className="bg-primary-50 border border-primary-200 text-primary-700 text-sm px-4 py-3 rounded-xl">
              <p className="font-medium">Approximate area</p>
              <p>
                {locationSummary}
                {capturedLocation.accuracy && (
                  <span className="block text-xs text-primary-500 mt-1">
                    Accuracy ±{Math.round(capturedLocation.accuracy)} meters
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={requestUserLocation}
              className="flex items-center px-4 py-2 text-sm font-medium text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50"
              disabled={isReverseGeocoding}
            >
              <MapPin className="w-4 h-4 mr-2" />
              {isReverseGeocoding ? "Updating location..." : "Refresh location"}
            </button>
            {!locationConfirmation && (
              <button
                type="button"
                onClick={() => {
                  const confirmedAt = new Date().toISOString();
                  setLocationConfirmation({
                    confirmedAt,
                    displayName: locationSummary || undefined,
                  });
                  setLocationError(null);
                }}
                className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isReverseGeocoding}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm location
              </button>
            )}
            {locationConfirmation && (
              <span className="text-xs text-green-600">
                Confirmed at{" "}
                {new Date(
                  locationConfirmation.confirmedAt
                ).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (locationPermissionState === "denied") {
      return (
        <div className="flex items-start text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
          <ShieldAlert className="w-4 h-4 mr-2 mt-0.5" />
          <div>
            Location access is required to submit this form. Please enable
            location permissions in your browser settings and try again.
          </div>
        </div>
      );
    }

    if (locationPermissionState === "error") {
      return (
        <div className="flex items-start text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5" />
          <div>
            We were unable to access your location automatically. Please ensure
            your device&apos;s location services are enabled and try again.
            <button
              type="button"
              onClick={requestUserLocation}
              className="ml-3 text-amber-800 underline hover:text-amber-900"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  const isAnswerProvided = (q: FollowUpQuestion, answer: any) => {
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
      
      const rows = q.gridOptions?.rows || (q as any).rows || [];
      if (rows.length === 0) return true;

      // Strict validation: every row must be answered
      return rows.every(row => {
        const rowId = typeof row === 'string' ? row : (row as any).id;
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

  const validateSections = (indices: Set<number> | number[]) => {
    let isValid = true;
    const newErrors = new Set<string>();

    indices.forEach((sectionIndex) => {
      const section = formSections[sectionIndex];
      if (!section) return;

      const visibleQuestions = getOrderedVisibleQuestions(
        section.questions,
        answers
      );

      visibleQuestions.forEach((q) => {
        if (!q.required) return;

        if (!isAnswerProvided(q, answers[q.id])) {
          isValid = false;
          newErrors.add(q.id);
        }
      });
    });

    setValidationErrors(newErrors);

    if (!isValid) {
      setTimeout(() => {
        const firstError = document.querySelector('[data-error="true"]');
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only validate sections that were actually visited (not skipped by branching)
    if (!validateSections(visitedSectionIndices)) {
      return;
    }

    // If valid, ask for confirmation
    showConfirm(
      "Are you sure you want to submit your response? You won't be able to change it later.",
      async () => {
        await performSubmission();
      },
      "Confirm Submission",
      "Submit Now",
      "Review Form"
    );
  };

  const performSubmission = async () => {
    // Only validate location if the form has location tracking enabled
    if (form?.locationEnabled !== false) {
      if (locationPermissionState !== "granted") {
        setLocationError(
          locationPermissionState === "denied"
            ? "You must allow location access to submit this form."
            : "Fetching your location. Please wait or try again."
        );
        return;
      }

      if (!capturedLocation) {
        setLocationError(
          "Unable to determine your precise location. Please ensure GPS is enabled and try again."
        );
        return;
      }

      if (!locationConfirmation) {
        setLocationError("Please confirm your location before submitting.");
        return;
      }
    }

    const enrichedLocation = capturedLocation
      ? {
          ...capturedLocation,
          source: capturedLocation.source || ("browser" as const),
          capturedAt: capturedLocation.capturedAt || new Date().toISOString(),
          displayName:
            locationConfirmation?.displayName || locationSummary || undefined,
        }
      : undefined;

    console.log("[DEBUG] Captured location object:", capturedLocation);
    console.log("[DEBUG] Enriched location object:", enrichedLocation);

    const response: Response = {
      id: crypto.randomUUID(),
      questionId: question.id,
      answers,
      timestamp: new Date().toISOString(),
      parentResponseId: selectedParentResponse?.id,
      inviteId: inviteId || undefined,
      ...(form?.locationEnabled !== false && enrichedLocation
        ? { location: enrichedLocation }
        : {}),
    };

    console.log(
      "[DEBUG] Submitting response with location:",
      response.location
    );

    try {
      if (!tenantSlug) {
        throw new Error("Tenant slug missing in route");
      }

      setIsSubmitting(true);
      setSubmitError(null);

      // Save response to backend
      await apiClient.submitResponse(question.id, tenantSlug, response);

      // Also save to local storage for backward compatibility
      responsesApi.save(response);

      if (locationSummary) {
        setSubmittedLocationSummary(locationSummary);
      }

      // Check for follow-up forms - works exactly like follow-up sections
      // Loop through all questions and check if any answer has a linkedFormId
      console.log("[Follow-up Form Detection] Checking all questions...");

      const sections = question.sections || [];
      for (const section of sections) {
        const questionsInSection = section.questions || [];

        for (const q of questionsInSection) {
          const answer = answers[q.id];

          if (answer && q.followUpConfig?.[answer]?.linkedFormId) {
            const linkedFormId = q.followUpConfig[answer].linkedFormId;
            console.log(
              `[Follow-up Form] Found! Question: ${q.id}, Answer: ${answer}, Linked Form: ${linkedFormId}`
            );

            // Navigate to the linked form
            setTimeout(() => {
              navigate(
                `/forms/${linkedFormId}/respond?parentResponse=${response.id}&tenantSlug=${tenantSlug}`
              );
            }, 500);
            return;
          }
        }
      }

      console.log("[Follow-up Form] No linked forms found");

      clearSavedData();

      if (onSubmit) {
        onSubmit(response);
      }
      setSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting response:", err);
      
      // ✅ Handle duplicate submission
      const errorMsg = err.response?.message || err.message || '';
      if (errorMsg === 'ALREADY_SUBMITTED' || errorMsg.includes('already been used')) {
        const email = err.response?.data?.email || '';
        setDuplicateInfo({
          isDuplicate: true,
          email: email
        });
        setShowDuplicateMessage(true);
      } else {
        setSubmitError(
          err.message || "Failed to submit response. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }

  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    
    // Clear error for this question if it exists
    if (validationErrors.has(questionId)) {
      setValidationErrors((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  };

  const handleLoadSampleAnswers = () => {
    const allQuestions: FollowUpQuestion[] = [];
    formSections.forEach((section: any) => {
      (section.questions || []).forEach((item: FollowUpQuestion) => {
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

  // Get sections that are linked in branching rules (section isolation)
  const getLinkedSectionIds = (): Set<string> => {
    const linkedIds = new Set<string>();
    branchingRules.forEach((rule) => {
      linkedIds.add(rule.targetSectionId);
    });
    // Also consider sections linked via section-level direct link
    formSections.forEach(section => {
      if (section.nextSectionId && section.nextSectionId !== 'end') {
        linkedIds.add(section.nextSectionId);
      }
    });
    return linkedIds;
  };

  // Get next sequential section (skipping linked sections)
  const getNextSequentialSectionIndex = (currentIndex: number): number => {
    const linkedSectionIds = getLinkedSectionIds();
    let nextIndex = currentIndex + 1;

    while (nextIndex < formSections.length) {
      if (!linkedSectionIds.has(formSections[nextIndex].id)) {
        return nextIndex;
      }
      nextIndex++;
    }

    return -1;
  };

  const checkForBranching = (
    sectionId: string,
    questionId: string,
    answerValue: any
  ) => {
    console.log(
      `[checkForBranching] Checking branching for section ${sectionId}, question ${questionId}, answer: ${JSON.stringify(
        answerValue
      )} (type: ${typeof answerValue})`
    );
    console.log(
      `[checkForBranching] Total rules available: ${branchingRules.length}`
    );

    if (!answerValue && answerValue !== 0) {
      console.log(`[checkForBranching] No answer provided, skipping`);
      return null;
    }

    const matchingRules = branchingRules.filter(
      (rule) => rule.sectionId === sectionId && rule.questionId === questionId
    );
    console.log(
      `[checkForBranching] Matching rules for this question: ${matchingRules.length}`
    );
    matchingRules.forEach((r, i) => {
      console.log(
        `  Rule ${i}: targetSection=${r.targetSectionId}, optionLabel="${r.optionLabel}", isOther=${r.isOtherOption}`
      );
    });

    for (const rule of matchingRules) {
      const optionLabelLower = rule.optionLabel?.toLowerCase();
      const answerValueLower =
        typeof answerValue === "string" ? answerValue.toLowerCase() : null;

      console.log(
        `[checkForBranching]   Evaluating rule: "${rule.optionLabel}" (isOther=${rule.isOtherOption})`
      );
      console.log(`[checkForBranching]     Answer value: "${answerValue}"`);
      console.log(
        `[checkForBranching]     Case insensitive: "${optionLabelLower}" vs "${answerValueLower}"`
      );

      if (
        rule.isOtherOption &&
        answerValue &&
        typeof answerValue === "string"
      ) {
        console.log(`[checkForBranching]     Checking "Other" option...`);
        const exactMatchExists = branchingRules.some(
          (r) =>
            r.sectionId === sectionId &&
            r.questionId === questionId &&
            !r.isOtherOption &&
            (answerValue === r.optionLabel ||
              answerValueLower === r.optionLabel?.toLowerCase())
        );
        console.log(
          `[checkForBranching]     Exact match exists: ${exactMatchExists}`
        );
        if (!exactMatchExists) {
          console.log(
            `[checkForBranching]   ✓ Matched "Other" rule, returning target section: ${rule.targetSectionId}`
          );
          return rule;
        }
      } else if (
        answerValue === rule.optionLabel ||
        answerValueLower === optionLabelLower
      ) {
        console.log(
          `[checkForBranching]   ✓ Matched exact rule, returning target section: ${rule.targetSectionId}`
        );
        return rule;
      } else {
        console.log(`[checkForBranching]     No match for this rule`);
      }
    }
    console.log(`[checkForBranching] No matching rule found`);
    return null;
  };

  const handleNext = () => {
    console.log(`[handleNext] Current section index: ${currentSectionIndex}`);
    const currentSection = formSections[currentSectionIndex];
    console.log(`[handleNext] Current section:`, currentSection);

    if (!currentSection) {
      console.error("[handleNext] Current section not found!");
      return;
    }

    const visibleQuestions = getOrderedVisibleQuestions(
      currentSection.questions,
      answers
    );
    console.log(`[handleNext] Visible questions: ${visibleQuestions.length}`);
    
    if (!validateSections([currentSectionIndex])) {
      console.log(`[handleNext] Validation failed for section ${currentSectionIndex}`);
      // Log failing questions
      const failingQuestions = getOrderedVisibleQuestions(currentSection.questions, answers)
        .filter(q => q.required && !isAnswerProvided(q, answers[q.id]));
      console.log(`[handleNext] Failing questions:`, failingQuestions.map(q => q.id));
      return;
    }

    console.log(
      `[handleNext] Checking section-level navigation FIRST. currentSection.nextSectionId:`, 
      currentSection.nextSectionId
    );

    if (currentSection.nextSectionId) {
      if (currentSection.nextSectionId === "end") {
        console.log(`[handleNext] Section navigation set to 'end', submitting`);
        handleSubmit(new Event("submit") as any);
        return;
      }

      console.log(`[handleNext] Target section ID to find: "${currentSection.nextSectionId}"`);
      console.log(`[handleNext] Available section IDs:`, formSections.map(s => s.id));

      const targetSectionIndex = formSections.findIndex(
        (s) => s.id === currentSection.nextSectionId
      );

      if (targetSectionIndex !== -1) {
        console.log(
          `[handleNext] Section-level navigation found! Target section index: ${targetSectionIndex}`
        );
        setCurrentSectionIndex(targetSectionIndex);
        setVisitedSectionIndices((prev) => new Set(prev).add(targetSectionIndex));
        setSectionNavigationHistory((prev) => [...prev, targetSectionIndex]);
        setParentSectionIndex(currentSectionIndex);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      } else {
        console.error(
          `[handleNext] Target section ID ${currentSection.nextSectionId} not found`
        );
      }
    }

    console.log(
      `[handleNext] All required fields filled, checking ${visibleQuestions.length} questions for branching rules`
    );
    for (const question of visibleQuestions) {
      const answerValue = answers[question.id];
      console.log(
        `[handleNext] Checking question: ${question.id} (${
          question.text
        }), answer: ${JSON.stringify(answerValue)}`
      );
      const branchingRule = checkForBranching(
        currentSection.id,
        question.id,
        answerValue
      );
      if (branchingRule) {
        console.log(
          `[handleNext] Branching rule found! Target section ID: ${branchingRule.targetSectionId}`
        );
        
        if (branchingRule.targetSectionId === 'end') {
          console.log(`[handleNext] Branching set to 'end', submitting`);
          handleSubmit(new Event("submit") as any);
          return;
        }

        const targetSectionIndex = formSections.findIndex(
          (s) => s.id === branchingRule.targetSectionId
        );
        console.log(
          `[handleNext] Target section index: ${targetSectionIndex}, Section IDs: ${formSections
            .map((s) => s.id)
            .join(", ")}`
        );
        if (targetSectionIndex !== -1) {
          const targetSectionTitle =
            formSections[targetSectionIndex]?.title || "Next Section";
          console.log(
            `[handleNext] Setting branching alert: Navigating to ${targetSectionTitle}`
          );
          setBranchingAlert(`Navigating to: ${targetSectionTitle}`);
          setTimeout(() => {
            setCurrentSectionIndex(targetSectionIndex);
            setVisitedSectionIndices((prev) =>
              new Set(prev).add(targetSectionIndex)
            );
            setSectionNavigationHistory((prev) => [
              ...prev,
              targetSectionIndex,
            ]);
            setParentSectionIndex(currentSectionIndex);
            setBranchingAlert(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }, 500);
          return;
        } else {
          console.error(
            `[handleNext] Target section ID ${branchingRule.targetSectionId} not found in form sections`
          );
        }
      }
    }

    console.log(
      `[handleNext] No branching/direct link matched, moving to next sequential section`
    );

    const nextIndex = getNextSequentialSectionIndex(currentSectionIndex);

    if (nextIndex !== -1) {
      console.log(
        `[handleNext] Moving to next available section (skipping linked sections): index ${nextIndex}`
      );
      setCurrentSectionIndex(nextIndex);
      setVisitedSectionIndices((prev) => new Set(prev).add(nextIndex));
      setSectionNavigationHistory((prev) => [...prev, nextIndex]);
      setParentSectionIndex(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      console.log(`[handleNext] Already at last section, triggering submission`);
      handleSubmit(new Event('submit') as any);
    }
  };

  const handlePrevious = () => {
    console.log(
      `[handlePrevious] Current navigation history:`,
      sectionNavigationHistory
    );
    console.log(`[handlePrevious] Current section index:`, currentSectionIndex);
    console.log(`[handlePrevious] Parent section index:`, parentSectionIndex);

    // If we came from a branched section, go back to the parent
    if (parentSectionIndex !== null) {
      console.log(
        `[handlePrevious] Going back to parent section (branching origin):`,
        parentSectionIndex
      );
      setCurrentSectionIndex(parentSectionIndex);
      setParentSectionIndex(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Navigate back in history stack
    if (sectionNavigationHistory.length > 1) {
      // Remove current section from history
      const newHistory = [...sectionNavigationHistory];
      newHistory.pop();

      // Get the previous section from history
      const previousSectionIndex = newHistory[newHistory.length - 1];
      console.log(
        `[handlePrevious] Going back to section index:`,
        previousSectionIndex
      );

      setSectionNavigationHistory(newHistory);
      setCurrentSectionIndex(previousSectionIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      console.log(`[handlePrevious] Already at first section in history`);
    }
  };

  const currentSection = formSections[currentSectionIndex];
  const isLastSection = (() => {
    const currentSection = formSections[currentSectionIndex];
    if (!currentSection) return true;

    // 1. Explicitly marked as end
    if (currentSection.nextSectionId === 'end') return true;

    // 2. Check if any currently active branching rule for this section points to 'end'
    const visibleQuestions = getOrderedVisibleQuestions(currentSection.questions, answers);
    for (const q of visibleQuestions) {
      const answer = answers[q.id];
      if (answer) {
        const rule = branchingRules.find(r => 
          r.sectionId === currentSection.id && 
          r.questionId === q.id && 
          (r.optionLabel === answer || (r.isOtherOption && !q.options?.includes(answer)))
        );
        if (rule?.targetSectionId === 'end') return true;
      }
    }

    // 3. Sequential check (if no branching/navigation override)
    const nextSequentialIndex = getNextSequentialSectionIndex(currentSectionIndex);
    const hasNextSequential = nextSequentialIndex !== -1;
    const hasBranchingToSection = currentSection.questions.some(q => 
      branchingRules.some(rule => rule.sectionId === currentSection.id && rule.questionId === q.id)
    );
    const hasDirectLink = !!currentSection.nextSectionId && currentSection.nextSectionId !== 'end' && formSections.some(s => s.id === currentSection.nextSectionId);
    
    return !hasNextSequential && !hasBranchingToSection && !hasDirectLink;
  })();

  const isFirstSection = sectionNavigationHistory.length <= 1;

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
          {/* Main Branding Header - Final Professional Push */}
          <div className="bg-white dark:bg-gray-900 px-6 py-10 border-b border-neutral-100 flex flex-col items-center">
            {form?.logoUrl && (
              <img
                src={form.logoUrl}
                alt="Brand Logo"
                className="h-40 sm:h-56 w-auto object-contain mb-6 transition-all hover:scale-105 duration-500"
              />
            )}
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter uppercase text-center">
              {form?.title || "FEEDBACK FORM"}
            </h1>
          </div>

          {/* Form Content - Ultra Compact */}
          <form onSubmit={handleSubmit} className="px-4 sm:px-12 py-6 bg-white dark:bg-gray-900 flex flex-col space-y-6 overflow-hidden h-full">
            
            {/* Questions Container */}
            <div className="space-y-6 flex-grow">
              {getOrderedVisibleQuestions(
                currentSection?.questions || [],
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
                <div className="py-2 px-4 bg-green-50/50 rounded-xl border-l-4 border-green-500 flex items-center space-x-3 mt-4">
                  <Send className="w-4 h-4 text-green-600 -rotate-90" />
                  <span className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase">
                    LOCATION VERIFICATION REQUIRED *
                  </span>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center items-center pt-4">
              {!isLastSection ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto px-10 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg text-sm tracking-wide uppercase"
                >
                  NEXT SECTION
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full sm:w-auto px-12 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-black shadow-xl shadow-green-600/30 ring-4 ring-green-600/10 active:scale-95 text-sm tracking-widest uppercase disabled:cursor-not-allowed"
                  disabled={
                    (form?.locationEnabled && !locationConfirmation) ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? "SUBMITTING..." : "SUBMIT RESPONSE"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
