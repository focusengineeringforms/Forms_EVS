import React from 'react';
import { Plus, Minus, ListChecks } from 'lucide-react';
import { useTheme } from "../../context/ThemeContext";

interface OptionsInputProps {
  options: string[];
  onChange: (options: string[]) => void;
}

export default function OptionsInput({ options, onChange }: OptionsInputProps) {
  const { darkMode } = useTheme();

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange(newOptions);
  };

  const addOption = () => {
    onChange([...options, '']);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
      <div className="flex items-center gap-2 mb-4">
        <ListChecks className="w-3.5 h-3.5 text-blue-500" />
        <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Choice Options</h4>
      </div>
      
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2 group">
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option label ${index + 1}`}
              className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                darkMode 
                  ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' 
                  : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10'
              }`}
            />
            <button
              type="button"
              onClick={() => removeOption(index)}
              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addOption}
          className={`flex items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
            darkMode 
              ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' 
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          <Plus className="w-3 h-3 mr-1.5" />
          Add Choice
        </button>
      </div>
    </div>
  );
}