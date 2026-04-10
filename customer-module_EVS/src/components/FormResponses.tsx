import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Eye,
  Calendar,
  FileText,
  User,
  X,
  ArrowLeft,
  Save,
  MapPin,
  Clock,
} from "lucide-react";
import { apiClient } from "../api/client";
import { formatTimestamp } from "../utils/dateUtils";
import { isImageUrl } from "../utils/answerTemplateUtils";
import ImageLink from "./ImageLink";
import { useNotification } from "../context/NotificationContext";

interface Response {
  _id: string;
  id: string;
  questionId: string;
  answers: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  status?: string;
  parentResponseId?: string;
  childResponses?: Response[];
  submissionMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    browser?: string;
    device?: string;
    os?: string;
    location?: {
      country?: string;
      countryCode?: string;
      region?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      timezone?: string;
      isp?: string;
    };
    submittedAt?: string;
  };
}

type PreparedResponse = Response & {
  submissionDate: Date;
};

interface Question {
  id: string;
  text: string;
  type: string;
}

interface Section {
  id: string;
  title: string;
  questions: Question[];
}

interface Form {
  _id: string;
  id: string;
  title: string;
  description?: string;
  sections?: Section[];
  followUpQuestions?: Question[];
}

export default function FormResponses() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [responses, setResponses] = useState<PreparedResponse[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(
    null
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [showTableView, setShowTableView] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    statuses: [] as string[],
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [responsesData, formData] = await Promise.all([
        apiClient.getResponses(),
        apiClient.getForm(id!),
      ]);

      // Set the form
      if (!formData.form) {
        setError("Form not found");
        return;
      }
      setForm(formData.form);

      // Filter responses for this form
      const formResponses = responsesData.responses.filter(
        (response: Response) => response.questionId === id
      );

      setResponses(
        formResponses.map((response) => ({
          ...response,
          submissionDate: new Date(response.createdAt),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load responses");
    } finally {
      setLoading(false);
    }
  };

  const getQuestionText = (questionId: string): string => {
    if (!form) return questionId;

    // Search in sections
    if (form.sections) {
      for (const section of form.sections) {
        const question = section.questions?.find((q) => q.id === questionId);
        if (question) return question.text;
      }
    }

    // Search in follow-up questions
    if (form.followUpQuestions) {
      const question = form.followUpQuestions.find((q) => q.id === questionId);
      if (question) return question.text;
    }

    return questionId;
  };

  const handleStatusUpdate = async () => {
    if (!selectedResponse || !selectedStatus) return;

    try {
      setUpdating(true);
      await apiClient.updateResponse(selectedResponse.id, {
        status: selectedStatus,
      });

      // Update local state
      setResponses((prev) =>
        prev.map((r) =>
          r.id === selectedResponse.id ? { ...r, status: selectedStatus } : r
        )
      );
      setSelectedResponse({ ...selectedResponse, status: selectedStatus });

      showSuccess("Status updated successfully!");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const statusOptions = ["pending", "verified", "rejected", "confirmed"];

  const groupResponsesByDate = (responses: PreparedResponse[]) => {
    return responses.reduce((groups, response) => {
      const date = response.submissionDate.toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(response);
      return groups;
    }, {} as Record<string, PreparedResponse[]>);
  };

  const applyFilters = (responsesToFilter: PreparedResponse[]) => {
    return responsesToFilter.filter((response) => {
      const matchesSearch = filters.search
        ? Object.entries(response.answers).some(([key, value]) => {
            const questionText = getQuestionText(key).toLowerCase();
            const answerText = String(value ?? "").toLowerCase();
            const searchTerm = filters.search.toLowerCase();
            return (
              questionText.includes(searchTerm) ||
              answerText.includes(searchTerm)
            );
          })
        : true;

      const matchesStatus =
        filters.statuses.length > 0
          ? response.status
            ? filters.statuses.includes(response.status.toLowerCase())
            : filters.statuses.includes("pending") && !response.status
          : true;

      const responseDate = response.submissionDate;
      const matchesStartDate = filters.startDate
        ? responseDate >= new Date(filters.startDate)
        : true;
      const matchesEndDate = filters.endDate
        ? responseDate <= new Date(`${filters.endDate}T23:59:59`)
        : true;

      return (
        matchesSearch && matchesStatus && matchesStartDate && matchesEndDate
      );
    });
  };

  const filteredResponses = applyFilters(responses);
  const groupedResponses = groupResponsesByDate(filteredResponses);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-red-600 mb-2">Error loading responses</div>
        <div className="text-primary-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-primary-600 hover:text-primary-700 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-medium text-primary-600 mb-2">
              Customer Responses
            </h1>
            <p className="text-primary-500">Responses for: {form?.title}</p>
            {form?.description && (
              <p className="text-sm text-primary-400 mt-1">
                {form.description}
              </p>
            )}
          </div>
        </div>

        {/* Response Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {responses.length}
              </div>
              <div className="text-sm text-primary-500">Total Responses</div>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {responses.filter((r) => r.status === "verified").length}
              </div>
              <div className="text-sm text-primary-500">Completed</div>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {
                  responses.filter((r) => !r.status || r.status === "pending")
                    .length
                }
              </div>
              <div className="text-sm text-primary-500">Pending</div>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {filteredResponses.length}
              </div>
              <div className="text-sm text-primary-500">Matching Filters</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-primary-600 mb-1">
                Search
              </label>
              <input
                type="text"
                className="input"
                placeholder="Search by question or answer"
                value={filters.search}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-primary-600 mb-1">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => {
                        const normalizedStatus = status.toLowerCase();
                        const hasStatus =
                          prev.statuses.includes(normalizedStatus);
                        const updatedStatuses = hasStatus
                          ? prev.statuses.filter(
                              (item) => item !== normalizedStatus
                            )
                          : [...prev.statuses, normalizedStatus];
                        return {
                          ...prev,
                          statuses: updatedStatuses,
                        };
                      })
                    }
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      filters.statuses.includes(status.toLowerCase())
                        ? "bg-primary-600 text-white border-primary-600"
                        : "border-primary-200 text-primary-600 hover:bg-primary-50"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-primary-600 mb-1">
                From Date
              </label>
              <input
                type="date"
                className="input"
                value={filters.startDate}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-primary-600 mb-1">
                To Date
              </label>
              <input
                type="date"
                className="input"
                value={filters.endDate}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    endDate: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowTableView(true)}
          >
            View as Table
          </button>
          <button
            type="button"
            className="btn-tertiary"
            onClick={() =>
              setFilters({
                search: "",
                statuses: [],
                startDate: "",
                endDate: "",
              })
            }
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Responses by Date */}
      <div className="space-y-6">
        {Object.keys(groupedResponses)
          .sort(
            (first, second) =>
              new Date(second).getTime() - new Date(first).getTime()
          )
          .map((date) => (
            <div key={date} className="card p-6">
              {/* Date Header */}
              <div className="flex items-center mb-4 pb-2 border-b border-primary-100">
                <Calendar className="w-5 h-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-medium text-primary-600">{date}</h3>
                <span className="ml-2 text-sm text-primary-500">
                  ({groupedResponses[date].length} responses)
                </span>
              </div>

              {/* Responses List */}
              <div className="space-y-3">
                {groupedResponses[date].map((response) => {
                  const location = response.submissionMetadata?.location;
                  const locationText = location
                    ? [location.city, location.region, location.country]
                        .filter(Boolean)
                        .join(", ")
                    : "Location unavailable";

                  return (
                    <div
                      key={response._id}
                      className="flex items-center justify-between p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="p-2 bg-white rounded-lg">
                          <FileText className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-4 text-sm text-primary-500 mb-2">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{formatTimestamp(response.createdAt)}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="truncate max-w-xs">
                                {locationText}
                              </span>
                            </div>
                          </div>
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                response.status === "verified"
                                  ? "bg-green-500 text-white"
                                  : response.status === "rejected"
                                  ? "bg-red-500 text-white"
                                  : "bg-yellow-500 text-white"
                              }`}
                            >
                              {response.status === "verified"
                                ? "Completed"
                                : response.status === "rejected"
                                ? "Closed"
                                : "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedResponse(response)}
                        className="btn-secondary flex items-center ml-4"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        {responses.length === 0 && (
          <div className="text-center py-16 card">
            <div className="p-4 bg-primary-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-10 h-10 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-primary-600 mb-2">
              No Customer Responses
            </h3>
            <p className="text-primary-500 max-w-md mx-auto">
              There are currently no responses for this form. Responses will
              appear here once customers submit the form.
            </p>
          </div>
        )}
      </div>

      {/* Response Preview Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-primary-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-primary-700">
                    {form?.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-primary-500 mt-2">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>
                        Submitted on{" "}
                        {formatTimestamp(selectedResponse.createdAt)}
                      </span>
                    </div>
                    {selectedResponse.submissionMetadata?.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>
                          {[
                            selectedResponse.submissionMetadata.location.city,
                            selectedResponse.submissionMetadata.location.region,
                            selectedResponse.submissionMetadata.location
                              .country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Update Section */}
                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-sm font-medium text-primary-700">
                      Status:
                    </label>
                    <select
                      value={
                        selectedStatus || selectedResponse.status || "pending"
                      }
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-1.5 border border-primary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="verified">Completed</option>
                      <option value="rejected">Closed</option>
                    </select>
                    <button
                      onClick={handleStatusUpdate}
                      disabled={
                        updating ||
                        !selectedStatus ||
                        selectedStatus === selectedResponse.status
                      }
                      className="btn-primary flex items-center text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {updating ? "Updating..." : "Update"}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedResponse(null);
                    setSelectedStatus("");
                  }}
                  className="text-primary-500 hover:text-primary-700 ml-4"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <h4 className="text-lg font-semibold text-primary-700 mb-4">
                Response Details
              </h4>
              <div className="space-y-4">
                {Object.entries(selectedResponse.answers).map(
                  ([key, value]) => (
                    <div key={key} className="border-b border-primary-100 pb-4">
                      <div className="font-medium text-primary-700 mb-2">
                        {getQuestionText(key)}
                      </div>
                      <div className="text-primary-600 bg-primary-50 p-3 rounded-lg">
                        {Array.isArray(value) ? (
                          <div className="flex flex-wrap gap-2">
                            {value.map((item, idx) => {
                              const itemStr = String(item);
                              return isImageUrl(itemStr) ? (
                                <div key={idx}>
                                  <ImageLink text={itemStr} />
                                </div>
                              ) : (
                                <span key={idx}>{itemStr}</span>
                              );
                            })}
                          </div>
                        ) : typeof value === "object" ? (
                          value.level1 || value.level2 || value.level3 ? (
                            [
                              value.level1,
                              value.level2,
                              value.level3,
                              value.level4,
                              value.level5,
                              value.level6,
                            ]
                              .filter(Boolean)
                              .join(" > ")
                          ) : (
                            JSON.stringify(value, null, 2)
                          )
                        ) : isImageUrl(String(value)) ? (
                          <ImageLink text={String(value)} />
                        ) : (
                          String(value)
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>

              {selectedResponse.childResponses && selectedResponse.childResponses.length > 0 && (
                <div className="mt-8 pt-8 border-t-2 border-primary-200">
                  <h4 className="text-lg font-semibold text-primary-700 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-purple-600" />
                    Follow-up Form Responses ({selectedResponse.childResponses.length})
                  </h4>
                  <div className="space-y-6">
                    {selectedResponse.childResponses.map((childResponse, idx) => (
                      <div key={childResponse.id} className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                        <div className="mb-4 pb-3 border-b border-purple-200">
                          <h5 className="font-semibold text-purple-900">
                            Follow-up Form Response {idx + 1}
                          </h5>
                          <div className="text-sm text-purple-700 mt-1">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {formatTimestamp(childResponse.createdAt)}
                          </div>
                        </div>
                        <div className="space-y-3">
                          {Object.entries(childResponse.answers).map(
                            ([key, value]) => (
                              <div key={key}>
                                <div className="text-sm font-medium text-purple-800 mb-1">
                                  {getQuestionText(key)}
                                </div>
                                <div className="text-sm text-purple-700 bg-white p-2 rounded border border-purple-100">
                                  {Array.isArray(value) ? (
                                    <div className="flex flex-wrap gap-2">
                                      {value.map((item, idx) => {
                                        const itemStr = String(item);
                                        return isImageUrl(itemStr) ? (
                                          <div key={idx}>
                                            <ImageLink text={itemStr} />
                                          </div>
                                        ) : (
                                          <span key={idx}>{itemStr}</span>
                                        );
                                      })}
                                    </div>
                                  ) : typeof value === "object" ? (
                                    value.level1 || value.level2 || value.level3 ? (
                                      [
                                        value.level1,
                                        value.level2,
                                        value.level3,
                                        value.level4,
                                        value.level5,
                                        value.level6,
                                      ]
                                        .filter(Boolean)
                                        .join(" > ")
                                    ) : (
                                      JSON.stringify(value, null, 2)
                                    )
                                  ) : isImageUrl(String(value)) ? (
                                    <ImageLink text={String(value)} />
                                  ) : (
                                    String(value)
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
