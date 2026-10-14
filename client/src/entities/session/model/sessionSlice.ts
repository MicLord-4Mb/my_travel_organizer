import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@shared/types/models';
import type { SessionState } from './types';

export const AUTH_TOKEN_KEY = 'wanderflow_auth_token';
export const AUTH_USER_KEY = 'wanderflow_auth_user';

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage && typeof globalThis.localStorage.getItem === 'function') {
      return globalThis.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Restores persisted session credentials from localStorage.
 */
function loadPersistedSession(): { user: User | null; token: string | null } {
  const storage = getStorage();
  if (!storage) return { user: null, token: null };
  try {
    const token = storage.getItem(AUTH_TOKEN_KEY);
    const userJson = storage.getItem(AUTH_USER_KEY);
    const user = userJson ? (JSON.parse(userJson) as User) : null;
    return { token, user };
  } catch (err) {
    console.warn('Failed to restore session from localStorage', err);
    return { user: null, token: null };
  }
}

const persisted = loadPersistedSession();

const initialState: SessionState = {
  user: persisted.user,
  token: persisted.token,
  status: persisted.token ? 'authenticated' : 'unauthenticated',
  error: null,
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    /**
     * Stores authenticated credentials and persists them to localStorage.
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

      try {
        const storage = getStorage();
        storage?.setItem(AUTH_TOKEN_KEY, token);
        storage?.setItem(AUTH_USER_KEY, JSON.stringify(user));
      } catch (err) {
        console.warn('Failed to persist auth session to localStorage', err);
      }
    },

    /**
     * Clears authentication credentials from store and deletes them from localStorage.
     */
    logOut: (state) => {
      state.user = null;
      state.token = null;
      state.status = 'unauthenticated';
      state.error = null;

      try {
        const storage = getStorage();
        storage?.removeItem(AUTH_TOKEN_KEY);
        storage?.removeItem(AUTH_USER_KEY);
      } catch (err) {
        console.warn('Failed to clear auth session from localStorage', err);
      }
    },

    /**
     * Applies partial updates to the currently logged in user profile.
     */
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        try {
          const storage = getStorage();
          storage?.setItem(AUTH_USER_KEY, JSON.stringify(state.user));
        } catch (err) {
          console.warn('Failed to update persisted user in localStorage', err);
        }
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
