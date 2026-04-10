import React, { useMemo, useState } from "react";
import ChartTypeSelector, { ChartType } from "./ChartTypeSelector";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import type { Question, Response } from "../../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface QuestionOptionBreakdownProps {
  question: Question;
  responses: Response[];
}

type QuestionWithOptions = Question["followUpQuestions"][number];

type OptionBreakdown = {
  option: string;
  count: number;
  percentage: number;
};

type AnalyticsQuestion = QuestionWithOptions & {
  sectionTitle?: string;
};

function normalizeResponseValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (value === undefined || value === null || value === "") {
    return [];
  }
  // Some questions can be stored as objects (e.g. select with label/value)
  if (typeof value === "object") {
    try {
      const normalized = JSON.stringify(value);
      return normalized ? [normalized] : [];
    } catch (error) {
      console.warn("Unable to normalize response value", value, error);
      return [];
    }
  }
  return [String(value)];
}

function isMultiOptionQuestion(question: QuestionWithOptions): boolean {
  return ["radio", "checkbox", "dropdown", "multi-select", "select"].includes(
    question.type
  );
}

function extractSelectableQuestions(question: Question): AnalyticsQuestion[] {
  const selectableQuestions: AnalyticsQuestion[] = [];

  if (question.sections?.length) {
    question.sections.forEach((section) => {
      section.questions.forEach((followUpQuestion) => {
        if (
          followUpQuestion.options &&
          isMultiOptionQuestion(followUpQuestion)
        ) {
          selectableQuestions.push({
            ...followUpQuestion,
            sectionTitle: section.title,
          });
        }
      });
    });
  }

  if (question.followUpQuestions?.length) {
    question.followUpQuestions.forEach((followUpQuestion) => {
      if (followUpQuestion.options && isMultiOptionQuestion(followUpQuestion)) {
        selectableQuestions.push(followUpQuestion);
      }
    });
  }

  return selectableQuestions;
}

function buildOptionBreakdown(
  analyticsQuestion: AnalyticsQuestion,
  responses: Response[]
): OptionBreakdown[] {
  const optionCounts = new Map<string, number>();
  const answerKey = analyticsQuestion.id;

  analyticsQuestion.options?.forEach((option) => {
    optionCounts.set(option, 0);
  });

  responses.forEach((response) => {
    const rawValue = response.answers?.[answerKey];
    const normalizedValues = normalizeResponseValue(rawValue);

    normalizedValues.forEach((value) => {
      if (!optionCounts.has(value) && normalizedValues.length > 1) {
        // Allow dynamically added options for checkbox/multi-select questions
        optionCounts.set(value, 0);
      }

      if (optionCounts.has(value)) {
        optionCounts.set(value, (optionCounts.get(value) || 0) + 1);
      }
    });
  });

  const totalCount = Array.from(optionCounts.values()).reduce(
    (sum, value) => sum + value,
    0
  );

  if (totalCount === 0) {
    return [];
  }

  return Array.from(optionCounts.entries()).map(([option, count]) => ({
    option,
    count,
    percentage: Math.round((count / totalCount) * 1000) / 10,
  }));
}

const chartColors = [
  "rgba(59, 130, 246, 0.8)",
  "rgba(16, 185, 129, 0.8)",
  "rgba(239, 68, 68, 0.8)",
  "rgba(217, 119, 6, 0.8)",
  "rgba(147, 51, 234, 0.8)",
  "rgba(14, 116, 144, 0.8)",
  "rgba(190, 24, 93, 0.8)",
  "rgba(22, 163, 74, 0.8)",
];

interface ChartConfig {
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
  }[];
  labels: string[];
}

function buildChartData(optionBreakdown: OptionBreakdown[]): ChartConfig {
  const colors = optionBreakdown.map(
    (_, index) => chartColors[index % chartColors.length]
  );

  return {
    labels: optionBreakdown.map((optionSummary) => optionSummary.option),
    datasets: [
      {
        data: optionBreakdown.map((optionSummary) => optionSummary.count),
        backgroundColor: colors,
        borderColor: colors.map((color) => color.replace("0.8", "1")),
      },
    ],
  };
}

