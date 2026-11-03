import { configureStore } from '@reduxjs/toolkit';
import { reduxProdErrorLogger } from '@app/middleware/reduxProdErrorLogger';
import { apiSlice } from '@shared/api/apiSlice';

import { devLogger } from '@app/middleware/devLogger';

import { sessionReducer, sessionListenerMiddleware } from '@entities/session';

/**
 * Global Redux Store Configuration.
 *
 * Configures the centralized Redux state tree using Redux Toolkit.
 * - Integrates RTK Query `apiSlice` reducer and cache middleware.
 * - Integrates `sessionReducer` for authentication session and user state,
 *   paired with `sessionListenerMiddleware` for side-effect-free storage persistence.
 * - In development mode: attaches `redux-logger` for detailed action debugging.
 * - In production mode: attaches `reduxProdErrorLogger` for silent monitoring and remote beacon forwarding.
 */
export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    session: sessionReducer,
  },
  middleware: (getDefaultMiddleware) => {
    const baseMiddleware = getDefaultMiddleware()
      .prepend(sessionListenerMiddleware.middleware)
      .concat(apiSlice.middleware);
    if (import.meta.env.DEV && devLogger) {
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
