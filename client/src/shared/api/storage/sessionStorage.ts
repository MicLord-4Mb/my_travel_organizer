import type { User } from '@shared/types/models';

export const AUTH_TOKEN_KEY = 'wanderflow_auth_token';
export const AUTH_USER_KEY = 'wanderflow_auth_user';
export const ACTIVE_TRIP_ID_KEY = 'wanderflow_active_trip_id';

function getBrowserStorage(): Storage | null {
  try {
    if (
      typeof window !== 'undefined' &&
      window.localStorage &&
      typeof window.localStorage.getItem === 'function'
    ) {
      return window.localStorage;
    }
    if (
      typeof globalThis !== 'undefined' &&
      globalThis.localStorage &&
      typeof globalThis.localStorage.getItem === 'function'
    ) {
      return globalThis.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Restores persisted session credentials from storage adapter.
 */
export function loadPersistedSession(): { user: User | null; token: string | null } {
  const storage = getBrowserStorage();
  if (!storage) return { user: null, token: null };
  try {
    const token = storage.getItem(AUTH_TOKEN_KEY);
    const userJson = storage.getItem(AUTH_USER_KEY);
    const user = userJson ? (JSON.parse(userJson) as User) : null;
    return { token, user };
  } catch (err) {
    console.warn('Failed to restore session from storage', err);
    return { user: null, token: null };
  }
}

/**
 * Persists authenticated user and token to storage adapter.
 */
export function savePersistedSession(user: User, token: string): void {
  try {
    const storage = getBrowserStorage();
    storage?.setItem(AUTH_TOKEN_KEY, token);
    storage?.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn('Failed to persist auth session to storage', err);
  }
}

/**
 * Updates persisted user profile in storage adapter.
 */
export function savePersistedUser(user: User): void {
  try {
    const storage = getBrowserStorage();
    storage?.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn('Failed to update persisted user in storage', err);
  }
}

/**
 * Removes persisted session credentials from storage adapter.
 */
export function clearPersistedSession(): void {
  try {
    const storage = getBrowserStorage();
    storage?.removeItem(AUTH_TOKEN_KEY);
    storage?.removeItem(AUTH_USER_KEY);
  } catch (err) {
    console.warn('Failed to clear auth session from storage', err);
  }
}

/**
 * Reads the last active trip ID from storage adapter.
 */
export function getPersistedActiveTripId(): string | null {
  try {
    return getBrowserStorage()?.getItem(ACTIVE_TRIP_ID_KEY) ?? null;
  } catch {
    return null;
  }
}

/**
 * Saves the active trip ID to storage adapter for cross-workspace navigation continuity.
 */
export function setPersistedActiveTripId(tripId: string | null): void {
  try {
    const storage = getBrowserStorage();
    if (!storage) return;
    if (tripId) {
      storage.setItem(ACTIVE_TRIP_ID_KEY, tripId);
    } else {
      storage.removeItem(ACTIVE_TRIP_ID_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