export default function QuestionOptionBreakdown({
  question,
  responses,
}: QuestionOptionBreakdownProps) {
  const [chartPreferences, setChartPreferences] = useState<
    Record<string, ChartType>
  >({});

  const selectableQuestions = useMemo(
    () => extractSelectableQuestions(question),
    [question]
  );

  const questionBreakdowns = useMemo(() => {
    return selectableQuestions.map((selectable) => ({
      question: selectable,
      breakdown: buildOptionBreakdown(selectable, responses),
    }));
  }, [selectableQuestions, responses]);

  const handleChartTypeChange = (questionId: string, type: ChartType) => {
    setChartPreferences((prev) => ({
      ...prev,
      [questionId]: type,
    }));
  };

  if (!questionBreakdowns.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Question Insights
        </h4>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No multiple-choice questions available for analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Question Insights
      </h4>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        Review question-wise response distribution and switch between bar and
        pie charts.
      </p>
      <div className="space-y-8">
        {questionBreakdowns.map(
          ({ question: analyticsQuestion, breakdown }) => {
            const chartType = chartPreferences[analyticsQuestion.id] || "bar";
            const chartData = buildChartData(breakdown);
            const totalSelections = breakdown.reduce(
              (sum, option) => sum + option.count,
              0
            );

            return (
              <div
                key={analyticsQuestion.id}
                className="border-b border-gray-200 dark:border-gray-700 pb-8 last:border-0"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                  <div>
                    {analyticsQuestion.sectionTitle && (
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                        {analyticsQuestion.sectionTitle}
                      </p>
                    )}
                    <h5 className="text-lg font-medium text-gray-900 dark:text-white">
                      {analyticsQuestion.text}
                    </h5>
                    {analyticsQuestion.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {analyticsQuestion.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {totalSelections} selection
                      {totalSelections === 1 ? "" : "s"}
                    </p>
                    {breakdown.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        No responses recorded yet.
                      </p>
                    )}
                  </div>
                  <ChartTypeSelector
                    value={chartType}
                    onChange={(type) =>
                      handleChartTypeChange(analyticsQuestion.id, type)
                    }
                    disabled={breakdown.length === 0}
                  />
                </div>

                {breakdown.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="h-[320px] bg-gray-50 dark:bg-gray-900/40 rounded-lg p-4">
                      {chartType === "pie" ? (
                        <Pie
                          data={chartData}
                          options={{
                            plugins: {
                              legend: {
                                position: "bottom" as const,
                              },
                              tooltip: {
                                callbacks: {
                                  label: function (context: any) {
                                    const option = breakdown[context.dataIndex];
                                    return `${option.option}: ${option.count} (${option.percentage}%)`;
                                  },
                                },
                              },
                            },
                          }}
                        />
                      ) : (
                        <Bar
                          data={chartData}
                          options={{
                            indexAxis: "y" as const,
                            responsive: true,
                            plugins: {
                              legend: {
                                display: false,
                              },
                              tooltip: {
                                callbacks: {
                                  label: function (context: any) {
                                    const option = breakdown[context.dataIndex];
                                    return `${option.count} responses (${option.percentage}%)`;
                                  },
                                },
                              },
                            },
                            scales: {
                              x: {
                                beginAtZero: true,
                                ticks: {
                                  color: "rgb(156, 163, 175)",
                                },
                                grid: {
                                  color: "rgba(156, 163, 175, 0.2)",
                                },
                              },
                              y: {
                                ticks: {
                                  color: "rgb(156, 163, 175)",
                                },
                                grid: {
                                  display: false,
                                },
                              },
                            },
                          }}
                        />
                      )}
                    </div>
                    <div className="space-y-4">
                      {breakdown.map((option) => (
                        <div
                          key={option.option}
                          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {option.option}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {option.count} ({option.percentage}% )
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${option.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
                    No responses recorded yet for this question.
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
