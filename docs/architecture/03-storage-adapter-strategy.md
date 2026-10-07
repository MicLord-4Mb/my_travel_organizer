# 03. Storage Adapter & API Strategy

## Architectural Evolution

Initially, the project was designed with a generic `ITripRepository` interface to abstract away local storage (`LocalStorageAdapter`). However, as the project evolved towards a more robust Stage 1 architecture, this pattern was replaced by **Redux Toolkit Query (RTK Query)** and a mock REST API (`json-server`).

### The RTK Query Approach

RTK Query natively serves the purpose of the repository pattern by:
1. **Abstracting Data Fetching:** UI components no longer know where data comes from; they simply call auto-generated hooks like `useGetTripsQuery()` or `useCreateEventMutation()`.
2. **Caching & Synchronization:** It automatically handles caching, background polling, and cache invalidation (via tags).
3. **Optimistic Updates:** It allows immediate UI updates before server confirmation, improving perceived performance.

The primary configuration resides in `client/src/shared/api/apiSlice.ts`.

### API Slice Configuration (`apiSlice.ts`)

The central API slice defines endpoints for all major domain entities:

```typescript
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3001/' }),
  tagTypes: ['Trip', 'Event', 'Expense', 'Checklist'],
  endpoints: (builder) => ({
    // Trips
    getTrips: builder.query<Trip[], void>({ ... }),
    createTrip: builder.mutation<Trip, Partial<Trip>>({ ... }),
    
    // Events (Itinerary)
    getEventsByTripId: builder.query<PlaceEvent[], string>({ ... }),
    createEvent: builder.mutation<PlaceEvent, Partial<PlaceEvent>>({ ... }),

    // Expenses
    getExpensesByTripId: builder.query<Expense[], string>({ ... }),
    
    // Checklists
    getChecklistsByTripId: builder.query<ChecklistItem[], string>({ ... }),
  }),
});
```

### Stage 1 (Current) vs Stage 2 (Future)

- **Stage 1:** Uses `json-server` running locally on port 3001 serving from `db.json`. All backend routes and logic are strictly basic CRUD operations provided by the mock server.
- **Stage 2:** The `baseUrl` will be pointed to the actual Node.js/Python backend. Complex operations (like template generation, budget recalculations, and multi-user sync) will move to the real backend, while the frontend RTK hooks will remain largely unchanged.
