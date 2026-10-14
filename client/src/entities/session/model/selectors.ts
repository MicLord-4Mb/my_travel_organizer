import type { User } from '@shared/types/models';
import type { SessionState, SessionStatus } from './types';

interface StateWithSession {
  session: SessionState;
}

/**
 * Returns the currently authenticated user entity, or null if unauthenticated.
 */
export const selectCurrentUser = (state: StateWithSession): User | null => state.session.user;

/**
 * Returns true if a valid auth token is held in the session state.
 */
export const selectIsAuthenticated = (state: StateWithSession): boolean =>
  Boolean(state.session.token && state.session.status === 'authenticated');

/**
 * Returns the current JWT bearer token or null.
 */
export const selectAuthToken = (state: StateWithSession): string | null => state.session.token;

/**
 * Returns the active session status.
 */
export const selectSessionStatus = (state: StateWithSession): SessionStatus => state.session.status;

/**
 * Returns the current auth error message or null.
 */
export const selectAuthError = (state: StateWithSession): string | null => state.session.error;
