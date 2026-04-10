import React, { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  placeholder?: string;
  floatingLabel?: boolean;
  helpText?: string;
}

export default function FormField({
  label,
  placeholder = " ",
  floatingLabel = true,
  helpText,
  className = "",
  id,
  ...props
}: FormFieldProps) {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;

  if (floatingLabel) {
    return (
      <div className="relative group">
        <input
          {...props}
          id={fieldId}
          className={`input-field peer ${className}`}
          placeholder={placeholder}
        />
        <label
          htmlFor={fieldId}
          className="absolute left-3 top-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 pointer-events-none transition-all duration-300 peer-placeholder-shown:top-2 peer-placeholder-shown:text-[10px] peer-focus:-top-4 peer-focus:left-1 peer-focus:text-[9px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:left-1 peer-[:not(:placeholder-shown)]:text-[9px] peer-[:not(:placeholder-shown)]:text-blue-500"
        >
          {label}
        </label>
        {helpText && (
          <div className="mt-1 text-[9px] font-bold text-slate-500 uppercase tracking-tight ml-1">{helpText}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={fieldId}
        className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 ml-1"
      >
        {label}
      </label>
      <input
        {...props}
        id={fieldId}
        className={`input-field ${className}`}
        placeholder={placeholder}
      />
      {helpText && (
        <div className="mt-1 text-[9px] font-bold text-slate-500 uppercase tracking-tight ml-1">{helpText}</div>
      )}
    </div>
  );
}
