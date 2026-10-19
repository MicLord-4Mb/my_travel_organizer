import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type {
  Trip,
  PlaceEvent,
  Expense,
  ChecklistItem,
  Currency,
  ExchangeRateTable,
  User,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials
} from '@shared/types/models';


interface StateWithSession {
  session?: {
    token?: string | null;
  };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as StateWithSession).session?.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

/**
 * Base query wrapper that intercepts 401 Unauthorized responses to evict expired tokens.
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    api.dispatch({type: 'session/logOut'});
  }
  return result;
};

/**
 * Central RTK Query API Slice for WanderFlow.
 *
 * Provides reactive data-fetching hooks, server state caching, and optimistic
 * cache invalidation for trips, daily itinerary events, budget expenses,
 * packing checklists, and global currency exchange rates.
 *
 * Cache Invalidation Strategy:
 * - `User`: Invalidated on profile updates.
 * - `Trip`: Invalidated on trip creation, deletion, or modification. Also invalidated
 *   when expenses or checklists change so trip KPIs (e.g. `spentBudget`, `packedCount`) refresh.
 * - `Event`: Scoped to `LIST` or specific event IDs.
 * - `Expense`: Scoped to `LIST` or specific expense IDs.
 * - `Checklist`: Scoped to `LIST` or specific checklist IDs.
 * - `Currency` & `ExchangeRate`: Cached globally for conversion computations.
 */
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Trip', 'Event', 'Expense', 'Checklist', 'Currency', 'ExchangeRate'],
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
      invalidatesTags: (_result, _error, id) => [
        { type: 'Trip', id },
        { type: 'Trip', id: 'LIST' },
        { type: 'Event', id: `TRIP_${id}` },
        { type: 'Expense', id: 'LIST' },
        { type: 'Checklist', id: 'LIST' },
      ],
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
      invalidatesTags: (result, _error, { id, payload }) => [
        { type: 'Event', id },
        ...(result?.tripId || payload.tripId
        ? [{ type: 'Event' as const, id: `TRIP_${result?.tripId ?? payload.tripId}`}]
        : []),
      ],
    }),

    /**
     * Reorders itinerary events with optimistic UI update and sequential persistence.
     */
    reorderEvents: builder.mutation<
      void,
      { tripId: string; events: PlaceEvent[] }
    >({
      queryFn: async ({ events }, _queryApi, _extraOptions, baseQuery) => {
        for (const event of events) {
          const res = await baseQuery({
            url: `events/${event.id}`,
            method: 'PATCH',
            body: {
              order: event.order,
              updatedAt: new Date().toISOString(),
            },
          });
          if (res.error) return { error: res.error };
        }
        return { data: undefined };
      },
      async onQueryStarted({ tripId, events }, { dispatch, queryFulfilled }) {
        const orderMap = new Map(events.map((e) => [e.id, e.order]));
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getEventsByTripId', tripId, (draft) => {
            for (const item of draft) {
              const nextOrder = orderMap.get(item.id);
              if (nextOrder !== undefined) {
                item.order = nextOrder;
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
      invalidatesTags: (_result, _error, { tripId }) => [
        { type: 'Event', id: `TRIP_${tripId}` },
      ],
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
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Expense', id },
        { type: 'Expense', id: 'LIST' },
        { type: 'Trip', id: 'LIST' }
      ],
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
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Checklist', id },
        { type: 'Checklist', id: 'LIST' },
        { type: 'Trip', id: 'LIST' }
      ],
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

    // ==========================================
    // Authentication & Users
    // ==========================================

    /**
     * Authenticates a user with email and password credentials.
     * Uses mock fallback if the mock json-server has no native auth endpoint.
     */
    login: builder.mutation<AuthResponse, LoginCredentials>({
      queryFn: async (credentials, _queryApi, _extraOptions, baseQuery) => {
          const result = await baseQuery({
            url: 'auth/login',
            method: 'POST',
            body: credentials,
          });
          if (result.data) {
            return { data: result.data as AuthResponse };
          }

        const status = result.error?.status;
        if (!import.meta.env.DEV || (status !== 404 && status !== 'FETCH_ERROR')){
          return { error: result.error! };
        }

        const mockUser: User = {
          id: 'user-planner-1',
          email: credentials.email,
          name:
            credentials.email === 'alex.rivers@wanderflow.app'
              ? 'Alex Rivers'
              : credentials.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Travel Planner',
          avatarUrl: '/user-avatar-planner.png',
          role: 'user',
        };
        const mockToken = `jwt-wanderflow-${Date.now()}-${encodeURIComponent(credentials.email)}`;
        return {
          data: {
            user: mockUser,
            token: mockToken,
          },
        };
      },
      invalidatesTags: ['User'],
    }),

    /**
     * Registers a new user account.
     */
    register: builder.mutation<AuthResponse, RegisterCredentials>({
      queryFn: async (credentials, _queryApi, _extraOptions, baseQuery) => {

          const result = await baseQuery({
            url: 'auth/register',
            method: 'POST',
            body: credentials,
          });
          if (result.data) {
            return { data: result.data as AuthResponse };
          }

        const status = result.error?.status;
        if (!import.meta.env.DEV || (status !== 404 && status !== 'FETCH_ERROR')) {
          return { error: result.error! };
        }

        const newUser: User = {
          id: crypto.randomUUID(),
          email: credentials.email,
          name: credentials.name,
          avatarUrl: '/user-avatar-planner.png',
          role: 'user',
        };
        const mockToken = `jwt-wanderflow-${Date.now()}-${encodeURIComponent(credentials.email)}`;
        return {
          data: {
            user: newUser,
            token: mockToken,
          },
        };
      },
      invalidatesTags: ['User'],
    }),

    /**
     * Fetches current authenticated user profile.
     */
    getMe: builder.query<User, void>({
      query: () => 'auth/me',
      providesTags: ['User'],
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
  useReorderEventsMutation,
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
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
} = apiSlice;
