import type { EntityId, PlaceEvent } from '@shared/types/models';

export type ItineraryCategoryFilter = 'all' | 'food' | 'spots' | 'transit' | 'lodging';

export type TransitMode = 'walk' | 'transit';

export interface DayInfo {
  dayIndex: number;
  dateStr: string;      // e.g. "2026-10-13"
  dateLabel: string;    // e.g. "OCT 13"
  dayOfWeek: string;    // e.g. "Tuesday"
  fullLabel: string;    // e.g. "Tuesday, Oct 13"
  title: string;        // e.g. "Meiji Shrine & Shibuya"
  estimatedCost: number;
  currency: string;
  eventCount: number;
}

export interface TransitLeg {
  fromEventId: EntityId;
  toEventId: EntityId;
  durationMinutes: number;
  distanceKm: number;
  mode: 'walk' | 'transit';
  description: string;
}

/**
 * Calculated travel estimate between two consecutive stops.
 */
export interface TransitEstimate {
  distanceKm: number | null;
  durationMinutes: number;
  isTransit: boolean;
  label: string;
}

/**
 * Represents the morning tail of an overnight event that started on the previous day
 * and finished after midnight (Carry-Over mechanics).
 */
export interface CarryOverStop {
  /** Source event from the previous day that spilled past 24:00 */
  sourceEvent: PlaceEvent;
  /** Zero-based day index where the event started */
  sourceDayIndex: number;
  /** Minute of the current day (0..1440+) when this overnight activity finishes */
  endMinutes: number;
  /** Formatted 24h finish time in the current day (e.g. "06:30") */
  endTime: string;
  /** Calculated transit leg from this overnight location to the first stop of the current day */
  transitToFirstStop: TransitEstimate | null;
}

/**
 * An itinerary stop enriched with cascaded arrival/departure times and transit metadata.
 */
export interface ScheduledPlaceEvent extends PlaceEvent {
  /** User-configured stay duration at this stop in minutes */
  durationMinutes: number;
  /** Calculated arrival time in minutes from 00:00 of the current day */
  arrivalMinutes: number;
  /** Calculated departure time in minutes from 00:00 of the current day */
  departureMinutes: number;
  /** Calculated 24h arrival time string (HH:mm) */
  computedStartTime: string;
  /** Calculated 24h departure time string (HH:mm) */
  computedEndTime: string;
  /** True when departureMinutes > 1440 (spills over past midnight into the next day) */
  isOvernightSpillover: boolean;
  /** Number of calendar days crossed by departure (0 = same day, 1 = next day) */
  endDayOffset: number;
  /** True if this stop finishes after the day's user-configured target end time */
  exceedsTargetEnd: boolean;
  /** Calculated transit segment from this stop to the next stop in the same day */
  nextTransit: TransitEstimate | null;
}

/**
 * Full cascaded timeline calculation result for a single trip day.
 */
export interface ComputedDaySchedule {
  dayIndex: number;
  /** User-configured start time string (default '08:00') */
  plannedStartTime: string;
  /** User-configured target end time string (default '22:00') */
  plannedEndTime: string;
  /** Effective start time in minutes (shifted later if carryOver ends after plannedStartTime) */
  effectiveStartMinutes: number;
  /** Effective start time in 24h HH:mm format */
  effectiveStartTime: string;
  /** True when carryOver from previous night pushed the start of this day past plannedStartTime */
  isStartShiftedByCarryOver: boolean;
  /** Overnight carry-over tail from the previous day, if any */
  carryOver: CarryOverStop | null;
  /** Ordered stops of the day with cascaded arrival/departure times and transit legs */
  events: ScheduledPlaceEvent[];
  /** Minute of day when the last stop finishes (null if day has no stops and no carry-over) */
  finishMinutes: number | null;
  /** Formatted 24h finish time string */
  finishTime: string | null;
  /** True if finishMinutes exceeds plannedEndTime */
  isOverTargetEnd: boolean;
  /** Minutes by which finishMinutes exceeds plannedEndTime (0 if within bounds) */
  overrunMinutes: number;
}

/**
 * Geographic pin projected onto the 2D route map viewport.
 */
export interface ProjectedMapMarker {
  event: PlaceEvent;
  /** 1-based sequence number in the day's route (0 for carry-over origin pin) */
  index: number;
  topPercent: number;
  leftPercent: number;
  hasCoordinates: boolean;
  isCarryOverOrigin?: boolean;
}
