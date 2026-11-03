import { baseApi } from './baseApi';
import type { Expense } from '@shared/types/models';

/** Cache tag scoping all expense queries that belong to a single trip. */
export const expenseTripTag = (tripId: string) => ({ type: 'Expense' as const, id: `TRIP_${tripId}` });

export const expensesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Retrieves all expenses across all trips.
     */
    getExpenses: builder.query<Expense[], void>({
      query: () => 'expenses',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Expense' as const, id })),
              ...Array.from(new Set(result.map((e) => e.tripId))).map(expenseTripTag),
              { type: 'Expense', id: 'LIST' },
            ]
          : [{ type: 'Expense', id: 'LIST' }],
    }),

    /**
     * Retrieves financial expense records logged for a specific trip.
     */
    getExpensesByTripId: builder.query<Expense[], string>({
      query: (tripId) => ({ url: 'expenses', params: { tripId } }),
      providesTags: (result, _error, tripId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Expense' as const, id })),
              expenseTripTag(tripId),
            ]
          : [expenseTripTag(tripId)],
    }),

    /**
     * Records a new expense. Only invalidates caches scoped to the owning trip
     * (plus the cross-trip list, which may not contain this trip yet).
     */
    createExpense: builder.mutation<Expense, Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (body) => ({
        url: 'expenses',
        method: 'POST',
        body: {
          ...body,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
      invalidatesTags: (_result, _error, { tripId }) => [
        expenseTripTag(tripId),
        { type: 'Expense', id: 'LIST' },
      ],
    }),

    /**
     * Modifies an expense. Invalidates the owning trip's expense caches only.
     */
    updateExpense: builder.mutation<Expense, { id: string; tripId: string; payload: Partial<Expense> }>({
      query: ({ id, payload }) => ({
        url: `expenses/${id}`,
        method: 'PATCH',
        body: {
          ...payload,
          updatedAt: new Date().toISOString(),
        },
      }),
      invalidatesTags: (_result, _error, { id, tripId }) => [
        { type: 'Expense', id },
        expenseTripTag(tripId),
      ],
    }),

    /**
     * Deletes an expense and refreshes the owning trip's expense caches.
     */
    deleteExpense: builder.mutation<void, { id: string; tripId: string }>({
      query: ({ id }) => ({
        url: `expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { id, tripId }) => [
        { type: 'Expense', id },
        expenseTripTag(tripId),
        { type: 'Expense', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpensesByTripIdQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expensesApi;
