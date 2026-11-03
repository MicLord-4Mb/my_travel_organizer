import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

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
    api.dispatch({ type: 'session/logOut' });
  }
  return result;
};

/**
 * Root RTK Query API instance.
 * Domain-specific endpoints are injected via `baseApi.injectEndpoints` in dedicated modules.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Trip', 'Event', 'Expense', 'Checklist', 'Currency', 'ExchangeRate'],
  endpoints: () => ({}),
});

