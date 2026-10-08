/**
 * Calendar-Date Utilities.
 *
 * Trip dates in WanderFlow are plain `YYYY-MM-DD` calendar dates without timezone offsets.
 * Standard `new Date('YYYY-MM-DD')` parses as UTC midnight, which shifts to the preceding day
 * in time zones west of UTC. This module guarantees DST-safe, local midnight calculations.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Parses a `YYYY-MM-DD` string into a Date at local midnight.
 * Validates against calendar overflow (e.g. 2026-02-31 returns null).
 *
 * @param {string | undefined | null} value - Date string in YYYY-MM-DD format.
 * @returns {Date | null} Parsed Date object at local midnight, or `null` if invalid.
 *
 * @example
 * parseLocalDate('2026-10-12'); // Date representing Oct 12, 2026 00:00:00 local time
 * parseLocalDate('invalid'); // null
 */
export function parseLocalDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  
  const datePart = value.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length < 3) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const date = new Date(year, month - 1, day);
  // Reject overflowing dates such as 2026-02-31
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/**
 * Formats a Date object into an HTML date input compatible `YYYY-MM-DD` string.
 * This is the exact inverse of `parseLocalDate`.
 *
 * @param {Date} date - The date to format.
 * @returns {string} String in `YYYY-MM-DD` format.
 */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes a Date to 00:00:00.000 in the local time zone.
 *
 * @param {Date} date - Source date.
 * @returns {Date} Normalized date at local start-of-day.
 */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Calculates the whole calendar day difference between two dates (`to - from`).
 * Safe against daylight saving time (DST) transitions.
 *
 * @param {Date} from - Starting date.
 * @param {Date} to - Ending date.
 * @returns {number} Signed count of days (positive if `to` is in the future).
 */
export function diffInDays(from: Date, to: Date): number {
  return Math.round((startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime()) / MS_PER_DAY);
}

/**
 * Computes the total inclusive number of calendar days a trip spans.
 * Both the departure day and return day are counted.
 *
 * @param {string} startDate - Trip start date (YYYY-MM-DD).
 * @param {string} endDate - Trip end date (YYYY-MM-DD).
 * @returns {number} Inclusive days count (>= 1 for valid ranges, 0 if invalid).
 *
 * @example
 * inclusiveDayCount('2026-10-01', '2026-10-03'); // 3 days
 */
export function inclusiveDayCount(startDate: string, endDate: string): number {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end) return 0;
  return Math.max(0, diffInDays(start, end) + 1);
}

/**
 * Formats a Date object for display according to local timezone and options.
 *
 * @param {Date} date - The date to format.
 * @param {Intl.DateTimeFormatOptions} options - Formatting options.
 * @returns {string} Formatted string.
 */
export function formatLocalDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString(undefined, options);
}

/**
 * Safely adds a given number of days to a Date object, preventing DST issues.
 *
 * @param {Date} date - Starting date.
 * @param {number} days - Number of days to add.
 * @returns {Date} Resulting date at local midnight.
 */
export function addDaysLocalDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return startOfLocalDay(result);
}
