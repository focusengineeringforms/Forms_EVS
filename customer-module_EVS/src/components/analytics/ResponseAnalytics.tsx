import React from "react";
import { X } from "lucide-react";
import type { Question, Response } from "../../types";
import ResponseMetrics from "./ResponseMetrics";
import ResponseTimeline from "./ResponseTimeline";
import ResponseQuestion from "./ResponseQuestion";

interface ResponseAnalyticsProps {
  question: Question;
  responses: Response[];
  onClose: () => void;
}

export default function ResponseAnalytics({
  question,
  responses,
  onClose,
}: ResponseAnalyticsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl m-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Response Analytics
            </h3>
            <p className="text-sm text-gray-500 mt-1">{question.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <ResponseMetrics responses={responses} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponseTimeline responses={responses} />
            <ResponseQuestion question={question} responses={responses} />
          </div>
        </div>
      </div>
    </div>
  );
}
