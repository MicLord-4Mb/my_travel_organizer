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
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  // Reject overflowing dates such as 2026-02-31
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
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
