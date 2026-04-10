import React, { useEffect } from "react";
import type { FollowUpQuestion } from "../../types";
import { useTheme } from "../../context/ThemeContext";

interface GridQuestionProps {
  question: FollowUpQuestion;
  value: Record<string, string | string[]>;
  onChange: (value: Record<string, string | string[]>) => void;
  type: "radio" | "checkbox";
  readOnly?: boolean;
  error?: boolean;
}

export default function GridQuestion({
  question,
  value,
  onChange,
  type,
  readOnly = false,
  error = false,
}: GridQuestionProps) {
  const { darkMode } = useTheme();
  
  if (!question.gridOptions) return null;
  const { rows, columns } = question.gridOptions;

  // Initialize empty values for each row
  useEffect(() => {
    const initializedValue = { ...value };
    let hasChanged = false;
    rows.forEach((row) => {
      if (!initializedValue[row]) {
        initializedValue[row] = type === "radio" ? "" : [];
        hasChanged = true;
      }
    });
    if (hasChanged) {
      onChange(initializedValue);
    }
  }, [rows, type, value, onChange]);

  const handleChange = (row: string, col: string, checked: boolean) => {
    if (readOnly) return;
    if (type === "radio") {
      onChange({ ...value, [row]: col });
    } else {
      const currentValues = (value[row] as string[]) || [];
      const newValues = checked
        ? [...currentValues, col]
        : currentValues.filter((v) => v !== col);
      onChange({ ...value, [row]: newValues });
    }
  };

  return (
    <div className={`overflow-x-auto rounded-lg border transition-all duration-300 ${
      darkMode ? 'border-slate-800' : 'border-slate-200'
    } ${
      error ? "border-red-500 ring-4 ring-red-500/10" : ""
    }`}>
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        <thead className={darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}>
          <tr>
            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {question.text}
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y ${darkMode ? 'bg-slate-900/20 divide-slate-800' : 'bg-white divide-slate-200'}`}>
          {rows.map((row) => (
            <tr key={row} className={`transition-colors duration-150 ${darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
              <td className="px-4 py-3 whitespace-nowrap text-[11px] font-medium text-slate-700 dark:text-slate-300">
                {row}
              </td>
              {columns.map((col) => {
                const isSelected = type === "radio"
                  ? value[row] === col
                  : (value[row] as string[])?.includes(col);
                  
                return (
                  <td
                    key={col}
                    className="px-4 py-3 whitespace-nowrap text-center"
                  >
                    <div className="flex justify-center">
                      <input
                        type={type}
                        name={`${question.id}-${row}`}
                        checked={isSelected}
                        onChange={(e) => handleChange(row, col, e.target.checked)}
                        disabled={readOnly}
                        className={`h-3.5 w-3.5 text-blue-600 focus:ring-blue-500/20 border-slate-300 dark:border-slate-700 dark:bg-slate-900 ${
                          readOnly ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                        } ${type === 'radio' ? 'rounded-full' : 'rounded'}`}
                        required={
                          question.required && type === "radio" && !value[row]
                        }
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
