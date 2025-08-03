import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // In a production app, you might want to log this to an error reporting service
    // For now, we'll just store it in localStorage for debugging
    try {
      const errorLog = {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: Date.now(),
      };

      const existingLogs = JSON.parse(
        localStorage.getItem("treasure_shell_errors") || "[]",
      );
      existingLogs.push(errorLog);

      // Keep only the last 10 errors
      const recentLogs = existingLogs.slice(-10);
      localStorage.setItem("treasure_shell_errors", JSON.stringify(recentLogs));
    } catch (e) {
      console.error("Failed to log error:", e);
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent error={this.state.error} retry={this.retry} />
        );
      }

      return (
        <DefaultErrorFallback error={this.state.error} retry={this.retry} />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  retry: () => void;
}

export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  retry,
}) => {
  const goHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen terminal-bg cyber-grid flex items-center justify-center p-4">
      <Card className="glow-border bg-card/90 backdrop-blur max-w-md w-full">
        <CardHeader className="text-center">
          <AlertTriangle className="w-12 h-12 text-cyber-red mx-auto mb-4" />
          <CardTitle className="text-cyber-red matrix-text">
            System Error Detected
          </CardTitle>
          <CardDescription>
            Something went wrong in the terminal. This error has been logged for
            analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-cyber-red/50 bg-cyber-red/10">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-cyber-red">
              {error?.message || "An unexpected error occurred"}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button onClick={retry} className="w-full glow-border matrix-text">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Operation
            </Button>

            <Button
              onClick={goHome}
              variant="outline"
              className="w-full glow-border matrix-text"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
            Error ID: {Date.now().toString(36)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
