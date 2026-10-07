import { configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import { reduxProdErrorLogger } from '@app/middleware/reduxProdErrorLogger';
import { apiSlice } from '@shared/api/apiSlice';

/**
 * Global Redux Store Configuration.
 *
 * Configures the centralized Redux state tree using Redux Toolkit.
 * - Integrates RTK Query `apiSlice` reducer and cache middleware.
 * - In development mode: attaches `redux-logger` for detailed action debugging.
 * - In production mode: attaches `reduxProdErrorLogger` for silent monitoring and remote beacon forwarding.
 */
export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    const baseMiddleware = getDefaultMiddleware().concat(apiSlice.middleware);
    if (import.meta.env.DEV) {
      const devLogger = createLogger({
        collapsed: true,
        duration: true,
        timestamp: true,
      });
      return baseMiddleware.concat(devLogger);
    }
    return baseMiddleware.concat(reduxProdErrorLogger);
  },
});

/**
 * Root state type representing the inferred state tree of the application.
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * Dispatch type including thunk and RTK middleware actions.
 */
export type AppDispatch = typeof store.dispatch;
