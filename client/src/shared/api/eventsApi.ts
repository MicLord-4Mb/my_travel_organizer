import { baseApi } from './baseApi';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { PlaceEvent } from '@shared/types/models';

/** Per-trip serialization state for eorderEvents (module scoped, not Redux state). */
const reorderQueue = new Map<string, Promise<void>>();
const latestReorderTicket = new Map<string, number>();
const pendingReorders = new Map<string, number>();

export const eventsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Retrieves all itinerary stops and activities for a given trip.
     */
    getEventsByTripId: builder.query<PlaceEvent[], string>({
      query: (tripId) => ({ url: 'events', params: { tripId } }),
      providesTags: (result, _error, tripId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Event' as const, id })),
              { type: 'Event', id: `TRIP_${tripId}` },
            ]
          : [{ type: 'Event', id: `TRIP_${tripId}` }],
    }),

    /**
     * Adds an itinerary stop to a trip and invalidates event collection.
     */
    createEvent: builder.mutation<PlaceEvent, Omit<PlaceEvent, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (body) => ({
        url: 'events',
        method: 'POST',
        body: {
          ...body,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
      invalidatesTags: (_result, _error, body) => [{ type: 'Event', id: `TRIP_${body.tripId}` }],
    }),

    /**
     * Updates an itinerary stop's schedule, notes, or location coordinates.
     */
    updateEvent: builder.mutation<PlaceEvent, { id: string; payload: Partial<PlaceEvent> }>({
      query: ({ id, payload }) => ({
        url: `events/${id}`,
        method: 'PATCH',
        body: {
          ...payload,
          updatedAt: new Date().toISOString(),
        },
      }),
      invalidatesTags: (result, _error, { id, payload }) => [
        { type: 'Event', id },
        ...(result?.tripId || payload.tripId
          ? [{ type: 'Event' as const, id: `TRIP_${result?.tripId ?? payload.tripId}` }]
          : []),
      ],
    }),

    /**
     * Reorders itinerary events with optimistic UI update and serialized persistence.
     *
     * Reorders for the same trip are queued so their PATCH requests never interleave.
     * If a newer reorder is queued while an older one is still waiting or running, the
     * older request stops early (its work is superseded by the newer full ordering) and
     * the cache is only invalidated once the queue for the trip is empty. This prevents
     * a background refetch from rolling back newer optimistic state.
     */
    reorderEvents: builder.mutation<void, { tripId: string; events: PlaceEvent[] }>({
      queryFn: async ({ tripId, events }, _queryApi, _extraOptions, baseQuery) => {
        const ticket = (latestReorderTicket.get(tripId) ?? 0) + 1;
        latestReorderTicket.set(tripId, ticket);
        pendingReorders.set(tripId, (pendingReorders.get(tripId) ?? 0) + 1);

        const previous = reorderQueue.get(tripId) ?? Promise.resolve();
        const run = previous.then(async (): Promise<{ error?: unknown }> => {
          for (const event of events) {
            // A newer reorder superseded this one: skip the remaining stale writes.
            if (latestReorderTicket.get(tripId) !== ticket) return {};
            const res = await baseQuery({
              url: `events/${event.id}`,
              method: 'PATCH',
              body: {
                order: event.order,
                dayIndex: event.dayIndex,
                updatedAt: new Date().toISOString(),
              },
            });
            if (res.error) return { error: res.error };
          }
          return {};
        });
        reorderQueue.set(
          tripId,
          run.then(
            () => undefined,
            () => undefined
          )
        );

        try {
          const outcome = await run;
          if (outcome.error) return { error: outcome.error as FetchBaseQueryError };
          return { data: undefined };
        } finally {
          pendingReorders.set(tripId, (pendingReorders.get(tripId) ?? 1) - 1);
        }
      },
      async onQueryStarted({ tripId, events }, { dispatch, queryFulfilled }) {
        const orderMap = new Map(events.map((e) => [e.id, e]));
        const patchResult = dispatch(
          eventsApi.util.updateQueryData('getEventsByTripId', tripId, (draft) => {
            for (const item of draft) {
              const next = orderMap.get(item.id);
              if (next) {
                item.order = next.order;
                item.dayIndex = next.dayIndex;
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_result, error, { tripId }) =>
        // Defer revalidation while newer reorders for this trip are still in flight.
        error || (pendingReorders.get(tripId) ?? 0) === 0
          ? [{ type: 'Event', id: `TRIP_${tripId}` }]
          : [],
    }),
    /**
     * Deletes an itinerary event by ID.
     */
    deleteEvent: builder.mutation<void, { id: string; tripId: string }>({
      query: ({ id }) => ({
        url: `events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { id, tripId }) => [
        { type: 'Event', id },
        { type: 'Event', id: `TRIP_${tripId}` },
      ],
    }),
  }),
});

export const {
  useGetEventsByTripIdQuery,
  useLazyGetEventsByTripIdQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useReorderEventsMutation,
  useDeleteEventMutation,
} = eventsApi;
