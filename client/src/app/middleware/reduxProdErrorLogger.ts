import type { Middleware } from '@reduxjs/toolkit';
import { logger } from '@shared/lib/logger';

/**
 * Redux Production Error Logger Middleware.
 *
 * Monitors state mutations and action dispatches in production environments.
 * Specifically:
 * - Catches synchronous errors thrown during reducer execution or downstream middleware.
 * - Detects RTK async thunk actions that end with `/rejected` and logs their error details and payloads.
 * - Forwards errors to the centralized `logger` utility for remote telemetry collection.
 *
 * @type {Middleware}
 */
export const reduxProdErrorLogger: Middleware = () => (next) => (action) => {
  try {
    const result = next(action);

    if (typeof action === 'object' && action !== null && 'type' in action) {
      const typedAction = action as { type: string; error?: unknown; payload?: unknown };
      if (typedAction.type.endsWith('/rejected')) {
        logger.error(`Redux async action rejected: ${typedAction.type}`, {
          error: typedAction.error,
          payload: typedAction.payload,
        });
      }
    }

    return result;
  } catch (error) {
    logger.error('Redux dispatch error caught in middleware', {
      action,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });
    throw error;
  }
};
