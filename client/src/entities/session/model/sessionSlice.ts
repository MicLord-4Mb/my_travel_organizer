import { createListenerMiddleware, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  loadPersistedSession,
  savePersistedSession,
  savePersistedUser,
  clearPersistedSession,
} from '@shared/api/storage';
import type { User } from '@shared/types/models';
import type { SessionState } from './types';

export { AUTH_TOKEN_KEY, AUTH_USER_KEY };

const persisted = loadPersistedSession();

const initialState: SessionState = {
  user: persisted.user,
  token: persisted.token,
  status: persisted.token ? 'authenticated' : 'unauthenticated',
  error: null,
};

/**
 * Pure Redux slice managing in-memory authentication session state.
 *
 * Storage side effects (`localStorage` writes/clears) are handled outside
 * the reducers by `sessionListenerMiddleware`.
 */
export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    /**
     * Stores authenticated credentials in Redux state.
     */
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.status = 'authenticated';
      state.error = null;
    },

    /**
     * Clears authentication credentials from Redux state.
     */
    logOut: (state) => {
      state.user = null;
      state.token = null;
      state.status = 'unauthenticated';
      state.error = null;
    },

    /**
     * Applies partial updates to the currently logged in user profile.
     */
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    /**
     * Sets auth error state from rejected requests or client validation.
     */
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.status = 'unauthenticated';
      }
    },

    /**
     * Toggles session loading state.
     */
    setSessionLoading: (state, action: PayloadAction<boolean>) => {
      state.status = action.payload ? 'loading' : state.token ? 'authenticated' : 'unauthenticated';
    },
  },
});

export const {
  setCredentials,
  logOut,
  updateProfile,
  setAuthError,
  setSessionLoading,
} = sessionSlice.actions;

export const sessionReducer = sessionSlice.reducer;

/**
 * RTK Listener Middleware that synchronizes session actions with persistent storage,
 * keeping `sessionSlice` reducers strictly pure.
 */
export const sessionListenerMiddleware = createListenerMiddleware();

sessionListenerMiddleware.startListening({
  actionCreator: setCredentials,
  effect: (action) => {
    savePersistedSession(action.payload.user, action.payload.token);
  },
});

sessionListenerMiddleware.startListening({
  actionCreator: logOut,
  effect: () => {
    clearPersistedSession();
  },
});

sessionListenerMiddleware.startListening({
  actionCreator: updateProfile,
  effect: (_action, listenerApi) => {
    const state = listenerApi.getState() as { session?: SessionState };
    if (state.session?.user) {
      savePersistedUser(state.session.user);
    }
  },
});
