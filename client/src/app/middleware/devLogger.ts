import type { Middleware } from '@reduxjs/toolkit';

let loadedLogger: Middleware | null = null;

if (import.meta.env.DEV) {
  void import('redux-logger').then(({ createLogger }) => {
    loadedLogger = createLogger({
      collapsed: true,
      duration: true,
      timestamp: true,
    });
  });
}

export const devLogger: Middleware = (storeApi) => (next) => (action) => {
  if (loadedLogger) {
    return loadedLogger(storeApi)(next)(action);
  }
  return next(action);
};
