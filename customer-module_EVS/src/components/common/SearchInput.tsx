import React from 'react';
import { Search } from 'lucide-react';
import { useTheme } from "../../context/ThemeContext";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({ value, onChange, placeholder = 'Search resources...' }: SearchInputProps) {
  const { darkMode } = useTheme();
  
  return (
    <div className="relative flex-1 max-w-sm group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className={`h-3.5 w-3.5 ${darkMode ? 'text-slate-600' : 'text-slate-400'} group-focus-within:text-blue-500 transition-colors`} />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-9 pr-3 py-1.5 text-[11px] font-medium border rounded-xl transition-all duration-300 ${
          darkMode 
            ? 'bg-slate-900/50 border-slate-800 text-slate-200 placeholder-slate-700 focus:bg-slate-900 focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10' 
            : 'bg-white/50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10'
        } focus:outline-none`}
      />
    </div>
  );
}