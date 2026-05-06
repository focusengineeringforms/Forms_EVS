import { StrictMode } from "react";
import React from "react";
import { createRoot } from "react-dom/client";

// Ensure React is available globally for any legacy dependencies or specific build transforms
// We do this BEFORE any other imports that might depend on it
if (typeof window !== "undefined") {
  (window as any).React = React;
  (window as any).global = window;
  // Some libraries check for process.env
  (window as any).process = { env: { NODE_ENV: 'production' } };
}
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { LogoProvider } from "./context/LogoContext";
import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import { NotificationProvider } from "./context/NotificationContext";
import { migrateLocalStorageForms } from "./utils/migrateLocalStorage";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Run localStorage migration on app startup
console.log("[Main] VERSION 1.1.0 - STICKY BUTTON FIX");
// window.alert("Focus Forms Initializing... Version 1.0.5");
migrateLocalStorageForms();
console.log("[Main] LocalStorage migration complete. Starting React render...");

console.log("[Main] Preparing to render root...");
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <LogoProvider>
          <AuthProvider>
            <SidebarProvider>
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </SidebarProvider>
          </AuthProvider>
        </LogoProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
