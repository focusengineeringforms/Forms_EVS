import React from "react";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import CustomerFormsList from "./components/customer/CustomerFormsList";
import CustomerFormFiller from "./components/customer/CustomerFormFiller";
import NotificationContainer from "./components/ui/NotificationContainer";
import { ThemeProvider } from "./context/ThemeContext";

function TenantRouteWrapper() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  if (!tenantSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Access
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Please use a valid business link to access forms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<CustomerFormsList tenantSlug={tenantSlug} />} />
      <Route path="/forms/:formId" element={<CustomerFormFiller tenantSlug={tenantSlug} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <NotificationContainer />
        <Routes>
          <Route path="/:tenantSlug/*" element={<TenantRouteWrapper />} />
          <Route
            path="/"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Welcome to Customer Portal
                  </h1>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
