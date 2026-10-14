import type { Middleware } from '@reduxjs/toolkit';

let devLogger: Middleware | null = null;

if (import.meta.env.DEV) {
  const { createLogger } = await import('redux-logger');
  devLogger = createLogger({
    collapsed: true,
    duration: true,
    timestamp: true,
  });
}

export { devLogger };
