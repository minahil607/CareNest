import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F6FAF7] p-6">
          <div className="max-w-lg w-full bg-white border border-[#DCE6DF] rounded-2xl p-6 space-y-4">
            <h1 className="text-xl font-bold text-[#14221B]">Something went wrong</h1>
            <p className="text-sm text-[#4A5F53] leading-relaxed">
              CareNest encountered an unexpected error while syncing data.
            </p>
            <pre className="text-xs bg-[#F6FAF7] border border-[#DCE6DF] rounded-xl p-3 overflow-auto max-h-40 text-[#4A5F53]">
              {this.state.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-[#1F7A53] text-white text-sm font-semibold hover:bg-[#176040] transition-colors"
            >
              Reload CareNest
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
