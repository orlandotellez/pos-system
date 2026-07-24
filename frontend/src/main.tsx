import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { AppBootstrap } from "./context/AppBootstrap";
import "./index.css";
import { ToastProvider } from "./components/common/ui/Toast";
import { ErrorBoundary } from "./components/common/ui/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppBootstrap>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </AppBootstrap>
  </StrictMode>,
);
