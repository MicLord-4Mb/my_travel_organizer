export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  url: string;
  userAgent?: string;
}

class Logger {
  private readonly maxBufferSize = 50;
  private readonly buffer: LogEntry[] = [];
  private readonly isProd = import.meta.env.PROD;
  private readonly logEndpoint = (import.meta.env.VITE_LOG_ENDPOINT as string | undefined) ?? '/api/logs';

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

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

    if (this.isProd && (level === 'error' || level === 'warn')) {
      this.sendToRemote(entry);
    }

    return entry;
  }

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
      // Prevent recursive crashes
    }
  }

  debug(message: string, data?: unknown): void {
    if (this.isProd) return;
    this.record('debug', message, data);
    console.debug(`%c[DEBUG] %c${message}`, 'color: #9E9E9E; font-weight: bold;', 'color: inherit;', data ?? '');
  }

  info(message: string, data?: unknown): void {
    this.record('info', message, data);
    if (!this.isProd) {
      console.info(`%c[INFO] %c${message}`, 'color: #2196F3; font-weight: bold;', 'color: inherit;', data ?? '');
    }
  }

  warn(message: string, data?: unknown): void {
    this.record('warn', message, data);
    console.warn(`%c[WARN] %c${message}`, 'color: #FF9800; font-weight: bold;', 'color: inherit;', data ?? '');
  }

  error(message: string, data?: unknown): void {
    this.record('error', message, data);
    console.error(`%c[ERROR] %c${message}`, 'color: #F44336; font-weight: bold;', 'color: inherit;', data ?? '');
  }

  getRecentLogs(): readonly LogEntry[] {
    return this.buffer;
  }
}

export const logger = new Logger();

/**
 * Initializes global error listeners for window errors and unhandled promise rejections.
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
