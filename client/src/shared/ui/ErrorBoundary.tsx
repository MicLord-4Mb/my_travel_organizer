import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@shared/lib/logger';

/**
 * Props for `<ErrorBoundary>`.
 */
interface Props {
  /** React child tree monitored for unhandled render-phase errors */
  children?: ReactNode;
  /** Optional custom fallback component to display when an error occurs */
  fallback?: ReactNode;
}

/**
 * Internal state for `<ErrorBoundary>`.
 */
interface State {
  /** Flag indicating whether a child component crashed */
  hasError: boolean;
  /** Caught error reference, or null when healthy */
  error: Error | null;
}

/**
 * Application-Level React Error Boundary.
 *
 * Traps runtime errors thrown during component rendering, lifecycle methods,
 * and constructor calls within child component subtrees.
 * - Forwards error stack traces and component stack trees to `logger.error`.
 * - Prevents entire page blanking by rendering a graceful fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Updates state so the next render will show the fallback UI.
   *
   * @param {Error} error - The caught runtime exception.
   * @returns {State} New state with `hasError: true`.
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Logs component stack details to the centralized application telemetry.
   *
   * @param {Error} error - The thrown exception.
   * @param {ErrorInfo} errorInfo - React component tree call stack.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('React component crash caught by ErrorBoundary', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  /**
   * Reloads the current window to attempt state recovery.
   */
  handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#4b5563', marginBottom: '1.5rem', maxWidth: '400px' }}>
            An error occurred in the application. The error data has been logged.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: 'var(--color-primary, #0D9488)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children ?? null;
  }
}

/**
 * Route-level Error Boundary component for React Router `errorElement`.
 * Catches route rendering or loader errors and displays a recovery view.
 */
export const RouteErrorBoundary = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>
        Route Navigation Error
      </h2>
      <p style={{ color: '#4b5563', marginBottom: '1.5rem', maxWidth: '420px' }}>
        We encountered an error loading this section of the travel workspace.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={() => { window.location.href = '/'; }}
          style={{
            padding: '0.6rem 1.2rem',
            backgroundColor: 'var(--color-primary, #0D9488)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Return to Overview
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.6rem 1.2rem',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};
