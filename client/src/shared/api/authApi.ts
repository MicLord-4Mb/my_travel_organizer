import { baseApi } from './baseApi';
import type {
  User,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from '@shared/types/models';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
        if (!import.meta.env.DEV || (status !== 404 && status !== 'FETCH_ERROR')) {
          return { error: result.error! };
        }

        const mockUser: User = {
          id: 'user-planner-1',
          email: credentials.email,
          name:
            credentials.email === 'alex.rivers@wanderflow.app'
              ? 'Alex Rivers'
              : credentials.email
                  .split('@')[0]
                  .replace(/[._]/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Travel Planner',
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

export const { useLoginMutation, useRegisterMutation, useGetMeQuery } = authApi;

