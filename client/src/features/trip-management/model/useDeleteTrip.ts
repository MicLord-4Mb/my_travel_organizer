import { useCallback, useState } from 'react';
import { useDeleteTripMutation } from '@shared/api/apiSlice';

/**
 * Deletes a trip with its dependent data (events, expenses, checklists).
 *
 * Children are removed before the parent inside the API layer and failures are
 * propagated, so callers should `await` the returned function inside `try/catch`.
 */
export function useDeleteTrip() {
  const [deleteTripMutation] = useDeleteTripMutation();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteTrip = useCallback(
    async (tripId: string): Promise<void> => {
      setIsDeleting(true);
      try {
        await deleteTripMutation(tripId).unwrap();
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteTripMutation]
  );

  return { deleteTrip, isDeleting };
}

