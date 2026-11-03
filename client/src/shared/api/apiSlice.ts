import { baseApi, baseQueryWithReauth } from './baseApi';
import {
  useGetCurrenciesQuery,
  useGetExchangeRatesQuery,
} from './currenciesApi';
import {
  useGetTripsQuery,
  useGetTripByIdQuery,
  useCreateTripMutation,
  useUpdateTripMutation,
  useDeleteTripMutation,
} from './tripsApi';
import {
  useGetEventsByTripIdQuery,
  useLazyGetEventsByTripIdQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useReorderEventsMutation,
  useDeleteEventMutation,
} from './eventsApi';
import {
  useGetExpensesQuery,
  useGetExpensesByTripIdQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} from './expensesApi';
import {
  useGetChecklistsQuery,
  useGetChecklistsByTripIdQuery,
  useLazyGetChecklistsByTripIdQuery,
  useCreateChecklistItemMutation,
  useUpdateChecklistItemMutation,
  useDeleteChecklistItemMutation,
} from './checklistsApi';
import {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
} from './authApi';

/**
 * Central RTK Query API Slice for WanderFlow.
 *
 * Composes domain-specific endpoint modules (`tripsApi`, `eventsApi`, `expensesApi`,
 * `checklistsApi`, `currenciesApi`, `authApi`) via `baseApi.injectEndpoints` while
 * preserving a unified export surface.
 */
export const apiSlice = baseApi;
export { baseQueryWithReauth };

export {
  useGetTripsQuery,
  useGetTripByIdQuery,
  useCreateTripMutation,
  useUpdateTripMutation,
  useDeleteTripMutation,
  useGetEventsByTripIdQuery,
  useLazyGetEventsByTripIdQuery,
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
  useLazyGetChecklistsByTripIdQuery,
  useCreateChecklistItemMutation,
  useUpdateChecklistItemMutation,
  useDeleteChecklistItemMutation,
  useGetCurrenciesQuery,
  useGetExchangeRatesQuery,
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
};
