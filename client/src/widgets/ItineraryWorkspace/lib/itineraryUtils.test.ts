import { describe, it, expect } from 'vitest';
import { calculateTripDays, getCoordinatesDistanceKm, formatTimeWithPeriod } from './itineraryUtils';

describe('itineraryUtils', () => {
  it('calculateTripDays computes days and estimated costs correctly', () => {
    const days = calculateTripDays(
      '2026-10-12',
      '2026-10-14',
      [
        {
          id: '1',
          tripId: 'trip-1',
          dayIndex: 0,
          order: 0,
          title: 'Bills',
          cost: 25,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: '2',
          tripId: 'trip-1',
          dayIndex: 0,
          order: 1,
          title: 'Shrine',
          cost: 0,
          createdAt: '',
          updatedAt: '',
        },
      ],
      'USD'
    );

    expect(days).toHaveLength(3);
    expect(days[0].dayIndex).toBe(0);
    expect(days[0].estimatedCost).toBe(25);
    expect(days[0].eventCount).toBe(2);
    expect(days[1].eventCount).toBe(0);
  });

  it('getCoordinatesDistanceKm returns distance in km', () => {
    const dist = getCoordinatesDistanceKm(35.6672, 139.7061, 35.6764, 139.6993);
    expect(dist).toBeGreaterThan(0.5);
    expect(dist).toBeLessThan(3.0);
  });

  it('formatTimeWithPeriod formats 24h into AM/PM', () => {
    expect(formatTimeWithPeriod('08:30')).toEqual({ time: '08:30', period: 'AM' });
    expect(formatTimeWithPeriod('17:15')).toEqual({ time: '05:15', period: 'PM' });
    expect(formatTimeWithPeriod('12:00')).toEqual({ time: '12:00', period: 'PM' });
  });
});
