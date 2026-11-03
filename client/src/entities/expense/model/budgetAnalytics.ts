import type { Expense, Trip } from '@shared/types/models';
import { convertCurrency, convertCurrencyWithRates } from '@shared/lib/currency';
import { diffInDays, inclusiveDayCount, parseLocalDate } from '@shared/lib/date';
import { normalizeCategory, type NormalizedExpenseCategory } from './types';

/**
 * Creates an empty zero-initialized budget totals accumulator by category.
 */
const EMPTY_TOTALS = (): Record<NormalizedExpenseCategory, number> => ({
  transport: 0,
  lodging: 0,
  dining: 0,
  activities: 0,
  shopping: 0,
  other: 0,
});

/**
 * Aggregated budget performance metrics and burn rate analytics for a trip.
 *
 * All monetary values are normalized into the **trip's base currency**.
 */
export interface BudgetAnalytics {
  /** Total user-allocated budget limit */
  approvedLimit: number;
  /** Cumulative sum of all expenses in trip currency */
  totalSpent: number;
  /** Remaining funds (`approvedLimit - totalSpent`) */
  remaining: number;
  /** Percentage of budget utilized (0 - 100+) */
  spentPercent: number;
  /** Percentage of budget remaining */
  remainingPercent: number;
  /** Spending subtotals indexed by canonical expense category */
  categoryTotals: Record<NormalizedExpenseCategory, number>;
  /** User-configured category budget caps (0 if unconstrained) */
  categoryCaps: Record<NormalizedExpenseCategory, number>;
  /** Total duration in calendar days */
  totalDays: number;
  /** Days elapsed since trip commencement (0 if upcoming) */
  elapsedDays: number;
  /** Days remaining until trip conclusion */
  remainingDays: number;
  /** Daily average spend rate based on elapsed or total duration */
  dailyAvg: number;
  /** Calculated daily allowance permitted to stay within budget */
  remainingDailyAllowance: number;
  /** Alert flag indicating spending is between 90% and 100% of budget */
  isNearLimit: boolean;
  /** Critical alert flag indicating spending has exceeded 100% */
  isOverBudget: boolean;
  /** Total count of recorded expense transactions */
  transactionCount: number;
}

/**
 * Visual / semantic state of a budget relative to its limit.
 * - `normal`: below 90% of the limit (or no limit configured)
 * - `warning`: between 90% and 100% (inclusive)
 * - `danger`: over budget (> 100%)
 */
export type BudgetState = 'normal' | 'warning' | 'danger';

/** Ratio at which a budget switches from `normal` to `warning`. */
export const BUDGET_WARNING_RATIO = 0.9;

/**
 * Single source of truth for budget threshold classification.
 *
 * @param spent - Amount spent, in the same currency as `limit`.
 * @param limit - Budget limit; `undefined`, `0` or negative means "no limit" (always `normal`).
 */
export function getBudgetState(spent: number, limit?: number | null): BudgetState {
  if (!limit || limit <= 0) return 'normal';
  const ratio = spent / limit;
  if (ratio > 1) return 'danger';
  if (ratio >= BUDGET_WARNING_RATIO) return 'warning';
  return 'normal';
}

/**
 * Rounded budget utilization percentage. Intentionally **not** capped at 100 so that
 * deficits remain visible (e.g. `140`). Returns 0 when no limit is configured.
 */
export function getBudgetPercent(spent: number, limit?: number | null): number {
  if (!limit || limit <= 0) return 0;
  return Math.round((spent / limit) * 100);
}
/**
 * Computes comprehensive financial analytics and timeline burn rates for a trip.
 *
 * Converts each expense into the trip's base currency using live API exchange rates (if supplied),
 * aggregates category allocations, and calculates daily pacing metrics.
 *
 * @param {Expense[]} expenses - List of recorded expense records.
 * @param {Trip | null | undefined} trip - Parent trip containing budget limit and currency.
 * @param {Record<string, number>} [rates] - Optional API exchange rates map.
 * @param {string} [baseCurrency='USD'] - Base currency of the rates table.
 * @param {Date} [now=new Date()] - Reference timestamp for deterministic unit testing.
 * @returns {BudgetAnalytics} Calculated financial metrics.
 */
export function computeBudgetAnalytics(
  expenses: ReadonlyArray<Expense>,
  trip: Trip | null | undefined,
  rates?: Record<string, number>,
  baseCurrency: string = 'USD',
  now: Date = new Date()
): BudgetAnalytics {
  const tripCurrency = trip?.currency || 'USD';
  const inTripCurrency = (e: Expense): number =>
    rates
      ? convertCurrencyWithRates(Number(e.amount) || 0, e.currency || tripCurrency, tripCurrency, rates, baseCurrency)
      : convertCurrency(Number(e.amount) || 0, e.currency || tripCurrency, tripCurrency);

  const approvedLimit = trip?.budgetLimit || 0;
  const categoryTotals = EMPTY_TOTALS();
  let totalSpent = 0;
  for (const expense of expenses) {
    const amount = inTripCurrency(expense);
    totalSpent += amount;
    categoryTotals[normalizeCategory(expense.category)] += amount;
  }

  const budgetState = getBudgetState(totalSpent, approvedLimit);
  const remaining = approvedLimit - totalSpent;
  const spentPercent = approvedLimit > 0 ? (totalSpent / approvedLimit) * 100 : 0;
  const remainingPercent = approvedLimit > 0 ? (remaining / approvedLimit) * 100 : 0;

  const budgets = trip?.categoryBudgets ?? {};
  const categoryCaps: Record<NormalizedExpenseCategory, number> = {
    transport: budgets.transport || 0,
    lodging: budgets.lodging || 0,
    dining: budgets.dining || 0,
    activities: budgets.activities || 0,
    shopping: budgets.shopping || 0,
    other: budgets.other || 0,
  };

  const totalDays = trip ? inclusiveDayCount(trip.startDate, trip.endDate) : 0;
  const start = parseLocalDate(trip?.startDate);
  let elapsedDays = 0;
  if (start && totalDays > 0) {
    const daysSinceStart = diffInDays(start, now);
    // Before the trip: 0. During: 1-based current day. After the trip: all days.
    elapsedDays = daysSinceStart < 0 ? 0 : Math.min(totalDays, daysSinceStart + 1);
  }

  const remainingDays = Math.max(1, totalDays - elapsedDays);
  const dailyDivisor = elapsedDays > 0 ? elapsedDays : totalDays;
  const dailyAvg = dailyDivisor > 0 ? totalSpent / dailyDivisor : 0;
  const remainingDailyAllowance = remaining > 0 ? remaining / remainingDays : 0;

  return {
    approvedLimit,
    totalSpent,
    remaining,
    spentPercent,
    remainingPercent,
    categoryTotals,
    categoryCaps,
    totalDays,
    elapsedDays,
    remainingDays,
    dailyAvg,
    remainingDailyAllowance,
    isNearLimit: budgetState === 'warning',
    isOverBudget: budgetState === 'danger',
    transactionCount: expenses.length,
  };
}
