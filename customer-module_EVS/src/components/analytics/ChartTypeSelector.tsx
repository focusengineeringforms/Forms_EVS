import React from "react";
import { BarChart, PieChart } from "lucide-react";

export type ChartType = "bar" | "pie";

interface ChartTypeSelectorProps {
  value: ChartType;
  onChange: (type: ChartType) => void;
  disabled?: boolean;
}

export default function ChartTypeSelector({
  value,
  onChange,
  disabled = false,
}: ChartTypeSelectorProps) {
  return (
    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onChange("bar")}
        disabled={disabled}
        className={`flex items-center px-3 py-1.5 rounded-md transition-colors ${
          value === "bar"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <BarChart className="w-4 h-4 mr-1.5" />
        Bar
      </button>
      <button
        onClick={() => onChange("pie")}
        disabled={disabled}
        className={`flex items-center px-3 py-1.5 rounded-md transition-colors ${
          value === "pie"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <PieChart className="w-4 h-4 mr-1.5" />
        Pie
      </button>
    </div>
  );
}
