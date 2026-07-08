// ** Packages **
import { Component, type ErrorInfo, type ReactNode } from 'react';

// ** Components **
import Button from '@/components/ui/Button';

// ** Config **
import { IS_DEV } from '@config';

// ** Types **
interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback. If omitted, the default recovery screen is shown. */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level React error boundary. Catches render/lifecycle errors anywhere in
 * the tree below it and shows a recovery screen instead of a blank white page.
 * Wrapped around the whole app in App.tsx (outside the providers) so even
 * provider/router errors are caught.
 *
 * NOTE: error boundaries MUST be class components — there is no hook equivalent.
 * Forward errors to Sentry/your logger from `componentDidCatch`.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Render the fallback on the next render after an error is thrown.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Central reporting hook — swap console for Sentry/LogRocket/etc.
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-5xl font-bold text-gray-300">Oops</h1>
        <p className="text-gray-600">Something went wrong. Please try again.</p>

        {/* Show the message in dev only — never leak stack traces to users. */}
        {IS_DEV && this.state.error && (
          <pre className="max-w-lg overflow-auto rounded-md bg-red-50 p-3 text-left text-xs text-red-700">
            {this.state.error.message}
          </pre>
        )}

        <Button onClick={this.handleReload}>Reload page</Button>
      </div>
    );
  }
}

export default ErrorBoundary;
