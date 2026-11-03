import { describe, it, expect } from 'vitest';
import { toTripPayload } from './tripPayload';
import type { TripFormData } from './tripSchema';

const base: TripFormData = {
  title: 'Kyoto',
  location: 'Kyoto, Japan',
  startDate: '2026-10-10',
  endDate: '2026-10-19',
  currency: 'USD',
};
const today = new Date(2026, 9, 20);

describe('toTripPayload', () => {
  it('derives status from dates instead of a form value', () => {
    expect(toTripPayload(base, today).status).toBe('completed');
  });

  it('keeps cancelled as a manual override', () => {
    expect(toTripPayload({ ...base, isCancelled: true }, today).status).toBe('cancelled');
  });

  it('maps an empty budget to null (no limit) and keeps explicit values', () => {
    expect(toTripPayload(base, today).budgetLimit).toBeNull();
    expect(toTripPayload({ ...base, budgetLimit: 1500 }, today).budgetLimit).toBe(1500);
  });

  it('does not leak the isCancelled form flag into the persisted payload', () => {
    expect('isCancelled' in toTripPayload({ ...base, isCancelled: true }, today)).toBe(false);
  });
});

