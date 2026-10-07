import { createBrowserRouter } from 'react-router-dom';
import TripsPage from '@pages/TripsPage';
import TripDetailsPage from '@pages/TripDetailsPage';
import ChecklistsPage from '@pages/ChecklistsPage';
import BudgetPage from '@pages/BudgetPage';
import NotFoundPage from '@pages/NotFoundPage';
import App from '@app/App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <TripsPage />,
      },
      {
        path: 'trips/:id',
        element: <TripDetailsPage />,
      },
      {
        path: 'itinerary',
        element: <TripDetailsPage />,
      },
      {
        path: 'trips/:id/budget',
        element: <BudgetPage />,
      },
      {
        path: 'budget',
        element: <BudgetPage />,
      },
      {
        path: 'trips/:id/checklists',
        element: <ChecklistsPage />,
      },
      {
        path: 'checklists',
        element: <ChecklistsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
