import { baseApi } from './baseApi';
import type { Trip, PlaceEvent, Expense, ChecklistItem } from '@shared/types/models';
import { calculateTripStatus } from '@shared/lib/date';

/**
 * Applies the calendar-derived status to a trip returned by the API.
 * Only `cancelled` is a persisted manual override; everything else follows the dates.
 */
const withDerivedStatus = (trip: Trip): Trip => ({
  ...trip,
  // json-server stores `null` for a cleared limit; the domain model uses `undefined`
  budgetLimit: trip.budgetLimit ?? undefined,
  status: calculateTripStatus(trip),
});

/**
 * Trip fields accepted by create/update. `budgetLimit: null` clears a stored limit
 * (a plain `undefined` would be dropped from the PATCH body and keep the old value).
 */
export type TripWritePayload = Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'budgetLimit'> & {
  budgetLimit?: number | null;
};

export const tripsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Fetches all trips to populate catalog views and dashboard cards.
     * The `status` field is derived from `startDate` / `endDate` on read.
     */
    getTrips: builder.query<Trip[], void>({
      query: () => 'trips',
      transformResponse: (response: Trip[]) => response.map(withDerivedStatus),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Trip' as const, id })),
              { type: 'Trip', id: 'LIST' },
            ]
          : [{ type: 'Trip', id: 'LIST' }],
    }),

    /**
     * Retrieves detailed trip data for a single trip by ID.
     */
    getTripById: builder.query<Trip, string>({
      query: (id) => `trips/${id}`,
      transformResponse: (response: Trip) => withDerivedStatus(response),
      providesTags: (_result, _error, id) => [{ type: 'Trip', id }],
    }),

    /**
     * Persists a newly created trip and invalidates the trip list cache.
     */
    createTrip: builder.mutation<Trip, TripWritePayload>({
      query: (body) => ({
        url: 'trips',
        method: 'POST',
        body: {
          ...body,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
      invalidatesTags: [{ type: 'Trip', id: 'LIST' }],
    }),

    /**
     * Applies partial updates to an existing trip (e.g. dates, budget, cancellation).
     */
    updateTrip: builder.mutation<Trip, { id: string; payload: Partial<TripWritePayload> }>({
      query: ({ id, payload }) => ({
        url: `trips/${id}`,
        method: 'PATCH',
        body: {
          ...payload,
          updatedAt: new Date().toISOString(),
        },
      }),
      // The list must be refetched too: dates changes alter the derived status and ordering.
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Trip', id },
        { type: 'Trip', id: 'LIST' },
      ],
    }),

    /**
     * Deletes a trip together with all dependent events, expenses and checklist items.
     *
     * Children are removed **before** the parent so that a failure never leaves orphaned
     * records behind a missing trip: if any step fails the trip is kept and the error is
     * propagated to the caller, who can safely retry.
     */
    deleteTrip: builder.mutation<void, string>({
      queryFn: async (id, _queryApi, _extraOptions, baseQuery) => {
        const [eventsRes, expensesRes, checklistsRes] = await Promise.all([
          baseQuery({ url: 'events', params: { tripId: id } }),
          baseQuery({ url: 'expenses', params: { tripId: id } }),
          baseQuery({ url: 'checklists', params: { tripId: id } }),
        ]);

        const lookupError = eventsRes.error ?? expensesRes.error ?? checklistsRes.error;
        if (lookupError) return { error: lookupError };

        const events = Array.isArray(eventsRes.data) ? (eventsRes.data as PlaceEvent[]) : [];
        const expenses = Array.isArray(expensesRes.data) ? (expensesRes.data as Expense[]) : [];
        const checklists = Array.isArray(checklistsRes.data)
          ? (checklistsRes.data as ChecklistItem[])
          : [];

        const childResults = await Promise.all([
          ...events.map((e) => baseQuery({ url: `events/${e.id}`, method: 'DELETE' })),
          ...expenses.map((ex) => baseQuery({ url: `expenses/${ex.id}`, method: 'DELETE' })),
          ...checklists.map((c) => baseQuery({ url: `checklists/${c.id}`, method: 'DELETE' })),
        ]);
        const childError = childResults.find((r) => r.error)?.error;
        if (childError) return { error: childError };

        const deleteRes = await baseQuery({ url: `trips/${id}`, method: 'DELETE' });
        if (deleteRes.error) return { error: deleteRes.error };

        return { data: undefined };
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Trip', id },
        { type: 'Trip', id: 'LIST' },
        { type: 'Event', id: `TRIP_${id}` },
        { type: 'Expense', id: `TRIP_${id}` },
        { type: 'Expense', id: 'LIST' },
        { type: 'Checklist', id: `TRIP_${id}` },
        { type: 'Checklist', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetTripsQuery,
  useGetTripByIdQuery,
  useCreateTripMutation,
  useUpdateTripMutation,
  useDeleteTripMutation,
} = tripsApi;
