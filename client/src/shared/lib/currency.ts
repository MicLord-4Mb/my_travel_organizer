/**
 * Currency Formatting and Foreign Exchange (FX) Conversion Utilities.
 *
 * Provides standardized financial operations for multi-currency expense management,
 * currency symbol resolution, and real-time exchange conversions.
 */

/**
 * Offline emergency fallback symbols if API data is not yet loaded.
 * Application components should consume `useCurrency().symbols` for live API values.
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  GBP: '£',
  ILS: '₪',
};

/**
 * Offline emergency fallback rates relative to 1 USD if API is unavailable.
 * Application components should consume `useCurrency().rates` for live API rates.
 */
export const USD_TO_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 155.0,
  ILS: 3.75,
};

/**
 * Converts a monetary value between two currencies using an exchange rate table.
 *
 * Assumes rates are defined as units per base currency:
 * `Amount_Base = Amount_From / Rate_From`
 * `Amount_To = Amount_Base * Rate_To`
 *
 * @param {number} amount - Monetary amount to convert.
 * @param {string} [fromCurrency='USD'] - Source ISO 4217 currency code.
 * @param {string} [toCurrency='USD'] - Target ISO 4217 currency code.
 * @param {Record<string, number>} rates - Multipliers per currency relative to base.
 * @param {string} [_baseCurrency='USD'] - Identifier for the table's base currency.
 * @returns {number} Converted value in the target currency.
 */
export function convertCurrencyWithRates(
  amount: number,
  fromCurrency: string = 'USD',
  toCurrency: string = 'USD',
  rates: Record<string, number>,
  _baseCurrency: string = 'USD'
): number {
  if (fromCurrency === toCurrency) return amount;

  const fromUpper = fromCurrency.toUpperCase();
  const toUpper = toCurrency.toUpperCase();

  const rateFrom = fromUpper === _baseCurrency ? 1 : rates[fromUpper];
  const rateTo = toUpper === _baseCurrency ? 1 : rates[toUpper];

  if (!rateFrom || !rateTo) {
    console.warn(`Missing exchange rate for ${!rateFrom ? fromUpper : toUpper}`);
    return amount;
  }

  // Convert to intermediate base currency, then to target
  const inBase = amount / rateFrom;
  return inBase * rateTo;
}

/**
 * Convenience helper to convert currency using built-in USD rates table.
 *
 * @param {number} amount - Amount to convert.
 * @param {string} [fromCurrency='USD'] - Source currency code.
 * @param {string} [toCurrency='JPY'] - Target currency code.
 * @returns {number} Converted amount.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string = 'USD',
  toCurrency: string = 'JPY'
): number {
  return convertCurrencyWithRates(amount, fromCurrency, toCurrency, USD_TO_RATES, 'USD');
}

/**
 * Aggregates a list of expense entries into a single target currency sum using dynamic rates.
 * Entries missing amount or with non-finite values are safely ignored.
 *
 * @param {ReadonlyArray<{ amount?: number | null; currency?: string | null }>} entries - List of entries.
 * @param {string} targetCurrency - Desired aggregate currency code.
 * @param {Record<string, number>} rates - Exchange rates map.
 * @param {string} [baseCurrency='USD'] - Base currency of the rates table.
 * @returns {number} Total sum in `targetCurrency`.
 */
export function sumInCurrencyWithRates(
  entries: ReadonlyArray<{ amount?: number | null; currency?: string | null }>,
  targetCurrency: string,
  rates: Record<string, number>,
  baseCurrency: string = 'USD'
): number {
  return entries.reduce((sum, entry) => {
    const amount = Number(entry.amount);
    if (!Number.isFinite(amount)) return sum;
    return sum + convertCurrencyWithRates(amount, entry.currency || targetCurrency, targetCurrency, rates, baseCurrency);
  }, 0);
}

/**
 * Aggregates expense entries into a target currency using fallback static rates.
 *
 * @param {ReadonlyArray<{ amount?: number | null; currency?: string | null }>} entries - Entries list.
 * @param {string} targetCurrency - Desired target currency code.
 * @returns {number} Total sum in `targetCurrency`.
 */
export function sumInCurrency(
  entries: ReadonlyArray<{ amount?: number | null; currency?: string | null }>,
  targetCurrency: string
): number {
  return sumInCurrencyWithRates(entries, targetCurrency, USD_TO_RATES, 'USD');
}

/**
 * Options for formatting currency output.
 */
export interface FormatCurrencyOptions {
  /** Suppress fractional digits (forced for JPY by default) */
  hideDecimals?: boolean;
  /** Display large values using 'k' suffix (e.g. $1.5k) */
  compact?: boolean;
  /** Force explicit '+' sign on positive numbers */
  showSign?: boolean;
}

/**
 * Formats a numeric amount with proper currency symbol, thousands separators, and decimals.
 *
 * @param {number} amount - Numeric value to format.
 * @param {string} [currency='USD'] - ISO currency code.
 * @param {Record<string, string>} symbols - Map of currency codes to symbols.
 * @param {FormatCurrencyOptions} [options] - Formatting options.
 * @returns {string} Formatted currency string (e.g. "$1,250.00").
 */
export function formatCurrencyWithSymbols(
  amount: number,
  currency: string = 'USD',
  symbols: Record<string, string>,
  options?: FormatCurrencyOptions
): string {
  const code = currency.toUpperCase();
  const symbol = symbols[code] || CURRENCY_SYMBOLS[code] || `${code} `;
  const isJpy = code === 'JPY';

  const shouldHideDecimals = options?.hideDecimals ?? isJpy;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formattedNum = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: shouldHideDecimals ? 0 : 2,
    maximumFractionDigits: shouldHideDecimals ? 0 : 2,
  });

  if (options?.compact && absAmount >= 1000) {
    formattedNum = (absAmount / 1000).toFixed(1) + 'k';
  }

  const sign = isNegative ? '-' : options?.showSign && amount > 0 ? '+' : '';

  return `${sign}${symbol}${formattedNum}`;
}

/**
 * Formats a numeric amount using default fallback currency symbols.
 *
 * @param {number} amount - Numeric value to format.
 * @param {string} [currency='USD'] - ISO currency code.
 * @param {FormatCurrencyOptions} [options] - Formatting options.
 * @returns {string} Formatted currency string.
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  options?: FormatCurrencyOptions
): string {
  return formatCurrencyWithSymbols(amount, currency, CURRENCY_SYMBOLS, options);
}
