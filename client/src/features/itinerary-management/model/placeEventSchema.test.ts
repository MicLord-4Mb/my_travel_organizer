import { describe, it, expect } from 'vitest';
import { placeEventSchema, type PlaceEventFormData } from './placeEventSchema';

describe('placeEventSchema validation', () => {
  const validEvent: PlaceEventFormData = {
    title: 'Fushimi Inari Taisha',
    category: 'activities',
    dayIndex: 0,
    startTime: '09:00',
    endTime: '11:30',
    cost: 0,
    currency: 'USD',
    locationName: 'Fushimi Ward, Kyoto',
    address: '68 Fukakusa Yabunouchicho',
    lat: 34.9671,
    lng: 135.7727,
    notes: 'Hike through thousands of torii gates',
    bookingRef: 'REF-789',
  };

  it('validates a complete and correct place event payload', () => {
    const result = placeEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  describe('title validation', () => {
    it('fails when title is shorter than 2 characters', () => {
      const result = placeEventSchema.safeParse({ ...validEvent, title: 'A' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title must be at least 2 characters');
      }
    });

    it('fails when title exceeds 100 characters', () => {
      const result = placeEventSchema.safeParse({
        ...validEvent,
        title: 'T'.repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is too long (max 100 characters)');
      }
    });
  });

  describe('dayIndex validation', () => {
    it('rejects negative day indices', () => {
      const result = placeEventSchema.safeParse({ ...validEvent, dayIndex: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Day index must be 0 or greater');
      }
    });

    it('coerces string numbers to integers', () => {
      const result = placeEventSchema.safeParse({ ...validEvent, dayIndex: '2' as any });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dayIndex).toBe(2);
      }
    });
  });

  describe('time formats and temporal order refinement', () => {
    it('accepts valid 24h military time format HH:mm', () => {
      const result = placeEventSchema.safeParse({
        ...validEvent,
        startTime: '14:30',
        endTime: '16:00',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid time string formats', () => {
      const singleDigit = placeEventSchema.safeParse({
        ...validEvent,
        startTime: '9:00',
      });
      expect(singleDigit.success).toBe(false);

      const hourOverflow = placeEventSchema.safeParse({
        ...validEvent,
        startTime: '25:00',
      });
      expect(hourOverflow.success).toBe(false);
    });

    it('fails when endTime is earlier than or equal to startTime', () => {
      const earlierEnd = placeEventSchema.safeParse({
        ...validEvent,
        startTime: '14:00',
        endTime: '12:00',
      });
      expect(earlierEnd.success).toBe(false);
      if (!earlierEnd.success) {
        const issue = earlierEnd.error.issues.find((i) => i.path.includes('endTime'));
        expect(issue?.message).toBe('End time must be after start time');
      }

      const equalTime = placeEventSchema.safeParse({
        ...validEvent,
        startTime: '14:00',
        endTime: '14:00',
      });
      expect(equalTime.success).toBe(false);
    });

    it('permits empty strings or missing values for start and end times', () => {
      const emptyTimes = placeEventSchema.safeParse({
        ...validEvent,
        startTime: '',
        endTime: '',
      });
      expect(emptyTimes.success).toBe(true);

      const undefinedTimes = placeEventSchema.safeParse({
        ...validEvent,
        startTime: undefined,
        endTime: undefined,
      });
      expect(undefinedTimes.success).toBe(true);
    });
  });

  describe('coordinates and cost preprocessing', () => {
    it('coerces empty string or null for lat/lng to undefined', () => {
      const result = placeEventSchema.safeParse({
        ...validEvent,
        lat: '' as any,
        lng: null as any,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lat).toBeUndefined();
        expect(result.data.lng).toBeUndefined();
      }
    });

    it('rejects negative cost', () => {
      const result = placeEventSchema.safeParse({
        ...validEvent,
        cost: -50,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Cost cannot be negative');
      }
    });
  });
});
