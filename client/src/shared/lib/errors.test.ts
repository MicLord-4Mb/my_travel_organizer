import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './errors';

describe('getErrorMessage', () => {
  it('reads the server message from an RTK Query error', () => {
    expect(getErrorMessage({ status: 401, data: { message: 'Invalid credentials' } })).toBe(
      'Invalid credentials'
    );
  });

  it('falls back to the transport error text', () => {
    expect(getErrorMessage({ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' })).toBe(
      'TypeError: Failed to fetch'
    );
  });

  it('handles Error instances, strings and unknown values', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
    expect(getErrorMessage('plain')).toBe('plain');
    expect(getErrorMessage(null, 'fallback')).toBe('fallback');
    expect(getErrorMessage({ status: 500 }, 'fallback')).toBe('fallback');
  });
});

