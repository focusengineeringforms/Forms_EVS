import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  Calendar,
  FileText,
  ArrowLeft,
  TrendingUp,
  PieChart,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { Line } from "react-chartjs-2";
import { apiClient } from "../../api/client";
import type { Response as FormResponse, Question } from "../../types";
import QuestionOptionBreakdown from "./QuestionOptionBreakdown";
import { socketService } from "../../services/socketService";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Response extends FormResponse {
  timestamp: string;
}

interface AnalyticsQuestion extends Question {
  sections: Question["sections"];
  followUpQuestions: Question["followUpQuestions"];
}

interface Form {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  createdAt?: string;
  isVisible?: boolean;
}

export default function FormAnalyticsDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<Response[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionInsights, setQuestionInsights] = useState<{
    sections: any[];
    followUpQuestions: any[];
    responses: Response[];
  } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [newResponseNotification, setNewResponseNotification] = useState<
    string | null
  >(null);

  const fetchData = async (isAutoRefresh = false) => {
    if (!id) return;

    try {
      if (!isAutoRefresh) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      // Fetch form details
      const formData = await apiClient.getForm(id);
      setForm(formData.form);

      // Fetch responses for this form
      const responsesData = await apiClient.getFormResponses(id);
      setResponses(responsesData.responses || []);

      // Fetch analytics data for question-level insights
      const analyticsData = await apiClient.getFormAnalytics(id);
      if (analyticsData?.data?.questionInsights) {
        const {
          sections,
          followUpQuestions,
          responses: insightResponses,
        } = analyticsData.data.questionInsights;
        setQuestionInsights({
          sections,
          followUpQuestions,
          responses: insightResponses,
        });
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [id]);

  // WebSocket real-time updates
  useEffect(() => {
    if (!id) return;

    // Connect to WebSocket
    socketService.connect();
    setIsConnected(socketService.isConnected());

    // Join the form analytics room
    socketService.joinFormAnalytics(id);

    // Handle new response created
    const handleResponseCreated = (data: any) => {
      if (data.formId === id) {
        fetchData(true);
      }
    };

    // Handle response updated
    const handleResponseUpdated = (data: any) => {
      if (data.formId === id) {
        fetchData(true);
      }
    };

    // Handle response deleted
    const handleResponseDeleted = (data: any) => {
      if (data.formId === id) {
        fetchData(true);
      }
    };

    // Subscribe to events
    socketService.on("response-created", handleResponseCreated);
    socketService.on("response-updated", handleResponseUpdated);
    socketService.on("response-deleted", handleResponseDeleted);

    // Check connection status periodically
    const connectionCheckInterval = setInterval(() => {
      setIsConnected(socketService.isConnected());
    }, 2000);

    // Cleanup
    return () => {
      socketService.off("response-created", handleResponseCreated);
      socketService.off("response-updated", handleResponseUpdated);
      socketService.off("response-deleted", handleResponseDeleted);
      socketService.leaveFormAnalytics(id);
      clearInterval(connectionCheckInterval);
    };
  }, [id, fetchData]);

  const analytics = useMemo(() => {
    const total = responses.length;
    const pending = responses.filter(
      (r) => r.status === "pending" || !r.status
    ).length;
    const verified = responses.filter((r) => r.status === "verified").length;
    const rejected = responses.filter((r) => r.status === "rejected").length;

    const getValidDate = (value?: string) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const extractTimestamp = (response: Response) => {
      return (
        getValidDate(response.timestamp) ||
        getValidDate((response as any).createdAt) ||
        getValidDate(response.submissionMetadata?.submittedAt)
      );
    };

    const recentResponses = [...responses]
      .map((response) => ({ response, date: extractTimestamp(response) }))
      .filter((item) => item.date)
      .sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime())
      .slice(0, 5)
      .map((item) => ({
        ...item.response,
        fallbackTimestamp: item.date ? item.date.toISOString() : undefined,
      }));

    const responseTrend = responses.reduce(
      (acc: Record<string, number>, response) => {
        const validDate = extractTimestamp(response);
        if (!validDate) {
          return acc;
        }
        const dateKey = validDate.toISOString().split("T")[0];
        acc[dateKey] = (acc[dateKey] || 0) + 1;
        return acc;
      },
      {}
    );

    const trendDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    }).reverse();

    const responseTrendArray = trendDays.map((day) => ({
      date: day,
      count: responseTrend[day] || 0,
    }));

    const maxCount = Math.max(...trendDays.map((date) => responseTrend[date] || 0), 1);
    const percentageData = trendDays.map((date) => Math.round(((responseTrend[date] || 0) / maxCount) * 100));

    return {
      total,
      pending,
      verified,
      rejected,
      recentResponses,
      responseTrend,
      responseTrendArray,
      last7Days: trendDays,
      percentageData,
    };
  }, [responses]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-primary-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading analytics: {error}</p>
          <button onClick={() => navigate(-1)} className="mt-4 btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* New Response Notification */}
      {newResponseNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">{newResponseNotification}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-primary-800">
                Form Analytics
              </h1>
              <div
                className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                  isConnected ? "bg-green-50" : "bg-red-50"
                }`}
              >
                {isConnected ? (
                  <>
                    <Wifi className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">
                      Real-time Connected
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-red-600" />
                    <span className="text-xs text-red-700 font-medium">
                      Disconnected
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-primary-600">
              {form?.title || "Form"} - Response Analytics
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isRefreshing && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          )}
          <div className="text-sm text-primary-500">
            Last updated: {lastUpdated.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg mr-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">
                {analytics.total}
              </div>
              <div className="text-xs text-primary-500">Total Responses</div>
            </div>
          </div>
        </div>

        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg card">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Highest</div>
          <div className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-2">
            {Math.max(...Object.values(analytics.responseTrend), 0)}
          </div>
        </div>

        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg card">
          <div className="text-xs text-green-600 dark:text-green-400 font-semibold">Average</div>
          <div className="text-xl font-bold text-green-900 dark:text-green-200 mt-2">
            {Math.round(
              Object.values(analytics.responseTrend).reduce((a, b) => a + b, 0) /
                analytics.last7Days.length
            )}
          </div>
        </div>

        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg card">
          <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Days Active</div>
          <div className="text-xl font-bold text-purple-900 dark:text-purple-200 mt-2">
            {Object.values(analytics.responseTrend).filter((v) => v > 0).length}
          </div>
        </div>

        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg card">
          <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">Trend</div>
          <div className="text-xl font-bold text-orange-900 dark:text-orange-200 mt-2">
            <TrendingUp className="w-6 h-6 inline" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-primary-800 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Response Status Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-400 rounded mr-3"></div>
                <span className="text-sm text-primary-600">Pending</span>
              </div>
              <span className="font-medium">{analytics.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                <span className="text-sm text-primary-600">Completed</span>
              </div>
              <span className="font-medium">{analytics.verified}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-600 rounded mr-3"></div>
                <span className="text-sm text-primary-600">Closed</span>
              </div>
              <span className="font-medium">{analytics.rejected}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-primary-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {analytics.recentResponses.length === 0 ? (
              <p className="text-primary-500 text-sm">No responses yet</p>
            ) : (
              analytics.recentResponses.map((response) => (
                <div
                  key={response.id}
                  className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-b-0"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-3 ${
                        response.status === "verified"
                          ? "bg-green-500"
                          : response.status === "rejected"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    ></div>
                    <div>
                      <p className="text-sm font-medium text-primary-800">
                        Response #{response.id.slice(-6)}
                      </p>
                      <p className="text-xs text-primary-500">
                        {new Date(response.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      response.status === "verified"
                        ? "bg-green-100 text-green-800"
                        : response.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {response.status || "pending"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Response Trend Chart */}
      <div className="card p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary-900 dark:text-white">Response Trend</h3>
              <p className="text-xs text-primary-500 dark:text-primary-400">Last 7 days activity</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-800 dark:text-white">
              {Object.values(analytics.responseTrend).reduce((a, b) => a + b, 0)}
            </div>
            <p className="text-xs text-primary-500 dark:text-primary-400">Total responses</p>
          </div>
        </div>

        {Object.keys(analytics.responseTrend).length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-3">
              <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
            </div>
            <p className="text-primary-500 dark:text-primary-400 font-medium">No responses yet</p>
            <p className="text-xs text-primary-400 dark:text-primary-500 mt-1">Responses will appear here</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Line
                data={{
                  labels: analytics.last7Days.map((date) =>
                    new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  ),
                  datasets: [
                    {
                      label: "Responses %",
                      data: analytics.percentageData,
                      borderColor: "rgb(59, 130, 246)",
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                      fill: true,
                      tension: 0.4,
                      pointRadius: 5,
                      pointHoverRadius: 7,
                      pointBackgroundColor: "rgb(59, 130, 246)",
                      pointBorderColor: "#fff",
                      pointBorderWidth: 2,
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      titleColor: "#fff",
                      bodyColor: "#fff",
                      cornerRadius: 8,
                      padding: 12,
                      titleFont: { size: 12, weight: "bold" },
                      bodyFont: { size: 12 },
                      callbacks: {
                        label: function (context) {
                          return `${context.parsed.y}%`;
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      grid: {
                        color: "rgba(0, 0, 0, 0.05)",
                        drawBorder: false,
                      },
                      ticks: {
                        color: "rgb(107, 114, 128)",
                        font: { size: 11 },
                        callback: function (value) {
                          return value + "%";
                        },
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                        drawBorder: false,
                      },
                      ticks: {
                        color: "rgb(107, 114, 128)",
                        font: { size: 11 },
                      },
                    },
                  },
                }}
                height={60}
              />
            </div>
          </>
        )}
      </div>

      {questionInsights && (
        <QuestionOptionBreakdown
          question={{
            id: form?._id || "",
            title: form?.title || "",
            description: form?.description || "",
            sections: questionInsights.sections,
            followUpQuestions: questionInsights.followUpQuestions,
          }}
          responses={questionInsights.responses}
        />
      )}

      {/* Form Details */}
      {form && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-primary-800 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Form Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-primary-800 mb-2">
                Form Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-primary-600">Title:</span>
                  <span className="font-medium">{form.title}</span>
                </div>
                {form.description && (
                  <div className="flex justify-between">
                    <span className="text-primary-600">Description:</span>
                    <span className="font-medium">{form.description}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-primary-600">Status:</span>
                  <span
                    className={`font-medium ${
                      form.isVisible ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {form.isVisible ? "Public" : "Private"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-600">Created:</span>
                  <span className="font-medium">
                    {form.createdAt
                      ? new Date(form.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-primary-800 mb-2">
                Response Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-primary-600">Total Responses:</span>
                  <span className="font-medium">{analytics.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-600">Completion Rate:</span>
                  <span className="font-medium">
                    {analytics.total > 0
                      ? Math.round((analytics.verified / analytics.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-600">Average per Day:</span>
                  <span className="font-medium">
                    {analytics.total > 0
                      ? (analytics.total / 7).toFixed(1)
                      : "0"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
