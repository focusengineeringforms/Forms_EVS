import React from "react";
import { X, MapPin } from "lucide-react";
import type { Question, Response } from "../types";
import { formatTimestamp } from "../utils/dateUtils";
import FilePreview from "./FilePreview";

interface ResponseDetailsProps {
  response: Response;
  question: Question;
  onClose: () => void;
}

export default function ResponseDetails({
  response,
  question,
  onClose,
}: ResponseDetailsProps) {
  const renderAnswer = (questionType: string, answer: any) => {
    if (questionType === "file" || questionType === "radio-image") {
      return <FilePreview data={answer as string} />;
    }

    if (Array.isArray(answer)) {
      return (
        <ul className="list-disc list-inside">
          {answer.map((item, index) => (
            <li key={index} className="text-gray-700">
              {item}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof answer === "object") {
      return (
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="divide-y divide-gray-200">
            {Object.entries(answer).map(([key, value]) => (
              <tr key={key}>
                <td className="py-2 pr-4 font-medium text-gray-700">{key}:</td>
                <td className="py-2 text-gray-600">{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return <p className="text-gray-700">{String(answer)}</p>;
  };

  const renderLocation = () => {
    const metadata = response.submissionMetadata;
    if (!metadata) return null;

    const location = metadata.location || metadata.capturedLocation;
    if (!location) return null;

    return (
      <div className="border-b pb-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          Location Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {location.latitude && location.longitude && (
            <div>
              <span className="font-medium text-gray-700">Coordinates:</span>
              <p className="text-gray-600">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            </div>
          )}
          {location.accuracy && (
            <div>
              <span className="font-medium text-gray-700">Accuracy:</span>
              <p className="text-gray-600">±{location.accuracy} meters</p>
            </div>
          )}
          {location.source && (
            <div>
              <span className="font-medium text-gray-700">Source:</span>
              <p className="text-gray-600 capitalize">{location.source}</p>
            </div>
          )}
          {location.capturedAt && (
            <div>
              <span className="font-medium text-gray-700">Captured:</span>
              <p className="text-gray-600">
                {formatTimestamp(location.capturedAt)}
              </p>
            </div>
          )}
          {metadata.location?.city && (
            <div>
              <span className="font-medium text-gray-700">City:</span>
              <p className="text-gray-600">{metadata.location.city}</p>
            </div>
          )}
          {metadata.location?.region && (
            <div>
              <span className="font-medium text-gray-700">Region:</span>
              <p className="text-gray-600">{metadata.location.region}</p>
            </div>
          )}
          {metadata.location?.country && (
            <div>
              <span className="font-medium text-gray-700">Country:</span>
              <p className="text-gray-600">
                {metadata.location.country} ({metadata.location.countryCode})
              </p>
            </div>
          )}
          {metadata.location?.timezone && (
            <div>
              <span className="font-medium text-gray-700">Timezone:</span>
              <p className="text-gray-600">{metadata.location.timezone}</p>
            </div>
          )}
          {metadata.ipAddress && (
            <div>
              <span className="font-medium text-gray-700">IP Address:</span>
              <p className="text-gray-600">{metadata.ipAddress}</p>
            </div>
          )}
          {metadata.browser && (
            <div>
              <span className="font-medium text-gray-700">Browser:</span>
              <p className="text-gray-600">{metadata.browser}</p>
            </div>
          )}
          {metadata.device && (
            <div>
              <span className="font-medium text-gray-700">Device:</span>
              <p className="text-gray-600">{metadata.device}</p>
            </div>
          )}
          {metadata.os && (
            <div>
              <span className="font-medium text-gray-700">OS:</span>
              <p className="text-gray-600">{metadata.os}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Get all questions from sections or fallback to followUpQuestions
  const allQuestions =
    question.sections.length > 0
      ? question.sections.flatMap((section) => section.questions)
      : question.followUpQuestions;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Response Details
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Submitted on {formatTimestamp(response.timestamp)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="space-y-6">
            {allQuestions.map((q) => {
              const answer = response.answers[q.id];
              if (!answer) return null;

              return (
                <div key={q.id} className="border-b pb-4">
                  <h4 className="font-medium text-gray-900 mb-2">{q.text}</h4>
                  <div className="text-gray-700">
                    {renderAnswer(q.type, answer)}
                  </div>
                </div>
              );
            })}
            {renderLocation()}
          </div>
        </div>
      </div>
    </div>
  );
}
