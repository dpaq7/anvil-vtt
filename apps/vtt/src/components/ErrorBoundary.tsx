import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { addBreadcrumb, reportBug } from '../lib/bug-reporting.js';
import {
  isChunkLoadError,
  refreshForChunkLoadError,
} from '../lib/chunk-reload.js';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  reportStatus: 'idle' | 'sending' | 'sent' | 'failed';
  reportId: string | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      reportStatus: 'idle',
      reportId: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, reportStatus: 'sending', reportId: null };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(
      `[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`,
      error,
      info.componentStack,
    );
    addBreadcrumb({
      category: 'error',
      message: error.message || 'React render crash',
      data: { source: this.props.label ?? 'react' },
    });
    void reportBug({
      kind: 'react-render',
      message: error.message || 'React render crash',
      stack: error.stack ?? null,
      componentStack: info.componentStack,
      source: this.props.label ?? 'react',
    })
      .then((result) => {
        this.setState({ reportStatus: 'sent', reportId: result?.id ?? null });
      })
      .catch(() => {
        this.setState({ reportStatus: 'failed', reportId: null });
      });
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const chunkLoadError = isChunkLoadError(this.state.error);

      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <span className="text-xl text-red-400">!</span>
          </div>
          <p className="text-sm font-medium text-zinc-300">
            {chunkLoadError ? 'Update needed' : 'Something went wrong'}
          </p>
          <p className="max-w-sm text-center text-xs text-zinc-500">
            {chunkLoadError
              ? 'The app was updated while this tab was open. Refresh to continue with the latest version.'
              : (this.state.error?.message ?? 'An unexpected error occurred.')}
          </p>
          <p className="text-center text-xs text-zinc-500">
            {this.state.reportStatus === 'sending'
              ? 'Sending crash report...'
              : null}
            {this.state.reportStatus === 'sent'
              ? this.state.reportId
                ? `Crash report sent: ${this.state.reportId}`
                : 'Crash report sent.'
              : null}
            {this.state.reportStatus === 'failed'
              ? 'Crash report could not be sent.'
              : null}
          </p>
          <button
            onClick={() => {
              if (chunkLoadError) {
                refreshForChunkLoadError({ force: true });
                return;
              }
              this.setState({
                hasError: false,
                error: null,
                reportStatus: 'idle',
                reportId: null,
              });
            }}
            className="mt-1 rounded bg-zinc-700 px-4 py-1.5 text-xs text-zinc-200 transition hover:bg-zinc-600"
          >
            {chunkLoadError ? 'Refresh App' : 'Try Again'}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
