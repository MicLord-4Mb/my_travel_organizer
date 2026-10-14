import { describe, it, expect } from 'vitest';
import { tripSchema, type TripFormData } from './tripSchema';

describe('tripSchema validation', () => {
  const validTrip: TripFormData = {
    title: 'Autumn in Kyoto',
    location: 'Kyoto, Japan',
    startDate: '2026-10-15',
    endDate: '2026-10-25',
    status: 'planned',
    budgetLimit: 3000,
    currency: 'USD',
    coverImageUrl: 'https://images.unsplash.com/photo-kyoto',
    description: 'Visiting shrines and gardens',
  };

  it('validates a complete and correct trip object successfully', () => {
    const result = tripSchema.safeParse(validTrip);
    expect(result.success).toBe(true);
  });

  describe('title validation', () => {
    it('fails when title is empty or only whitespace', () => {
      const result = tripSchema.safeParse({ ...validTrip, title: '   ' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/Title/);
      }
    });

    it('fails when title is fewer than 2 characters', () => {
      const result = tripSchema.safeParse({ ...validTrip, title: 'A' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title must be at least 2 characters');
      }
    });

    it('fails when title exceeds 80 characters', () => {
      const result = tripSchema.safeParse({
        ...validTrip,
        title: 'A'.repeat(81),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is too long');
      }
    });
  });

  describe('location validation', () => {
    it('fails when location is less than 2 characters', () => {
      const result = tripSchema.safeParse({ ...validTrip, location: 'J' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Location is required');
      }
    });
  });

  describe('date range validation and refinement', () => {
    it('allows identical start and end dates for single-day trips', () => {
      const result = tripSchema.safeParse({
        ...validTrip,
        startDate: '2026-10-20',
        endDate: '2026-10-20',
      });
      expect(result.success).toBe(true);
    });

    it('rejects end dates that fall before the start date', () => {
      const result = tripSchema.safeParse({
        ...validTrip,
        startDate: '2026-10-20',
        endDate: '2026-10-18',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('endDate'));
        expect(issue?.message).toBe('End date must be on or after start date');
      }
    });
  });

  describe('budgetLimit preprocessing and bounds', () => {
    it('coerces string representations of numbers to numeric values', () => {
      const result = tripSchema.safeParse({
        ...validTrip,
        budgetLimit: '2500' as any,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.budgetLimit).toBe(2500);
      }
    });

    it('coerces empty string, null, or undefined to undefined', () => {
      const withEmptyStr = tripSchema.safeParse({ ...validTrip, budgetLimit: '' as any });
      expect(withEmptyStr.success).toBe(true);
      if (withEmptyStr.success) {
        expect(withEmptyStr.data.budgetLimit).toBeUndefined();
      }

      const withNull = tripSchema.safeParse({ ...validTrip, budgetLimit: null as any });
      expect(withNull.success).toBe(true);
      if (withNull.success) {
        expect(withNull.data.budgetLimit).toBeUndefined();
      }
    });

    it('rejects negative budget numbers', () => {
      const result = tripSchema.safeParse({ ...validTrip, budgetLimit: -100 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Budget must be a non-negative number');
      }
    });
  });

  describe('coverImageUrl validation', () => {
    it('accepts valid HTTP/HTTPS URLs', () => {
      const result = tripSchema.safeParse({
        ...validTrip,
        coverImageUrl: 'https://example.com/photo.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty string as valid optional state', () => {
      const result = tripSchema.safeParse({
        ...validTrip,
        coverImageUrl: '',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid URL formats', () => {
      const result = tripSchema.safeParse({
        ...validTrip,
        coverImageUrl: 'not-a-valid-url',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Cover image must be a valid URL');
      }
    });
  });
});
