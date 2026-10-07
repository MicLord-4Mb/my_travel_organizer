import type { PlaceEvent } from '@shared/types/models';
import type { DayInfo } from '@entities/itinerary';
import { sumInCurrency, sumInCurrencyWithRates } from '@shared/lib/currency';
import { inclusiveDayCount, parseLocalDate, toDateInputValue } from '@shared/lib/date';

/**
 * Calculates day metadata, date formatting, and aggregated event costs for each day of a trip.
 *
 * Traverses every calendar day from `startDateStr` to `endDateStr`, matches events scheduled
 * on each day index, sorts them in display order, calculates total estimated cost in the target currency,
 * and sets an intelligent display title (deriving from the first scheduled place event).
 *
 * @param {string} startDateStr - Start date in YYYY-MM-DD format.
 * @param {string} endDateStr - End date in YYYY-MM-DD format.
 * @param {PlaceEvent[]} events - All place events for this trip.
 * @param {string} [currency='USD'] - Target currency for estimating day budget sum.
 * @param {Record<string, number>} [rates] - Live exchange rates relative to `baseCurrency`.
 * @param {string} [baseCurrency='USD'] - Base currency of exchange rates.
 * @returns {DayInfo[]} Array of day models representing each timeline day in the workspace.
 *
 * @example
 * const days = calculateTripDays('2026-10-12', '2026-10-15', tripEvents, 'EUR', rates, 'USD');
 */
export function calculateTripDays(
  startDateStr: string,
  endDateStr: string,
  events: PlaceEvent[],
  currency: string = 'USD',
  rates?: Record<string, number>,
  baseCurrency?: string
): DayInfo[] {
  const start = parseLocalDate(startDateStr);
  const totalDaysCount = inclusiveDayCount(startDateStr, endDateStr);
  if (!start || totalDaysCount === 0) return [];

  const days: DayInfo[] = [];

  for (let i = 0; i < totalDaysCount; i++) {
    const current = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dateStr = toDateInputValue(current);

    const dateLabel = current
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      .toUpperCase();
    const dayOfWeek = current.toLocaleDateString('en-US', { weekday: 'long' });
    const fullLabel = `${dayOfWeek}, ${current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    const dayEvents = events
      .filter((e) => e.dayIndex === i)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const entries = dayEvents.map((e) => ({ amount: e.cost, currency: e.currency }));
    const estimatedCost = rates
      ? sumInCurrencyWithRates(entries, currency, rates, baseCurrency)
      : sumInCurrency(entries, currency);

    // Title comes from the day's first stop, otherwise fallback to "Day N"
    const title = dayEvents.length > 0 ? dayEvents[0].title : `Day ${i + 1}`;

    days.push({
      dayIndex: i,
      dateStr,
      dateLabel,
      dayOfWeek,
      fullLabel,
      title,
      estimatedCost,
      currency,
      eventCount: dayEvents.length,
    });
  }

  return days;
}

/**
 * Calculates the great-circle geographic distance between two sets of GPS coordinates using the Haversine formula.
 *
 * Returns `null` if any coordinate is missing or undefined (signifying distance is unknown, rather than 0).
 * Results are rounded to one decimal place in kilometers (km).
 *
 * @param {number} [lat1] - Latitude of origin point (-90 to 90).
 * @param {number} [lon1] - Longitude of origin point (-180 to 180).
 * @param {number} [lat2] - Latitude of destination point (-90 to 90).
 * @param {number} [lon2] - Longitude of destination point (-180 to 180).
 * @returns {number | null} Distance in kilometers rounded to 1 decimal place, or `null`.
 *
 * @example
 * const distKm = getCoordinatesDistanceKm(35.6672, 139.7061, 35.6764, 139.6993);
 * // returns ~1.2
 */
export function getCoordinatesDistanceKm(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number | null {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Formats a 24-hour military time string (e.g., "17:15" or "08:30") into a 12-hour civil time
 * with AM/PM indicator period separation for refined typographic rendering.
 *
 * @param {string} [timeStr] - Time string in 24h format (HH:mm).
 * @returns {{ time: string; period: string }} Split object with formatted 12h time and period ("AM"/"PM").
 *
 * @example
 * formatTimeWithPeriod("17:15"); // { time: "05:15", period: "PM" }
 * formatTimeWithPeriod("08:30"); // { time: "08:30", period: "AM" }
 */
export function formatTimeWithPeriod(timeStr?: string): { time: string; period: string } {
  if (!timeStr) return { time: '--:--', period: '' };
  const parts = timeStr.split(':');
  if (parts.length < 2) return { time: timeStr, period: '' };

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const period = hours >= 12 ? 'PM' : 'AM';

  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  return { time: `${formattedHours}:${minutes}`, period };
}
