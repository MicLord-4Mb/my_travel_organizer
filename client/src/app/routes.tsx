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
} from './LazyRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
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
