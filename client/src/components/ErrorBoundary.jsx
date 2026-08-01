import React, { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Button from "./Button";
import Card from "./Card";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an analytics service or server console
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Custom premium fallback UI
      return (
        <Card hoverEffect={false} className="border-red-500/25 bg-red-500/5 dark:bg-red-500/10 backdrop-blur-sm p-6 text-center max-w-md mx-auto my-8">
          <div className="h-12 w-12 rounded-full bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-md font-bold text-slate-900 dark:text-red-400 mb-2">
            Widget Render Crash
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            Something went wrong while rendering this panel. This section has been isolated to prevent crashing the entire dashboard.
          </p>
          {this.state.error && (
            <p className="text-[10px] font-mono text-red-500 bg-red-500/10 rounded px-2.5 py-1.5 mb-5 max-w-full overflow-x-auto truncate">
              {this.state.error.toString()}
            </p>
          )}
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="gap-1.5 border-red-500/20 text-red-500 hover:bg-red-500/10"
          >
            <RefreshCw size={12} /> Reload Application
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
