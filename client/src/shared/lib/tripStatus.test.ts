import { describe, it, expect } from 'vitest';
import { calculateTripStatus } from './date';

describe('calculateTripStatus', () => {
  const today = new Date(2026, 9, 20); // 2026-10-20 local

  it('returns planned for trips starting in the future', () => {
    expect(
      calculateTripStatus({ startDate: '2026-10-21', endDate: '2026-10-25', status: 'planned' }, today)
    ).toBe('planned');
  });

  it('returns in_progress on the first and last day and in between', () => {
    expect(
      calculateTripStatus({ startDate: '2026-10-20', endDate: '2026-10-25', status: 'planned' }, today)
    ).toBe('in_progress');
    expect(
      calculateTripStatus({ startDate: '2026-10-15', endDate: '2026-10-20', status: 'planned' }, today)
    ).toBe('in_progress');
  });

  it('returns completed once the end date has passed, ignoring a stale stored status', () => {
    expect(
      calculateTripStatus({ startDate: '2026-10-10', endDate: '2026-10-19', status: 'in_progress' }, today)
    ).toBe('completed');
  });

  it('always preserves the manual cancelled override', () => {
    expect(
      calculateTripStatus({ startDate: '2026-10-10', endDate: '2026-10-19', status: 'cancelled' }, today)
    ).toBe('cancelled');
  });
});

