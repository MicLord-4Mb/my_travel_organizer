import React, { lazy, Suspense, type ComponentType } from 'react';

export const LazyTripsPage = lazy(() => import('@pages/TripsPage'));
export const LazyTripDetailsPage = lazy(() => import('@pages/TripDetailsPage'));
export const LazyChecklistsPage = lazy(() => import('@pages/ChecklistsPage'));
export const LazyBudgetPage = lazy(() => import('@pages/BudgetPage'));
export const LazyNotFoundPage = lazy(() => import('@pages/NotFoundPage'));
export const LazyLoginPage = lazy(() => import('@pages/AuthPage/LoginPage'));
export const LazyRegisterPage = lazy(() => import('@pages/AuthPage/RegisterPage'));

export interface LazyRouteProps {
  Component: React.LazyExoticComponent<ComponentType>;
}

export const LazyRoute: React.FC<LazyRouteProps> = ({ Component }) => (
  <Suspense
    fallback={
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40vh',
          width: '100%',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid var(--color-border-subtle, #e2e8f0)',
            borderTopColor: 'var(--color-primary, #0D9488)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    }
  >
    <Component />
  </Suspense>
);
