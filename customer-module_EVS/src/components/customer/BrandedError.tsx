import React from "react";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";

interface BrandedErrorProps {
  title?: string;
  message?: string;
  logoUrl?: string;
  onRetry?: () => void;
  onHome?: () => void;
  darkMode?: boolean;
}

export const BrandedError: React.FC<BrandedErrorProps> = ({
  title = "Form Expired or Invalid",
  message = "The link you followed may be incorrect, expired, or you have already submitted this feedback.",
  logoUrl = "https://evsuae.com/wp-content/uploads/2023/12/EVS-Logo.png",
  onRetry,
  onHome,
  darkMode = false,
}) => {
  return (
    <div className={`h-[100dvh] w-full flex flex-col items-center justify-center p-6 text-center ${darkMode ? 'bg-[#0a0b1e] text-white' : 'bg-slate-50 text-slate-900'} font-sans overflow-hidden relative selection:bg-rose-500/30`}>
      {/* Dynamic Background Accents */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[30%] h-[30%] rounded-full bg-orange-500/5 blur-[100px] pointer-events-none animate-pulse delay-700" />

      <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 fade-in duration-1000 slide-in-from-bottom-8">
        {/* Logo Section */}
        {logoUrl && (
          <div className="mb-10 group">
            <img
              src={logoUrl}
              alt="Logo"
              className="h-20 md:h-28 mx-auto object-contain transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        )}

        {/* Status Icon */}
        <div className="relative mb-8 inline-block">
          <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
          <div className="relative w-20 h-20 bg-gradient-to-tr from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-xl shadow-rose-500/30 rotate-3 group hover:rotate-0 transition-transform duration-500">
            <AlertTriangle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4 mb-10">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight uppercase bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-sm md:text-base font-bold text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="group relative flex items-center justify-center gap-2 w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-950 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 active:translate-y-0"
            >
              <RefreshCcw className="w-4 h-4 transition-transform group-hover:rotate-180 duration-700" />
              Try Again
            </button>
          )}
          
          {onHome && (
            <button
              onClick={onHome}
              className="flex items-center justify-center gap-2 w-full py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-200"
            >
              <Home className="w-4 h-4" />
              Return Home
            </button>
          )}
        </div>

        {/* Support Footer */}
        <p className="mt-12 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Need help? Contact <span className="text-slate-900 dark:text-white">support@focusengineering.com</span>
        </p>
      </div>
    </div>
  );
};
