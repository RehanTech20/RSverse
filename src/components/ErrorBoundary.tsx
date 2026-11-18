import React from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Log concise message without leaking sensitive state to UI
    console.error('RSverse UI error:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0A0714] text-white p-6">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#130F24] p-8 text-center space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold">Something went out of sync</h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                RSverse encountered an unexpected rendering issue. Refresh the page to reconnect safely.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-sm font-semibold cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload RSverse
              </button>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="px-5 py-3 rounded-xl border border-white/15 text-sm font-medium text-slate-200 hover:bg-white/5 cursor-pointer"
              >
                Try Recovering View
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
