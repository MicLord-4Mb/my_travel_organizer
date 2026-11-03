import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

/** Type guard for RTK Query transport / HTTP errors. */
export function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

/** Type guard for errors serialized by Redux Toolkit. */
export function isSerializedError(error: unknown): error is SerializedError {
  return typeof error === 'object' && error !== null && 'message' in error && !('status' in error);
}

function readMessage(value: unknown): string | undefined {
  if (typeof value === 'object' && value !== null && 'message' in value) {
    const message = (value as { message: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return undefined;
}

/**
 * Extracts a human-readable message from an unknown caught value
 * (RTK Query errors, `Error` instances, serialized errors or plain strings).
 *
 * @param error - Value caught in a `catch (err: unknown)` block.
 * @param fallback - Message returned when nothing readable can be extracted.
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (typeof error === 'string' && error) return error;
  if (isFetchBaseQueryError(error)) {
    return readMessage(error.data) ?? ('error' in error && error.error ? String(error.error) : fallback);
  }
  if (error instanceof Error && error.message) return error.message;
  if (isSerializedError(error)) return error.message ?? fallback;
  return fallback;
}

