import { createBrowserRouter } from 'react-router-dom';
import TripsPage from '@pages/TripsPage';
import TripDetailsPage from '@pages/TripDetailsPage';
import NotFoundPage from '@pages/NotFoundPage';
import App from '@app/App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <TripsPage />
      },
      {
        path: 'trips/:id',
        element: <TripDetailsPage />
      }
    ]
  }
]);
