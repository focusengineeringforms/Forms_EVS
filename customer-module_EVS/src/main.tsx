import { StrictMode } from "react";
import React from "react";
import { createRoot } from "react-dom/client";

// Ensure React is available globally for any legacy dependencies or specific build transforms
if (typeof window !== "undefined") {
  (window as any).React = React;
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
console.log("[Main] Starting app initialization...");
// window.alert("Focus Forms Initializing..."); // Uncomment if needed for hard debugging
migrateLocalStorageForms();
console.log("[Main] LocalStorage migration complete.");

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
