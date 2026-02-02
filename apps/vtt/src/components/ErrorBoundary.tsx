import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`, error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <span className="text-xl text-red-400">!</span>
          </div>
          <p className="text-sm font-medium text-zinc-300">Something went wrong</p>
          <p className="max-w-sm text-center text-xs text-zinc-500">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-1 rounded bg-zinc-700 px-4 py-1.5 text-xs text-zinc-200 transition hover:bg-zinc-600"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
