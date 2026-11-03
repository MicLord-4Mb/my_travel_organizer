import type { Trip } from '@shared/types/models';
import { calculateTripStatus } from '@shared/lib/date';
import type { TripFormData } from './tripSchema';

/**
 * Persistable trip fields produced from the trip form.
 * `budgetLimit: null` explicitly clears a previously stored limit.
 */
export type TripFormPayload = Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'budgetLimit'> & {
  budgetLimit: number | null;
};

/**
 * Maps validated form data to the persisted trip shape.
 *
 * - `status` is derived from the dates; `cancelled` is the only manual override.
 * - An empty budget field means "no limit" (`null`), never an arbitrary default.
 */
export function toTripPayload(data: TripFormData, today: Date = new Date()): TripFormPayload {
  const { isCancelled, budgetLimit, ...rest } = data;
  return {
    ...rest,
    status: calculateTripStatus(
      { startDate: data.startDate, endDate: data.endDate, status: isCancelled ? 'cancelled' : 'planned' },
      today
    ),
    budgetLimit: budgetLimit ?? null,
  };
}

