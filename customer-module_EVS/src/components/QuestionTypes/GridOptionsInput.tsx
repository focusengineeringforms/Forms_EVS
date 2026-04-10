import React from 'react';
import { Plus, Minus, Layers, Columns } from 'lucide-react';
import type { GridOption } from '../../types';
import { useTheme } from "../../context/ThemeContext";

interface GridOptionsInputProps {
  gridOptions: GridOption;
  onChange: (gridOptions: GridOption) => void;
}

export default function GridOptionsInput({ gridOptions, onChange }: GridOptionsInputProps) {
  const { darkMode } = useTheme();

  const addRow = () => {
    onChange({
      ...gridOptions,
      rows: [...gridOptions.rows, '']
    });
  };

  const addColumn = () => {
    onChange({
      ...gridOptions,
      columns: [...gridOptions.columns, '']
    });
  };

  const updateRow = (index: number, value: string) => {
    const newRows = [...gridOptions.rows];
    newRows[index] = value;
    onChange({
      ...gridOptions,
      rows: newRows
    });
  };

  const updateColumn = (index: number, value: string) => {
    const newColumns = [...gridOptions.columns];
    newColumns[index] = value;
    onChange({
      ...gridOptions,
      columns: newColumns
    });
  };

  const removeRow = (index: number) => {
    onChange({
      ...gridOptions,
      rows: gridOptions.rows.filter((_, i) => i !== index)
    });
  };

  const removeColumn = (index: number) => {
    onChange({
      ...gridOptions,
      columns: gridOptions.columns.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Grid Rows</h4>
        </div>
        <div className="space-y-2">
          {gridOptions.rows.map((row, index) => (
            <div key={index} className="flex items-center space-x-2 group">
              <input
                type="text"
                value={row}
                onChange={(e) => updateRow(index, e.target.value)}
                placeholder={`Row label ${index + 1}`}
                className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' 
                    : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10'
                }`}
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className={`flex items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              darkMode 
                ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            <Plus className="w-3 h-3 mr-1.5" />
            Append Row
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Columns className="w-3.5 h-3.5 text-emerald-500" />
          <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Grid Columns</h4>
        </div>
        <div className="space-y-2">
          {gridOptions.columns.map((column, index) => (
            <div key={index} className="flex items-center space-x-2 group">
              <input
                type="text"
                value={column}
                onChange={(e) => updateColumn(index, e.target.value)}
                placeholder={`Column label ${index + 1}`}
                className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' 
                    : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10'
                }`}
              />
              <button
                type="button"
                onClick={() => removeColumn(index)}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addColumn}
            className={`flex items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              darkMode 
                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}
          >
            <Plus className="w-3 h-3 mr-1.5" />
            Append Column
          </button>
        </div>
      </div>
    </div>
  );
}