import type { User } from '@shared/types/models';

/**
 * Authentication session status indicator.
 */
export type SessionStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Global authentication session state tree.
 */
export interface SessionState {
  /** Authenticated user profile or null when unauthenticated */
  user: User | null;
  /** Active JWT bearer token */
  token: string | null;
  /** Granular status for session lifecycle */
  status: SessionStatus;
  /** Optional error message from last auth attempt */
  error: string | null;
}

/**
 * Credentials payload for user sign-in.
 */
export interface LoginCredentials {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

/**
 * Registration payload for creating a new user account.
 */
export interface RegisterCredentials {
  name: string;
  email: string;
  password?: string;
}
