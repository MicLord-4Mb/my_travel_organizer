/**
 * Application Bootstrap Entry Point.
 *
 * Mounts the root React DOM tree and initializes core infrastructure providers:
 * 1. Global telemetry error logging (`initGlobalErrorLogging`).
 * 2. Root crash boundary (`<ErrorBoundary>`).
 * 3. Centralized Redux state container (`<Provider store={store}>`).
 * 4. Radix UI Toast notification context (`<ToastProvider>`).
 * 5. React Router client-side routing (`<RouterProvider router={router}>`).
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from '@app/store';
import { router } from '@app/routes';
import { initGlobalErrorLogging } from '@shared/lib/logger';
import { ErrorBoundary, ToastProvider } from '@shared/ui';
import './index.css';

// Initialize global window error capturing and unhandled promise rejection tracking
initGlobalErrorLogging();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Fatal: root element #root not found in document DOM.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
