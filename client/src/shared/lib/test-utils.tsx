import React, { type PropsWithChildren } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { apiSlice } from '@shared/api/apiSlice';
import { sessionReducer } from '@entities/session';
import { ToastProvider } from '@shared/ui/Toast';

/**
 * Creates an isolated Redux store instance for unit and integration testing.
 */
export function createTestStore() {
  return configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      session: sessionReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });
}

export type AppStore = ReturnType<typeof createTestStore>;

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  store?: AppStore;
  routerInitialEntries?: MemoryRouterProps['initialEntries'];
}

/**
 * Custom renderer wrapping tested components with MemoryRouter, Redux Provider, and ToastProvider.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  {
    store = createTestStore(),
    routerInitialEntries = ['/'],
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren): React.ReactElement {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={routerInitialEntries}>
          <ToastProvider>{children}</ToastProvider>
        </MemoryRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
