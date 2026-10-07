/**
 * Centralized Client-Side Logger and Telemetry Forwarder.
 *
 * Provides leveled logging (`debug`, `info`, `warn`, `error`) with in-memory buffer ring
 * for diagnostic inspection and optional remote beacon shipping in production.
 */

/**
 * Severity level of a log event.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Represents a structured log record captured by the logger.
 */
export interface LogEntry {
  /** ISO 8601 timestamp when the log occurred */
  timestamp: string;
  /** Severity level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Optional contextual payload or error object */
  data?: unknown;
  /** Browser URL where the event took place */
  url: string;
  /** Browser user-agent string */
  userAgent?: string;
}

/**
 * Singleton client-side logger implementation.
 */
class Logger {
  private readonly maxBufferSize = 50;
  private readonly buffer: LogEntry[] = [];
  private readonly isProd = import.meta.env.PROD;
  private readonly logEndpoint = (import.meta.env.VITE_LOG_ENDPOINT as string | undefined) ?? '/api/logs';

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Records an entry into the local circular memory buffer and evaluates remote delivery.
   */
  private record(level: LogLevel, message: string, data?: unknown): LogEntry {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      data,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.buffer.push(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    // Remote logging disabled for Stage 1 to prevent 405 errors
    const isRemoteLoggingEnabled = false;
    if (isRemoteLoggingEnabled && this.isProd && (level === 'error' || level === 'warn')) {
      this.sendToRemote(entry);
    }

    return entry;
  }

  /**
   * Attempts to ship a log entry to a remote telemetry collector via Navigator Beacon or keepalive fetch.
   */
  private sendToRemote(entry: LogEntry): void {
    if (typeof window === 'undefined') return;

    try {
      const payload = JSON.stringify(entry);
      if (typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(this.logEndpoint, blob);
      } else {
        void fetch(this.logEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {
          // Gracefully ignore network errors on log shipping
        });
      }
    } catch {
      // Prevent recursive crashes in telemetry dispatch
    }
  }

  /**
   * Logs low-level debugging details. Suppressed in production builds.
   *
   * @param {string} message - Diagnostic message.
   * @param {unknown} [data] - Optional diagnostic payload.
   */
  debug(message: string, data?: unknown): void {
    if (this.isProd) return;
    this.record('debug', message, data);
    console.debug(`%c[DEBUG] %c${message}`, 'color: #9E9E9E; font-weight: bold;', 'color: inherit;', data ?? '');
  }

  /**
   * Logs general informational messages.
   *
   * @param {string} message - Info message.
   * @param {unknown} [data] - Optional metadata.
   */
  info(message: string, data?: unknown): void {
    this.record('info', message, data);
    if (!this.isProd) {
      console.info(`%c[INFO] %c${message}`, 'color: #2196F3; font-weight: bold;', 'color: inherit;', data ?? '');
    }
  }

  /**
   * Logs non-fatal warnings or recoverable degradation.
   *
   * @param {string} message - Warning message.
   * @param {unknown} [data] - Optional context.
   */
  warn(message: string, data?: unknown): void {
    this.record('warn', message, data);
    console.warn(`%c[WARN] %c${message}`, 'color: #FF9800; font-weight: bold;', 'color: inherit;', data ?? '');
  }

  /**
   * Logs application runtime errors, uncaught exceptions, and unhandled promises.
   *
   * @param {string} message - Error description.
   * @param {unknown} [data] - Error object or stack trace.
   */
  error(message: string, data?: unknown): void {
    this.record('error', message, data);
    console.error(`%c[ERROR] %c${message}`, 'color: #F44336; font-weight: bold;', 'color: inherit;', data ?? '');
  }

  /**
   * Returns a read-only snapshot of the circular in-memory buffer for diagnostics.
   *
   * @returns {readonly LogEntry[]} Last logged entries (up to buffer capacity).
   */
  getRecentLogs(): readonly LogEntry[] {
    return this.buffer;
  }
}

/**
 * Global application logger instance.
 */
export const logger = new Logger();

/**
 * Registers global browser error listeners for window-level errors and unhandled promise rejections.
 * Should be called once during application bootstrap (e.g. in `main.tsx`).
 */
export function initGlobalErrorLogging(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event: ErrorEvent) => {
    logger.error('Unhandled window error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error instanceof Error ? event.error.stack : undefined,
    });
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    logger.error('Unhandled promise rejection', {
      reason: event.reason instanceof Error ? { message: event.reason.message, stack: event.reason.stack } : event.reason,
    });
  });
}
