import { baseApi } from './baseApi';
import type { Currency, ExchangeRateTable } from '@shared/types/models';

export const currenciesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Retrieves the list of supported world currencies with graphic symbols and names.
     */
    getCurrencies: builder.query<Currency[], void>({
      query: () => 'currencies',
      providesTags: ['Currency'],
    }),

    /**
     * Retrieves current foreign exchange rates relative to the system base currency (e.g. USD).
     */
    getExchangeRates: builder.query<ExchangeRateTable, void>({
      query: () => 'exchangeRates/latest',
      providesTags: ['ExchangeRate'],
    }),
  }),
});

export const { useGetCurrenciesQuery, useGetExchangeRatesQuery } = currenciesApi;

