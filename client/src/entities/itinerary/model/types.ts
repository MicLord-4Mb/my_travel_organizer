import type { EntityId } from '@shared/types/models';

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
