import { baseApi } from './baseApi';
import type { ChecklistItem } from '@shared/types/models';

/** Cache tag scoping all checklist queries that belong to a single trip. */
export const checklistTripTag = (tripId: string) => ({
  type: 'Checklist' as const,
  id: `TRIP_${tripId}`,
});

export const checklistsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Retrieves all checklists across all trips.
     */
    getChecklists: builder.query<ChecklistItem[], void>({
      query: () => 'checklists',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Checklist' as const, id })),
              ...Array.from(new Set(result.map((i) => i.tripId))).map(checklistTripTag),
              { type: 'Checklist', id: 'LIST' },
            ]
          : [{ type: 'Checklist', id: 'LIST' }],
    }),

    /**
     * Retrieves all checklist tasks and luggage items for a trip.
     */
    getChecklistsByTripId: builder.query<ChecklistItem[], string>({
      query: (tripId) => ({ url: 'checklists', params: { tripId } }),
      providesTags: (result, _error, tripId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Checklist' as const, id })),
              checklistTripTag(tripId),
            ]
          : [checklistTripTag(tripId)],
    }),

    /**
     * Adds an item to a trip's checklist.
     */
    createChecklistItem: builder.mutation<
      ChecklistItem,
      Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>
    >({
      query: (body) => ({
        url: 'checklists',
        method: 'POST',
        body: {
          ...body,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
      invalidatesTags: (_result, _error, { tripId }) => [
        checklistTripTag(tripId),
        { type: 'Checklist', id: 'LIST' },
      ],
    }),

    /**
     * Updates completion status or details of a checklist item with optimistic UI update.
     *
     * The optimistic cache patch already reflects the final state, so a successful
     * update does not trigger a refetch (which could overwrite newer optimistic state
     * on slow connections). On failure the optimistic patches are rolled back.
     */
    updateChecklistItem: builder.mutation<
      ChecklistItem,
      { id: string; tripId?: string; payload: Partial<ChecklistItem> }
    >({
      query: ({ id, payload }) => ({
        url: `checklists/${id}`,
        method: 'PATCH',
        body: {
          ...payload,
          updatedAt: new Date().toISOString(),
        },
      }),
      async onQueryStarted({ id, tripId, payload }, { dispatch, queryFulfilled }) {
        const patches = [
          dispatch(
            checklistsApi.util.updateQueryData('getChecklists', undefined, (draft) => {
              const item = draft.find((i) => i.id === id);
              if (item) Object.assign(item, payload);
            })
          ),
        ];
        if (tripId) {
          patches.push(
            dispatch(
              checklistsApi.util.updateQueryData('getChecklistsByTripId', tripId, (draft) => {
                const item = draft.find((i) => i.id === id);
                if (item) Object.assign(item, payload);
              })
            )
          );
        }
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      // Intentionally no invalidatesTags: see the doc comment above.
    }),

    /**
     * Removes an item from the checklist.
     */
    deleteChecklistItem: builder.mutation<void, { id: string; tripId: string }>({
      query: ({ id }) => ({
        url: `checklists/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { id, tripId }) => [
        { type: 'Checklist', id },
        checklistTripTag(tripId),
        { type: 'Checklist', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetChecklistsQuery,
  useGetChecklistsByTripIdQuery,
  useLazyGetChecklistsByTripIdQuery,
  useCreateChecklistItemMutation,
  useUpdateChecklistItemMutation,
  useDeleteChecklistItemMutation,
} = checklistsApi;
