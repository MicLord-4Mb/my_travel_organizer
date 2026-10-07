import { useMemo } from 'react';
import { useGetCurrenciesQuery, useGetExchangeRatesQuery } from '@shared/api/apiSlice';
import {
  convertCurrencyWithRates,
  formatCurrencyWithSymbols,
  sumInCurrencyWithRates,
  USD_TO_RATES,
  type FormatCurrencyOptions,
} from './currency';

/**
 * Custom React hook providing reactive currency conversions and formatting.
 *
 * Automatically fetches the active currencies list and live FX exchange rates
 * from the backend RTK Query cache. Provides memoized helper functions for
 * formatting, converting, and summing monetary amounts.
 *
 * @returns {object} Currency helpers and live FX metadata:
 * - `currencies`: Available currency records (code, symbol, name).
 * - `symbols`: Dictionary mapping currency code to graphic symbol.
 * - `names`: Dictionary mapping currency code to full display name.
 * - `rates`: Current exchange rate multipliers against base.
 * - `baseCurrency`: Base currency identifier for the current rates table.
 * - `convert`: Function to convert an amount between any two currencies.
 * - `format`: Function to format an amount with symbol and decimal options.
 * - `sum`: Function to sum a collection of expenses into a target currency.
 */
export function useCurrency() {
  const {
    data: currencies = [],
    isLoading: isCurrenciesLoading,
    isError: isCurrenciesError,
    refetch: refetchCurrencies,
  } = useGetCurrenciesQuery();

  const {
    data: exchangeRates,
    isLoading: isRatesLoading,
    isError: isRatesError,
    refetch: refetchRates,
  } = useGetExchangeRatesQuery();

  const symbols = useMemo(() => {
    const map: Record<string, string> = {};
    currencies.forEach((c) => {
      map[c.code] = c.symbol;
    });
    return map;
  }, [currencies]);

  const names = useMemo(() => {
    const map: Record<string, string> = {};
    currencies.forEach((c) => {
      map[c.code] = c.name;
    });
    return map;
  }, [currencies]);

  const rates = exchangeRates?.rates || USD_TO_RATES;
  const baseCurrency = exchangeRates?.base || 'USD';

  /**
   * Converts an amount from one currency to another using active FX rates.
   *
   * @param {number} amount - Value to convert.
   * @param {string} [fromCurrency='USD'] - Origin currency code.
   * @param {string} [toCurrency='USD'] - Target currency code.
   * @returns {number} Converted value.
   */
  const convert = (amount: number, fromCurrency: string = 'USD', toCurrency: string = 'USD') => {
    return convertCurrencyWithRates(amount, fromCurrency, toCurrency, rates, baseCurrency);
  };

  /**
   * Formats a monetary value using live symbol mappings.
   *
   * @param {number} amount - Numeric value to format.
   * @param {string} [currency='USD'] - ISO currency code.
   * @param {FormatCurrencyOptions} [options] - Formatting configuration.
   * @returns {string} Formatted display string.
   */
  const format = (amount: number, currency: string = 'USD', options?: FormatCurrencyOptions) => {
    return formatCurrencyWithSymbols(amount, currency, symbols, options);
  };

  /**
   * Sums an array of expense records in a single target currency.
   *
   * @param {ReadonlyArray<{ amount?: number | null; currency?: string | null }>} entries - Expense items.
   * @param {string} targetCurrency - ISO code of target currency.
   * @returns {number} Aggregated total sum.
   */
  const sum = (entries: ReadonlyArray<{ amount?: number | null; currency?: string | null }>, targetCurrency: string) => {
    return sumInCurrencyWithRates(entries, targetCurrency, rates, baseCurrency);
  };

  return {
    currencies,
    symbols,
    names,
    rates,
    baseCurrency,
    convert,
    format,
    sum,
    isCurrenciesLoading,
    isCurrenciesError,
    refetchCurrencies,
    isRatesLoading,
    isRatesError,
    refetchRates,
    isLoading: isCurrenciesLoading || isRatesLoading,
    isError: isCurrenciesError || isRatesError,
  };
}
