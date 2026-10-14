import { createBrowserRouter } from 'react-router-dom';
import { RouteErrorBoundary } from '@shared/ui';
import App from '@app/App';
import {
  LazyRoute,
  LazyTripsPage,
  LazyTripDetailsPage,
  LazyChecklistsPage,
  LazyBudgetPage,
  LazyNotFoundPage,
  LazyLoginPage,
  LazyRegisterPage,
} from '@app/LazyRoute';
import { ProtectedRoute } from '@app/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LazyRoute Component={LazyLoginPage} />,
  },
  {
    path: '/register',
    element: <LazyRoute Component={LazyRegisterPage} />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <LazyRoute Component={LazyTripsPage} />,
      },
      {
        path: 'trips/:id',
        element: <LazyRoute Component={LazyTripDetailsPage} />,
      },
      {
        path: 'itinerary',
        element: <LazyRoute Component={LazyTripDetailsPage} />,
      },
      {
        path: 'trips/:id/budget',
        element: <LazyRoute Component={LazyBudgetPage} />,
      },
      {
        path: 'budget',
        element: <LazyRoute Component={LazyBudgetPage} />,
      },
      {
        path: 'trips/:id/checklists',
        element: <LazyRoute Component={LazyChecklistsPage} />,
      },
      {
        path: 'checklists',
        element: <LazyRoute Component={LazyChecklistsPage} />,
      },
      {
        path: '*',
        element: <LazyRoute Component={LazyNotFoundPage} />,
      },
    ],
  },
]);
