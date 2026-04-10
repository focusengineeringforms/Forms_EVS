import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface Option {
  value: string;
  label: string;
}

interface SearchSelectProps {
  options: Option[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  required?: boolean;
  readOnly?: boolean;
  size?: "sm" | "md";
  error?: boolean;
}

export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  multiple = false,
  required = false,
  readOnly = false,
  size = "md",
  error = false,
}: SearchSelectProps) {
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSmall = size === "sm";

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const dropdownHeight = isSmall ? 300 : 450; // Estimated height (max-h-48/max-h-72 + search box)
      const spaceBelow = windowHeight - rect.bottom;
      
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen, isSmall]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: Option) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter((v) => v !== option.value)
        : [...currentValues, option.value];
      onChange(newValues);
    } else {
      onChange(option.value);
      setIsOpen(false);
    }
    setSearchTerm("");
  };

  const handleRemoveValue = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      onChange(currentValues.filter((v) => v !== optionValue));
    } else {
      onChange("");
    }
  };

  const getSelectedLabels = () => {
    if (multiple && Array.isArray(value)) {
      return value.map(
        (v) => options.find((opt) => opt.value === v)?.label || v
      );
    }
    return options.find((opt) => opt.value === value)?.label || "";
  };

  return (
    <div className="relative group/select w-full" ref={dropdownRef}>
      <div
        className={`flex items-center justify-between transition-all duration-300 shadow-sm ${
          isSmall ? "px-3 py-2 border rounded-xl" : "px-5 py-4 border-2 rounded-2xl"
        } ${
          readOnly 
            ? "cursor-not-allowed opacity-50 bg-slate-50/50" 
            : "cursor-pointer bg-white"
        } ${
          darkMode 
            ? `bg-slate-900/50 border-slate-800 ${isOpen ? 'ring-2 ring-blue-500/10 border-blue-500 bg-slate-900 shadow-xl' : 'hover:border-slate-700'}` 
            : `bg-white border-slate-100 ${isOpen ? 'ring-2 ring-blue-500/10 border-blue-500 bg-white shadow-lg' : 'hover:border-blue-200'}`
        } ${
          error ? "border-red-500 ring-4 ring-red-500/10" : ""
        }`}
        onClick={() => !readOnly && setIsOpen(!isOpen)}
      >
        <div className="flex-1 flex flex-wrap gap-2 items-center mr-2">
          {multiple ? (
            Array.isArray(value) && value.length > 0 ? (
              value.map((v) => (
                <span
                  key={v}
                  className={`inline-flex items-center rounded-xl text-xs font-bold uppercase tracking-[0.05em] border animate-in zoom-in-95 duration-200 ${
                    isSmall ? "px-2 py-0.5" : "px-3 py-1"
                  } ${
                    darkMode 
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' 
                      : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}
                >
                  {options.find((opt) => opt.value === v)?.label || v}
                  {!readOnly && (
                    <button
                      onClick={(e) => handleRemoveValue(v, e)}
                      className="ml-2 hover:text-red-500 transition-colors"
                    >
                      <X className={isSmall ? "w-2.5 h-2.5" : "w-3 h-3"} />
                    </button>
                  )}
                </span>
              ))
            ) : (
              <span className={`text-slate-400 font-medium italic opacity-60 ${isSmall ? "text-xs" : "text-sm"}`}>{placeholder}</span>
            )
          ) : (
            <span className={`tracking-tight ${
              isSmall ? "text-sm font-semibold" : "text-base font-bold"
            } ${value ? (darkMode ? 'text-white' : 'text-slate-900') : 'text-slate-400 italic opacity-60'}`}>
              {getSelectedLabels() || placeholder}
            </span>
          )}
        </div>
        <div className={`transition-all duration-300 ${
          isSmall ? "p-1 rounded-lg" : "p-2 rounded-xl"
        } ${isOpen ? "bg-blue-600 text-white rotate-180" : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover/select:text-blue-500"}`}>
          <ChevronDown className={isSmall ? "w-4 h-4" : "w-5 h-5"} />
        </div>
      </div>

      {isOpen && (
        <div className={`absolute z-50 w-full rounded-xl border shadow-2xl overflow-hidden animate-in fade-in duration-200 backdrop-blur-xl ${
          openUpward 
            ? `bottom-full slide-in-from-bottom-2 ${isSmall ? "mb-1 rounded-xl" : "mb-3 rounded-3xl"}` 
            : `top-full slide-in-from-top-2 ${isSmall ? "mt-1 rounded-xl" : "mt-3 rounded-3xl"}`
        } ${
          darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
        }`}>
          <div className={`${isSmall ? "p-2" : "p-4"} border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="relative">
              <Search className={`absolute -translate-y-1/2 text-blue-500 ${isSmall ? "left-3 w-4 h-4" : "left-4 w-5 h-5"} top-1/2`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search..."
                className={`w-full text-sm font-bold transition-all border ${
                  isSmall ? "pl-9 pr-3 py-2 rounded-lg" : "pl-12 pr-4 py-3.5 rounded-2xl border-2"
                } ${
                  darkMode 
                    ? 'bg-slate-800/50 border-slate-800 text-white focus:border-blue-500 focus:bg-slate-800 placeholder-slate-600' 
                    : 'bg-slate-50 border-transparent text-slate-900 focus:bg-white focus:border-blue-500 placeholder-slate-400'
                }`}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          <div className={`${isSmall ? "max-h-48" : "max-h-72"} overflow-y-auto p-1 custom-scrollbar`}>
            {filteredOptions.length > 0 ? (
              <div className="grid grid-cols-1 gap-0.5">
                {filteredOptions.map((option) => {
                  const isSelected = multiple
                    ? Array.isArray(value) && value.includes(option.value)
                    : value === option.value;
                  
                  return (
                    <div
                      key={option.value}
                      className={`text-sm font-bold cursor-pointer transition-all duration-200 flex items-center justify-between group/opt ${
                        isSmall ? "px-3 py-2 rounded-lg" : "px-5 py-4 rounded-2xl"
                      } ${
                        isSelected
                          ? darkMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-600 text-white shadow-md'
                          : darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                      onClick={() => handleSelect(option)}
                    >
                      <span className={`tracking-tight ${isSmall ? "text-xs font-semibold" : "text-sm font-bold"}`}>{option.label}</span>
                      {isSelected && (
                        <div className={`${isSmall ? "w-4 h-4" : "w-6 h-6"} bg-white/20 rounded-full flex items-center justify-center`}>
                          <span className={isSmall ? "text-[8px] font-black text-white" : "text-xs font-black text-white"}>✓</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`${isSmall ? "py-6" : "py-12"} flex flex-col items-center justify-center text-slate-400`}>
                <Search className={`${isSmall ? "w-8 h-8 mb-2" : "w-12 h-12 mb-3"} opacity-20`} />
                <p className={`${isSmall ? "text-xs" : "text-sm"} font-bold`}>No results found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {required && (
        <input
          type="text"
          tabIndex={-1}
          className="sr-only"
          required={
            required && (!value || (Array.isArray(value) && value.length === 0))
          }
          value={value ? "valid" : ""}
          onChange={() => {}}
        />
      )}
    </div>
  );
}
