"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export default class GlobalErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    void fetch("/api/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: `${error.message}\n${error.stack || ""}`,
        context: errorInfo.componentStack || "react_error_boundary",
        url: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      }),
    });
  }

  private reloadPage = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl rounded-2xl border border-[#C9A84C]/30 bg-[#0f1923] p-8 text-center">
          <h2 className="text-2xl font-semibold text-[#C9A84C]">Something went wrong</h2>
          <p className="mt-3 text-sm text-white/80">Our team has been notified.</p>
          <button
            type="button"
            onClick={this.reloadPage}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0f1923] transition-colors hover:bg-[#b8953f]"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}
