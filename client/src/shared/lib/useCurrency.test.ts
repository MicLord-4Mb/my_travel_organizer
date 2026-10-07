import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCurrency } from './useCurrency';
import { USD_TO_RATES } from './currency';
import * as apiSlice from '@shared/api/apiSlice';

vi.mock('@shared/api/apiSlice', () => ({
  useGetCurrenciesQuery: vi.fn(),
  useGetExchangeRatesQuery: vi.fn(),
}));

describe('useCurrency', () => {
  const mockGetCurrencies = vi.mocked(apiSlice.useGetCurrenciesQuery);
  const mockGetExchangeRates = vi.mocked(apiSlice.useGetExchangeRatesQuery);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Live API Rates Conversion', () => {
    beforeEach(() => {
      mockGetCurrencies.mockReturnValue({
        data: [
          { code: 'USD', symbol: '$', name: 'US Dollar' },
          { code: 'EUR', symbol: '€', name: 'Euro' },
          { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
        ],
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as any);

      mockGetExchangeRates.mockReturnValue({
        data: {
          base: 'USD',
          date: '2026-10-08',
          rates: {
            USD: 1,
            EUR: 0.9,
            JPY: 150,
          },
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as any);
    });

    it('returns live currencies, symbols, and rate tables', () => {
      const { result } = renderHook(() => useCurrency());

      expect(result.current.currencies).toHaveLength(3);
      expect(result.current.symbols).toEqual({ USD: '$', EUR: '€', JPY: '¥' });
      expect(result.current.names).toEqual({
        USD: 'US Dollar',
        EUR: 'Euro',
        JPY: 'Japanese Yen',
      });
      expect(result.current.baseCurrency).toBe('USD');
      expect(result.current.rates.EUR).toBe(0.9);
      expect(result.current.rates.JPY).toBe(150);
    });

    it('converts base currency to target currency correctly', () => {
      const { result } = renderHook(() => useCurrency());

      // 100 USD -> EUR (rate 0.9) => 90 EUR
      expect(result.current.convert(100, 'USD', 'EUR')).toBe(90);
      // 100 USD -> JPY (rate 150) => 15000 JPY
      expect(result.current.convert(100, 'USD', 'JPY')).toBe(15000);
    });

    it('converts non-base currency back to base currency correctly', () => {
      const { result } = renderHook(() => useCurrency());

      // 1500 JPY -> USD (1500 / 150 = 10 USD)
      expect(result.current.convert(1500, 'JPY', 'USD')).toBe(10);
      // 90 EUR -> USD (90 / 0.9 = 100 USD)
      expect(result.current.convert(90, 'EUR', 'USD')).toBe(100);
    });

    it('converts cross-currencies via intermediate base currency', () => {
      const { result } = renderHook(() => useCurrency());

      // 90 EUR -> JPY: 90 / 0.9 = 100 USD; 100 USD * 150 = 15000 JPY
      expect(result.current.convert(90, 'EUR', 'JPY')).toBe(15000);
    });

    it('returns the same amount when fromCurrency matches toCurrency', () => {
      const { result } = renderHook(() => useCurrency());

      expect(result.current.convert(250, 'EUR', 'EUR')).toBe(250);
      expect(result.current.convert(1000, 'JPY', 'JPY')).toBe(1000);
    });

    it('aggregates multi-currency expense items using sum()', () => {
      const { result } = renderHook(() => useCurrency());

      const expenses = [
        { amount: 50, currency: 'USD' },     // 50 USD
        { amount: 45, currency: 'EUR' },     // 45 EUR / 0.9 = 50 USD
        { amount: 3000, currency: 'JPY' },   // 3000 JPY / 150 = 20 USD
      ];

      // Total in USD = 50 + 50 + 20 = 120 USD
      expect(result.current.sum(expenses, 'USD')).toBe(120);
    });
  });

  describe('Fallback Logic When Exchange Rates Are Missing / Unavailable', () => {
    beforeEach(() => {
      mockGetCurrencies.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: vi.fn(),
      } as any);

      // Exchange rates API failed or returned undefined
      mockGetExchangeRates.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: vi.fn(),
      } as any);
    });

    it('falls back to default static USD_TO_RATES and base USD when rates are undefined', () => {
      const { result } = renderHook(() => useCurrency());

      expect(result.current.rates).toEqual(USD_TO_RATES);
      expect(result.current.baseCurrency).toBe('USD');
      expect(result.current.isError).toBe(true);
    });

    it('performs conversion using static emergency fallback rates', () => {
      const { result } = renderHook(() => useCurrency());

      // USD_TO_RATES has EUR: 0.92, JPY: 155.0, ILS: 3.75
      expect(result.current.convert(100, 'USD', 'EUR')).toBe(92);
      expect(result.current.convert(155, 'JPY', 'USD')).toBe(1);
      expect(result.current.convert(375, 'ILS', 'USD')).toBe(100);
    });

    it('falls back to 1.0 multiplier when currency code is completely unknown / unlisted', () => {
      const { result } = renderHook(() => useCurrency());

      // Currency 'UNKNOWN' is not in rates table => rateFrom / rateTo defaults to 1
      expect(result.current.convert(75, 'UNKNOWN', 'USD')).toBe(75);
      expect(result.current.convert(75, 'USD', 'NONEXISTENT')).toBe(75);
      expect(result.current.convert(75, 'UNKNOWN', 'NONEXISTENT')).toBe(75);
    });

    it('formats currencies using emergency fallback symbols when currencies list is missing', () => {
      const { result } = renderHook(() => useCurrency());

      expect(result.current.symbols).toEqual({});
      // Uses built-in CURRENCY_SYMBOLS: USD -> $, EUR -> €
      expect(result.current.format(1250, 'USD')).toBe('$1,250.00');
      expect(result.current.format(1250, 'EUR')).toBe('€1,250.00');
      // For unknown currency, formats with code prefix
      expect(result.current.format(50, 'CAD')).toBe('CAD 50.00');
    });

    it('sum() safely handles null, undefined, or non-finite expense amounts', () => {
      const { result } = renderHook(() => useCurrency());

      const malformedExpenses = [
        { amount: null, currency: 'USD' },
        { amount: undefined, currency: 'USD' },
        { amount: NaN, currency: 'USD' },
        { amount: 100, currency: 'USD' },
      ];

      expect(result.current.sum(malformedExpenses, 'USD')).toBe(100);
    });
  });

  describe('Loading State Coordination', () => {
    it('sets isLoading to true when either currencies or rates are fetching', () => {
      mockGetCurrencies.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: vi.fn(),
      } as any);

      mockGetExchangeRates.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useCurrency());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isCurrenciesLoading).toBe(true);
      expect(result.current.isRatesLoading).toBe(false);
    });
  });
});
