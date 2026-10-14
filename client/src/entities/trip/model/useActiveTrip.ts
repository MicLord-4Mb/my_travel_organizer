import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useGetTripsQuery } from '@shared/api/apiSlice';
import type { Trip } from '@shared/types/models';

/**
 * Resolution status of the active trip.
 */
export type ActiveTripStatus = 'loading' | 'ready' | 'not_found' | 'no_trips';

/**
 * Return signature of the `useActiveTrip` hook.
 */
export interface UseActiveTripResult {
  /** Resolved active trip entity or null when unresolved/loading */
  activeTrip: Trip | null;
  /** Granular loading and presence state */
  status: ActiveTripStatus;
  /** Complete list of trips returned from store */
  allTrips: Trip[];
  /** True when initial query or background refresh is active */
  isLoading: boolean;
  /** True when the API call failed */
  isError: boolean;
  /** Refetches trips from API */
  refetch: () => void;
}

/**
 * Centralized hook to resolve the active trip across detail, budget, and checklist views.
 *
 * Guarantees zero-flicker loading states by preventing premature 'not_found' or 'no_trips'
 * renders while the initial trips query is in-flight.
 *
 * @param explicitTripId - Optional override ID (e.g. from a local dropdown selector).
 * Defaults to reading `:id` from the current router params.
 */
export function useActiveTrip(explicitTripId?: string | null): UseActiveTripResult {
  const { id: routeTripId } = useParams<{ id: string }>();
  const { data: trips = [], isLoading, isFetching, isError, refetch } = useGetTripsQuery();

  const targetId = explicitTripId ?? routeTripId;

  const { activeTrip, status } = useMemo(() => {
    if (isLoading) {
      return { activeTrip: null, status: 'loading' as const };
    }

    if (!trips.length) {
      return { activeTrip: null, status: 'no_trips' as const };
    }

    if (targetId) {
      const found = trips.find((t) => t.id === targetId);
      if (!found) {
        return { activeTrip: null, status: 'not_found' as const };
      }
      return { activeTrip: found, status: 'ready' as const };
    }

    // Default to the first trip if no ID is specified in the route
    return { activeTrip: trips[0], status: 'ready' as const };
  }, [trips, isLoading, targetId]);

  return {
    activeTrip,
    status,
    allTrips: trips,
    isLoading: isLoading || isFetching,
    isError,
    refetch,
  };
}
