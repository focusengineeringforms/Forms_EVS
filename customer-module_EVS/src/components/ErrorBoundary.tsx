import React, { Component, ErrorInfo, ReactNode } from "react";
import { BrandedError } from "./customer/BrandedError";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <BrandedError
          title="Something went wrong"
          message="We encountered an unexpected error while loading the form. Please try refreshing the page."
          onRetry={() => window.location.reload()}
        />
      );
    }

    return this.children;
  }
}

export default ErrorBoundary;
