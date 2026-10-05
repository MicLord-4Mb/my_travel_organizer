import { configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import tripReducer from '@entities/trip/model/tripSlice';
import { reduxProdErrorLogger } from '@app/middleware/reduxProdErrorLogger';

export const store = configureStore({
  reducer: {
    trip: tripReducer,
  },
  middleware: (getDefaultMiddleware) => {
    const middlewares = getDefaultMiddleware();

    if (import.meta.env.DEV) {
      const devLogger = createLogger({
        collapsed: true,
        duration: true,
        timestamp: true,
      });
      return middlewares.concat(devLogger);
    }

    return middlewares.concat(reduxProdErrorLogger);
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
