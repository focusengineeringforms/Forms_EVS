import React from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

interface ThankYouMessageProps {
  logoUrl?: string;
  isDuplicate?: boolean;
  email?: string;
}

export default function ThankYouMessage({ logoUrl, isDuplicate, email }: ThankYouMessageProps) {
  return (
    <div className="w-full bg-white dark:bg-gray-950 flex flex-col items-center justify-center py-6 sm:py-12 px-4 sm:px-6 min-h-screen">
      <div className="max-w-2xl w-full text-center">
        {logoUrl && (
          <div className="mb-8">
            <img src={logoUrl} alt="Form logo" className="h-28 sm:h-36 object-contain mx-auto" />
          </div>
        )}
        <div className="mb-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
              <Check className="w-6 h-6 text-white" />
            </div>
          </div>

          {isDuplicate ? (
            <>
              <h1 className="text-3xl font-black mb-8 text-gray-900 dark:text-white tracking-tighter uppercase">
                ALREADY SUBMITTED
              </h1>
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-100 dark:border-amber-800 p-8 rounded-3xl shadow-sm text-amber-900 dark:text-amber-400">
                <p className="text-base font-bold uppercase tracking-tight leading-relaxed">
                  You have already responded to this form {email ? `as ${email}` : ""}.
                </p>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black mb-8 text-gray-900 dark:text-white tracking-tighter uppercase">
                THANK YOU FOR YOUR RESPONSE
              </h1>
              <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-100 dark:border-gray-800 p-8 rounded-3xl shadow-sm">
                <p className="text-base font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight leading-relaxed">
                  Your feedback is extremely valuable to us. Our team will review your responses immediately!
                </p>
              </div>
            </>
          )}
        </div>
        <div className="mt-12">
          <Link
            to="/forms/analytics"
            className="inline-flex items-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl transition-all font-black text-sm uppercase tracking-widest shadow-xl shadow-primary-600/20 active:scale-95"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
