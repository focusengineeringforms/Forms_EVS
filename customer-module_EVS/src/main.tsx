import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
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
