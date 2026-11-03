import { useCallback } from 'react';
import {
  useCreateTripMutation,
  useDeleteTripMutation,
  useLazyGetEventsByTripIdQuery,
  useLazyGetChecklistsByTripIdQuery,
  useCreateEventMutation,
  useCreateChecklistItemMutation,
} from '@shared/api/apiSlice';
import type { Trip } from '@shared/types/models';
import { calculateTripStatus } from '@shared/lib/date';

/**
 * Duplicates a trip together with its itinerary events and checklist items.
 *
 * The operation is compensating-transactional:
 * 1. Source events and checklists are read **before** anything is written.
 * 2. The new parent trip is created.
 * 3. Children are cloned; if any clone fails the freshly created trip (and any children
 *    already cloned) is removed again, so no orphaned half-copy remains.
 *
 * Expenses are intentionally not copied: they describe money actually spent on the source trip.
 *
 * @returns A `duplicateTrip(trip)` function resolving to the created trip, rejecting on failure.
 */
export function useDuplicateTrip() {
  const [createTrip] = useCreateTripMutation();
  const [deleteTrip] = useDeleteTripMutation();
  const [fetchEvents] = useLazyGetEventsByTripIdQuery();
  const [fetchChecklists] = useLazyGetChecklistsByTripIdQuery();
  const [createEvent] = useCreateEventMutation();
  const [createChecklistItem] = useCreateChecklistItemMutation();

  return useCallback(
    async (source: Trip): Promise<Trip> => {
      const [sourceEvents, sourceChecklists] = await Promise.all([
        fetchEvents(source.id, true).unwrap(),
        fetchChecklists(source.id, true).unwrap(),
      ]);

      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = source;
      const status = calculateTripStatus({ ...rest, status: 'planned' });
      const createdTrip = await createTrip({
        ...rest,
        status,
        title: `${rest.title} (Copy)`,
      }).unwrap();

      try {
        await Promise.all([
          ...sourceChecklists.map((item) =>
            createChecklistItem({
              tripId: createdTrip.id,
              title: item.title,
              type: item.type,
              category: item.category,
              priority: item.priority,
              quantity: item.quantity,
              assignedDayIndex: item.assignedDayIndex,
              isCompleted: false,
            }).unwrap()
          ),
          ...sourceEvents.map((evt) =>
            createEvent({
              tripId: createdTrip.id,
              dayIndex: evt.dayIndex,
              order: evt.order,
              title: evt.title,
              category: evt.category,
              startTime: evt.startTime,
              endTime: evt.endTime,
              cost: evt.cost,
              currency: evt.currency,
              location: evt.location,
              notes: evt.notes,
              bookingRef: evt.bookingRef,
            }).unwrap()
          ),
        ]);
      } catch (error) {
        // Compensating rollback: remove the new trip and every child cloned so far.
        try {
          await deleteTrip(createdTrip.id).unwrap();
        } catch {
          // Best effort: the original cloning error is the one worth reporting.
        }
        throw error;
      }

      return createdTrip;
    },
    [fetchEvents, fetchChecklists, createTrip, deleteTrip, createEvent, createChecklistItem]
  );
}
