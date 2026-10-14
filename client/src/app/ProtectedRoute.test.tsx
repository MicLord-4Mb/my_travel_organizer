import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@shared/lib/test-utils';
import { ProtectedRoute } from './ProtectedRoute';
import { setCredentials, logOut } from '@entities/session';
import type { User } from '@shared/types/models';

describe('ProtectedRoute guard', () => {
  const mockUser: User = {
    id: 'user-1',
    name: 'Alex Rivers',
    email: 'alex.rivers@wanderflow.app',
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('renders child protected component when user is authenticated', () => {
    const { store } = renderWithProviders(
      <Routes>
        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <div>Protected Trips Dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { routerInitialEntries: ['/trips'] }
    );

    // Initially unauthenticated -> redirects to /login
    expect(screen.getByText('Login Page')).toBeInTheDocument();

    // Now log in
    store.dispatch(setCredentials({ user: mockUser, token: 'mock-token' }));

    // Re-render authenticated
    renderWithProviders(
      <Routes>
        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <div>Protected Trips Dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { store, routerInitialEntries: ['/trips'] }
    );

    expect(screen.getByText('Protected Trips Dashboard')).toBeInTheDocument();
  });

  it('redirects unauthenticated user to /login', () => {
    const { store } = renderWithProviders(
      <Routes>
        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <div>Secret Area</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Please Sign In</div>} />
      </Routes>,
      { routerInitialEntries: ['/trips'] }
    );

    store.dispatch(logOut());

    expect(screen.getByText('Please Sign In')).toBeInTheDocument();
    expect(screen.queryByText('Secret Area')).not.toBeInTheDocument();
  });
});
