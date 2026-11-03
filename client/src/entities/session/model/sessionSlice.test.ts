import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import {
  sessionReducer,
  sessionListenerMiddleware,
  setCredentials,
  logOut,
  updateProfile,
  setAuthError,
  setSessionLoading,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
} from './sessionSlice';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthToken,
  selectSessionStatus,
  selectAuthError,
} from './selectors';
import type { User } from '@shared/types/models';
import type { SessionState } from './types';

function createSessionTestStore(preloadedSession?: SessionState) {
  return configureStore({
    reducer: { session: sessionReducer },
    preloadedState: preloadedSession ? { session: preloadedSession } : undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(sessionListenerMiddleware.middleware),
  });
}

describe('sessionSlice and selectors', () => {
  const mockUser: User = {
    id: 'user-42',
    name: 'Alex Rivers',
    email: 'alex.rivers@wanderflow.app',
    avatarUrl: 'https://images.unsplash.com/avatar',
    role: 'user',
  };

  const mockToken = 'mock-jwt-token-xyz';

  beforeEach(() => {
    window.localStorage?.clear();
    vi.clearAllMocks();
  });

  describe('pure reducer and listener middleware persistence', () => {
    const emptyState: SessionState = {
      user: null,
      token: null,
      status: 'unauthenticated',
      error: null,
    };

    it('keeps reducer pure (no storage writes when called directly)', () => {
      const nextState = sessionReducer(
        emptyState,
        setCredentials({ user: mockUser, token: mockToken })
      );

      expect(nextState.user).toEqual(mockUser);
      expect(nextState.token).toBe(mockToken);
      expect(nextState.status).toBe('authenticated');
      expect(window.localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });

    it('persists token and user to localStorage via sessionListenerMiddleware on setCredentials', () => {
      const store = createSessionTestStore(emptyState);
      store.dispatch(setCredentials({ user: mockUser, token: mockToken }));

      const nextState = store.getState().session;
      expect(nextState.user).toEqual(mockUser);
      expect(nextState.token).toBe(mockToken);
      expect(nextState.status).toBe('authenticated');
      expect(nextState.error).toBeNull();

      expect(window.localStorage.getItem(AUTH_TOKEN_KEY)).toBe(mockToken);
      expect(JSON.parse(window.localStorage.getItem(AUTH_USER_KEY)!)).toEqual(mockUser);
    });

    it('cleans up localStorage via sessionListenerMiddleware on logOut', () => {
      const authedState: SessionState = {
        user: mockUser,
        token: mockToken,
        status: 'authenticated',
        error: null,
      };

      window.localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(mockUser));

      const store = createSessionTestStore(authedState);
      store.dispatch(logOut());

      const nextState = store.getState().session;
      expect(nextState.user).toBeNull();
      expect(nextState.token).toBeNull();
      expect(nextState.status).toBe('unauthenticated');
      expect(window.localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(window.localStorage.getItem(AUTH_USER_KEY)).toBeNull();
    });

    it('syncs updated user to localStorage via sessionListenerMiddleware on updateProfile', () => {
      const authedState: SessionState = {
        user: mockUser,
        token: mockToken,
        status: 'authenticated',
        error: null,
      };

      const store = createSessionTestStore(authedState);
      store.dispatch(updateProfile({ name: 'Alex Wanderer' }));

      const nextState = store.getState().session;
      expect(nextState.user?.name).toBe('Alex Wanderer');
      expect(nextState.user?.email).toBe(mockUser.email);

      const persisted = JSON.parse(window.localStorage.getItem(AUTH_USER_KEY)!);
      expect(persisted.name).toBe('Alex Wanderer');
    });

    it('handles setAuthError and marks status unauthenticated', () => {
      const nextState = sessionReducer(
        emptyState,
        setAuthError('Invalid credentials')
      );

      expect(nextState.error).toBe('Invalid credentials');
      expect(nextState.status).toBe('unauthenticated');
    });

    it('handles setSessionLoading toggling status', () => {
      const loadingState = sessionReducer(emptyState, setSessionLoading(true));
      expect(loadingState.status).toBe('loading');

      const doneState = sessionReducer(loadingState, setSessionLoading(false));
      expect(doneState.status).toBe('unauthenticated');
    });
  });

  describe('session selectors', () => {
    it('returns correct state slices via selectors', () => {
      const rootState = {
        session: {
          user: mockUser,
          token: mockToken,
          status: 'authenticated' as const,
          error: null,
        },
      };

      expect(selectCurrentUser(rootState)).toEqual(mockUser);
      expect(selectIsAuthenticated(rootState)).toBe(true);
      expect(selectAuthToken(rootState)).toBe(mockToken);
      expect(selectSessionStatus(rootState)).toBe('authenticated');
      expect(selectAuthError(rootState)).toBeNull();
    });

    it('selectIsAuthenticated returns false when token or status is not authenticated', () => {
      const unauthedState = {
        session: {
          user: null,
          token: null,
          status: 'unauthenticated' as const,
          error: 'Session expired',
        },
      };

      expect(selectIsAuthenticated(unauthedState)).toBe(false);
      expect(selectAuthError(unauthedState)).toBe('Session expired');
    });
  });
});
