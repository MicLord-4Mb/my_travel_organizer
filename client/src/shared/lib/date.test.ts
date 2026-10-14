import { describe, it, expect } from 'vitest';
import {
  parseLocalDate,
  toDateInputValue,
  startOfLocalDay,
  diffInDays,
  inclusiveDayCount,
  formatLocalDate,
  addDaysLocalDate,
} from './date';

describe('date library utilities', () => {
  describe('parseLocalDate', () => {
    it('parses valid YYYY-MM-DD date string at local midnight', () => {
      const parsed = parseLocalDate('2026-10-15');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getFullYear()).toBe(2026);
      expect(parsed?.getMonth()).toBe(9); // October (0-indexed)
      expect(parsed?.getDate()).toBe(15);
      expect(parsed?.getHours()).toBe(0);
      expect(parsed?.getMinutes()).toBe(0);
      expect(parsed?.getSeconds()).toBe(0);
    });

    it('extracts date component correctly from ISO timestamp strings', () => {
      const parsed = parseLocalDate('2026-10-15T18:30:00Z');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getFullYear()).toBe(2026);
      expect(parsed?.getMonth()).toBe(9);
      expect(parsed?.getDate()).toBe(15);
    });

    it('returns null for null, undefined, or empty string input', () => {
      expect(parseLocalDate(null)).toBeNull();
      expect(parseLocalDate(undefined)).toBeNull();
      expect(parseLocalDate('')).toBeNull();
    });

    it('returns null for malformed date strings', () => {
      expect(parseLocalDate('invalid-date')).toBeNull();
      expect(parseLocalDate('2026-10')).toBeNull();
      expect(parseLocalDate('2026-Oct-15')).toBeNull();
      expect(parseLocalDate('random')).toBeNull();
    });

    it('returns null for overflowing calendar dates', () => {
      // February 31st does not exist
      expect(parseLocalDate('2026-02-31')).toBeNull();
      // April 31st does not exist
      expect(parseLocalDate('2026-04-31')).toBeNull();
      // 2025 is not a leap year, Feb 29 does not exist
      expect(parseLocalDate('2025-02-29')).toBeNull();
    });

    it('correctly accepts leap year date 2024-02-29', () => {
      const parsed = parseLocalDate('2024-02-29');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getFullYear()).toBe(2024);
      expect(parsed?.getMonth()).toBe(1); // February
      expect(parsed?.getDate()).toBe(29);
    });
  });

  describe('toDateInputValue', () => {
    it('formats single-digit months and days with leading zeros', () => {
      const date = new Date(2026, 4, 8); // May 8, 2026
      expect(toDateInputValue(date)).toBe('2026-05-08');
    });

    it('formats two-digit months and days correctly', () => {
      const date = new Date(2026, 11, 31); // Dec 31, 2026
      expect(toDateInputValue(date)).toBe('2026-12-31');
    });

    it('acts as the exact inverse of parseLocalDate for valid dates', () => {
      const dateStr = '2026-08-25';
      const parsed = parseLocalDate(dateStr);
      expect(parsed).not.toBeNull();
      expect(toDateInputValue(parsed!)).toBe(dateStr);
    });
  });

  describe('startOfLocalDay', () => {
    it('normalizes time components to 00:00:00.000', () => {
      const dateWithTime = new Date(2026, 9, 14, 15, 45, 30, 500);
      const normalized = startOfLocalDay(dateWithTime);

      expect(normalized.getFullYear()).toBe(2026);
      expect(normalized.getMonth()).toBe(9);
      expect(normalized.getDate()).toBe(14);
      expect(normalized.getHours()).toBe(0);
      expect(normalized.getMinutes()).toBe(0);
      expect(normalized.getSeconds()).toBe(0);
      expect(normalized.getMilliseconds()).toBe(0);
    });
  });

  describe('diffInDays', () => {
    it('returns positive day count when end date is in the future', () => {
      const from = new Date(2026, 9, 1);
      const to = new Date(2026, 9, 6);
      expect(diffInDays(from, to)).toBe(5);
    });

    it('returns negative day count when end date is in the past', () => {
      const from = new Date(2026, 9, 6);
      const to = new Date(2026, 9, 1);
      expect(diffInDays(from, to)).toBe(-5);
    });

    it('returns 0 when comparing dates on the same calendar day regardless of time of day', () => {
      const morning = new Date(2026, 9, 1, 8, 0, 0);
      const evening = new Date(2026, 9, 1, 22, 0, 0);
      expect(diffInDays(morning, evening)).toBe(0);
    });

    it('calculates difference across month boundaries accurately', () => {
      const oct31 = new Date(2026, 9, 31);
      const nov2 = new Date(2026, 10, 2);
      expect(diffInDays(oct31, nov2)).toBe(2);
    });

    it('calculates difference across year boundaries accurately', () => {
      const dec30 = new Date(2026, 11, 30);
      const jan2 = new Date(2027, 0, 2);
      expect(diffInDays(dec30, jan2)).toBe(3);
    });
  });

  describe('inclusiveDayCount', () => {
    it('returns 1 for single-day trips where start and end date are identical', () => {
      expect(inclusiveDayCount('2026-10-10', '2026-10-10')).toBe(1);
    });

    it('returns total inclusive day count for multi-day trips', () => {
      // Oct 10, 11, 12, 13, 14 = 5 days
      expect(inclusiveDayCount('2026-10-10', '2026-10-14')).toBe(5);
    });

    it('returns 0 if start date or end date is invalid', () => {
      expect(inclusiveDayCount('invalid', '2026-10-14')).toBe(0);
      expect(inclusiveDayCount('2026-10-10', '')).toBe(0);
      expect(inclusiveDayCount('2026-02-31', '2026-03-05')).toBe(0);
    });

    it('returns 0 if end date precedes start date', () => {
      expect(inclusiveDayCount('2026-10-15', '2026-10-10')).toBe(0);
    });
  });

  describe('addDaysLocalDate', () => {
    it('adds days correctly within the same month', () => {
      const start = new Date(2026, 9, 5);
      const result = addDaysLocalDate(start, 5);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(9);
      expect(result.getDate()).toBe(10);
      expect(result.getHours()).toBe(0);
    });

    it('advances across month boundaries', () => {
      const oct30 = new Date(2026, 9, 30);
      const result = addDaysLocalDate(oct30, 3);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(10); // November
      expect(result.getDate()).toBe(2);
    });

    it('subtracts days when given negative number', () => {
      const nov2 = new Date(2026, 10, 2);
      const result = addDaysLocalDate(nov2, -3);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(9); // October
      expect(result.getDate()).toBe(30);
    });
  });

  describe('formatLocalDate', () => {
    it('formats date using Intl options', () => {
      const date = new Date(2026, 9, 15);
      const formatted = formatLocalDate(date, { month: 'short', day: 'numeric', year: 'numeric' });
      expect(formatted).toContain('2026');
      expect(formatted).toContain('15');
    });
  });
});
