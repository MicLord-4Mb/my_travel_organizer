import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from '@app/store';
import { router } from '@app/routes';
import { initGlobalErrorLogging } from '@shared/lib/logger';
import { ErrorBoundary } from '@shared/ui/ErrorBoundary';
import './index.css';

// Initialize production error capturing (window.onerror & unhandled promise rejections)
initGlobalErrorLogging();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);

