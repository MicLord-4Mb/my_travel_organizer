import type { Middleware } from '@reduxjs/toolkit';
import { logger } from '@shared/lib/logger';

/**
 * Production middleware for Redux:
 * Intercepts uncaught exceptions and rejected async actions, reporting them to the production logger.
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
