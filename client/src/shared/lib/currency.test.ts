import { describe, it, expect, vi } from 'vitest';
import {
  CURRENCY_SYMBOLS,
  USD_TO_RATES,
  convertCurrencyWithRates,
  convertCurrency,
  sumInCurrencyWithRates,
  sumInCurrency,
  formatCurrencyWithSymbols,
  formatCurrency,
} from './currency';

describe('currency library utilities', () => {
  describe('static constants', () => {
    it('defines expected emergency fallback rates and symbols', () => {
      expect(CURRENCY_SYMBOLS.USD).toBe('$');
      expect(CURRENCY_SYMBOLS.EUR).toBe('€');
      expect(USD_TO_RATES.USD).toBe(1);
      expect(USD_TO_RATES.EUR).toBeGreaterThan(0);
    });
  });

  const customRates: Record<string, number> = {
    USD: 1,
    EUR: 0.9,
    GBP: 0.8,
    JPY: 150,
  };

  const customSymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
  };

  describe('convertCurrencyWithRates', () => {
    it('returns the exact amount when fromCurrency matches toCurrency', () => {
      expect(convertCurrencyWithRates(250, 'EUR', 'EUR', customRates)).toBe(250);
      expect(convertCurrencyWithRates(100, 'USD', 'USD', customRates)).toBe(100);
    });

    it('converts from base currency to target foreign currency', () => {
      // 100 USD * 0.9 = 90 EUR
      expect(convertCurrencyWithRates(100, 'USD', 'EUR', customRates)).toBe(90);
      // 100 USD * 150 = 15000 JPY
      expect(convertCurrencyWithRates(100, 'USD', 'JPY', customRates)).toBe(15000);
    });

    it('converts from foreign currency to base currency', () => {
      // 90 EUR / 0.9 = 100 USD
      expect(convertCurrencyWithRates(90, 'EUR', 'USD', customRates)).toBe(100);
      // 15000 JPY / 150 = 100 USD
      expect(convertCurrencyWithRates(15000, 'JPY', 'USD', customRates)).toBe(100);
    });

    it('performs cross-currency conversions via intermediate base', () => {
      // 90 EUR -> USD (100) -> JPY (15000)
      expect(convertCurrencyWithRates(90, 'EUR', 'JPY', customRates)).toBe(15000);
      // 15000 JPY -> USD (100) -> GBP (80)
      expect(convertCurrencyWithRates(15000, 'JPY', 'GBP', customRates)).toBe(80);
    });

    it('is case-insensitive with respect to currency codes', () => {
      expect(convertCurrencyWithRates(100, 'usd', 'eur', customRates)).toBe(90);
      expect(convertCurrencyWithRates(90, 'eur', 'usd', customRates)).toBe(100);
    });

    it('falls back to returning original amount and warns if an exchange rate is missing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = convertCurrencyWithRates(100, 'USD', 'XYZ', customRates);
      expect(result).toBe(100);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing exchange rate for XYZ'));

      warnSpy.mockRestore();
    });
  });

  describe('convertCurrency (fallback convenience helper)', () => {
    it('uses default static USD_TO_RATES table', () => {
      // USD_TO_RATES has EUR: 0.92
      expect(convertCurrency(100, 'USD', 'EUR')).toBe(92);
      // USD_TO_RATES has JPY: 155.0
      expect(convertCurrency(100, 'USD', 'JPY')).toBe(15500);
    });
  });

  describe('sumInCurrencyWithRates', () => {
    it('accurately aggregates entries across multiple distinct currencies', () => {
      const entries = [
        { amount: 50, currency: 'USD' },     // 50 USD
        { amount: 45, currency: 'EUR' },     // 45 EUR / 0.9 = 50 USD
        { amount: 3000, currency: 'JPY' },   // 3000 JPY / 150 = 20 USD
      ];

      expect(sumInCurrencyWithRates(entries, 'USD', customRates)).toBe(120);
    });

    it('returns 0 for an empty entries array', () => {
      expect(sumInCurrencyWithRates([], 'USD', customRates)).toBe(0);
    });

    it('safely skips malformed entries with null, undefined, or non-finite values', () => {
      const entries = [
        { amount: null, currency: 'USD' },
        { amount: undefined, currency: 'EUR' },
        { amount: NaN, currency: 'USD' },
        { amount: 80, currency: 'USD' },
      ];

      expect(sumInCurrencyWithRates(entries, 'USD', customRates)).toBe(80);
    });

    it('defaults entry currency to targetCurrency if entry currency is unspecified', () => {
      const entries = [{ amount: 40 }];
      expect(sumInCurrencyWithRates(entries, 'USD', customRates)).toBe(40);
    });
  });

  describe('sumInCurrency (fallback convenience helper)', () => {
    it('aggregates using static USD_TO_RATES', () => {
      const entries = [
        { amount: 100, currency: 'USD' },
        { amount: 92, currency: 'EUR' }, // 92 / 0.92 = 100 USD
      ];
      expect(sumInCurrency(entries, 'USD')).toBe(200);
    });
  });

  describe('formatCurrencyWithSymbols', () => {
    it('formats numbers with commas and 2 decimals by default', () => {
      expect(formatCurrencyWithSymbols(1250.5, 'USD', customSymbols)).toBe('$1,250.50');
      expect(formatCurrencyWithSymbols(1000000, 'EUR', customSymbols)).toBe('€1,000,000.00');
    });

    it('suppresses decimals by default for JPY', () => {
      expect(formatCurrencyWithSymbols(1500, 'JPY', customSymbols)).toBe('¥1,500');
    });

    it('suppresses decimals when hideDecimals option is true', () => {
      expect(formatCurrencyWithSymbols(1250.75, 'USD', customSymbols, { hideDecimals: true })).toBe('$1,251');
    });

    it('supports compact notation with "k" suffix for values >= 1000', () => {
      expect(formatCurrencyWithSymbols(2500, 'USD', customSymbols, { compact: true })).toBe('$2.5k');
      expect(formatCurrencyWithSymbols(500, 'USD', customSymbols, { compact: true })).toBe('$500.00');
    });

    it('displays explicit plus sign when showSign option is true for positive amounts', () => {
      expect(formatCurrencyWithSymbols(350, 'USD', customSymbols, { showSign: true })).toBe('+$350.00');
    });

    it('formats negative amounts with a leading minus sign before the symbol', () => {
      expect(formatCurrencyWithSymbols(-75.25, 'USD', customSymbols)).toBe('-$75.25');
    });

    it('falls back to CURRENCY_SYMBOLS or uppercase code prefix when symbol is unmapped', () => {
      // In default CURRENCY_SYMBOLS: ILS -> ₪
      expect(formatCurrencyWithSymbols(50, 'ILS', {})).toBe('₪50.00');
      // Completely unmapped currency: CAD -> 'CAD ' prefix
      expect(formatCurrencyWithSymbols(50, 'CAD', {})).toBe('CAD 50.00');
    });
  });

  describe('formatCurrency (fallback helper)', () => {
    it('formats using standard symbols table', () => {
      expect(formatCurrency(450, 'USD')).toBe('$450.00');
      expect(formatCurrency(5000, 'JPY')).toBe('¥5,000');
    });
  });
});
