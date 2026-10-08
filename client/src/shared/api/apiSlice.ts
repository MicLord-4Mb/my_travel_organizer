import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Trip, PlaceEvent, Expense, ChecklistItem, Currency, ExchangeRateTable } from '@shared/types/models';

/**
 * Central RTK Query API Slice for WanderFlow.
 *
 * Provides reactive data-fetching hooks, server state caching, and optimistic
 * cache invalidation for trips, daily itinerary events, budget expenses,
 * packing checklists, and global currency exchange rates.
 *
 * Cache Invalidation Strategy:
 * - `Trip`: Invalidated on trip creation, deletion, or modification. Also invalidated
 *   when expenses or checklists change so trip KPIs (e.g. `spentBudget`, `packedCount`) refresh.
 * - `Event`: Scoped to `LIST` or specific event IDs.
 * - `Expense`: Scoped to `LIST` or specific expense IDs.
 * - `Checklist`: Scoped to `LIST` or specific checklist IDs.
 * - `Currency` & `ExchangeRate`: Cached globally for conversion computations.
 */
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/',
  }),
  tagTypes: ['Trip', 'Event', 'Expense', 'Checklist', 'Currency', 'ExchangeRate'],
  endpoints: (builder) => ({
    // ==========================================
    // Currencies and Exchange Rates
    // ==========================================

    /**
     * Retrieves the list of supported world currencies with graphic symbols and names.
     */
    getCurrencies: builder.query<Currency[], void>({
      query: () => 'currencies',
      providesTags: ['Currency'],
    }),

    /**
     * Retrieves current foreign exchange rates relative to the system base currency (e.g. USD).
     */
    getExchangeRates: builder.query<ExchangeRateTable, void>({
      query: () => 'exchangeRates/latest',
      providesTags: ['ExchangeRate'],
    }),

    // ==========================================
    // Trips
    // ==========================================

    /**
     * Fetches all trips to populate catalog views and dashboard cards.
     */
    getTrips: builder.query<Trip[], void>({
      query: () => 'trips',
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
      providesTags: (_result, _error, id) => [{ type: 'Trip', id }],
    }),

    /**
     * Persists a newly created trip and invalidates the trip list cache.
     */
    createTrip: builder.mutation<Trip, Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>>({
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
     * Applies partial updates to an existing trip (e.g. status change, budget update).
     */
    updateTrip: builder.mutation<Trip, { id: string; payload: Partial<Trip> }>({
      query: ({ id, payload }) => ({
        url: `trips/${id}`,
        method: 'PATCH',
        body: {
          ...payload,
          updatedAt: new Date().toISOString(),
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Trip', id }],
    }),

    /**
     * Deletes a trip by ID and invalidates both the specific entity and list cache.
     */
    deleteTrip: builder.mutation<void, string>({
      query: (id) => ({
        url: `trips/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Trip', id }, { type: 'Trip', id: 'LIST' }],
    }),

    // ==========================================
    // Itinerary Events
    // ==========================================

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
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Event', id }],
    }),

    /**
     * Deletes an itinerary event by ID.
     */
    deleteEvent: builder.mutation<void, { id: string; tripId: string }>({
      query: ({ id }) => ({
        url: `events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { id, tripId }) => [{ type: 'Event', id }, { type: 'Event', id: `TRIP_${tripId}` }],
    }),

    // ==========================================
    // Expenses
    // ==========================================

    /**
     * Retrieves all expenses across all trips.
     */
    getExpenses: builder.query<Expense[], void>({
      query: () => 'expenses',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Expense' as const, id })),
              { type: 'Expense', id: 'LIST' },
            ]
          : [{ type: 'Expense', id: 'LIST' }],
    }),

    /**
     * Retrieves financial expense records logged for a specific trip.
     */
    getExpensesByTripId: builder.query<Expense[], string>({
      query: (tripId) => ({ url: 'expenses', params: { tripId } }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Expense' as const, id })),
              { type: 'Expense', id: 'LIST' },
            ]
          : [{ type: 'Expense', id: 'LIST' }],
    }),

    /**
     * Records a new expense. Invalidates both expenses and trips to refresh budget totals.
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
      invalidatesTags: [{ type: 'Expense', id: 'LIST' }, { type: 'Trip', id: 'LIST' }],
    }),

    /**
     * Modifies an expense. Invalidates expense and trip caches.
     */
    updateExpense: builder.mutation<Expense, { id: string; payload: Partial<Expense> }>({
      query: ({ id, payload }) => ({
        url: `expenses/${id}`,
        method: 'PATCH',
        body: {
          ...payload,
          updatedAt: new Date().toISOString(),
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Expense', id }, { type: 'Trip', id: 'LIST' }],
    }),

    /**
     * Deletes an expense and recalibrates trip budget tags.
     */
    deleteExpense: builder.mutation<void, string>({
      query: (id) => ({
        url: `expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Expense', id }, { type: 'Expense', id: 'LIST' }, { type: 'Trip', id: 'LIST' }],
    }),

    // ==========================================
    // Checklists
    // ==========================================

    /**
     * Retrieves all checklists across all trips.
     */
    getChecklists: builder.query<ChecklistItem[], void>({
      query: () => 'checklists',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Checklist' as const, id })),
              { type: 'Checklist', id: 'LIST' },
            ]
          : [{ type: 'Checklist', id: 'LIST' }],
    }),

    /**
     * Retrieves all checklist tasks and luggage items for a trip.
     */
    getChecklistsByTripId: builder.query<ChecklistItem[], string>({
      query: (tripId) => ({ url: 'checklists', params: { tripId } }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Checklist' as const, id })),
              { type: 'Checklist', id: 'LIST' },
            ]
          : [{ type: 'Checklist', id: 'LIST' }],
    }),

    /**
     * Adds an item to a trip's checklist and updates trip progress counters.
     */
    createChecklistItem: builder.mutation<ChecklistItem, Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>>({
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
      invalidatesTags: [{ type: 'Checklist', id: 'LIST' }, { type: 'Trip', id: 'LIST' }],
    }),

    /**
     * Updates completion status or details of a checklist item.
     */
    updateChecklistItem: builder.mutation<ChecklistItem, { id: string; payload: Partial<ChecklistItem> }>({
      query: ({ id, payload }) => ({
        url: `checklists/${id}`,
        method: 'PATCH',
        body: {
          ...payload,
          updatedAt: new Date().toISOString(),
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Checklist', id }, { type: 'Trip', id: 'LIST' }],
    }),

    /**
     * Removes an item from the checklist.
     */
    deleteChecklistItem: builder.mutation<void, string>({
      query: (id) => ({
        url: `checklists/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Checklist', id }, { type: 'Checklist', id: 'LIST' }, { type: 'Trip', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetTripsQuery,
  useGetTripByIdQuery,
  useCreateTripMutation,
  useUpdateTripMutation,
  useDeleteTripMutation,
  useGetEventsByTripIdQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useGetExpensesQuery,
  useGetExpensesByTripIdQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetChecklistsQuery,
  useGetChecklistsByTripIdQuery,
  useCreateChecklistItemMutation,
  useUpdateChecklistItemMutation,
  useDeleteChecklistItemMutation,
  useGetCurrenciesQuery,
  useGetExchangeRatesQuery,
} = apiSlice;
