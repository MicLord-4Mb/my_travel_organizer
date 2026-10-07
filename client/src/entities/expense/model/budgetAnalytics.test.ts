import { describe, it, expect } from 'vitest';
import { computeBudgetAnalytics } from './budgetAnalytics';
import type { Expense, Trip } from '@shared/types/models';

describe('computeBudgetAnalytics', () => {
  const mockTrip: Trip = {
    id: 'trip-1',
    title: 'Tokyo Journey',
    startDate: '2026-10-10',
    endDate: '2026-10-19', // 10 days inclusive
    status: 'planned',
    budgetLimit: 2000,
    currency: 'USD',
    spentBudget: 0,
    packedCount: 0,
    totalChecklistCount: 0,
    categoryBudgets: {
      dining: 500,
      lodging: 1000,
      transport: 300,
      activities: 200,
    },
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('calculates zero state correctly when there are no expenses', () => {
    const analytics = computeBudgetAnalytics([], mockTrip, undefined, 'USD', new Date('2026-10-01'));

    expect(analytics.approvedLimit).toBe(2000);
    expect(analytics.totalSpent).toBe(0);
    expect(analytics.remaining).toBe(2000);
    expect(analytics.spentPercent).toBe(0);
    expect(analytics.remainingPercent).toBe(100);
    expect(analytics.isNearLimit).toBe(false);
    expect(analytics.isOverBudget).toBe(false);
    expect(analytics.transactionCount).toBe(0);
    expect(analytics.categoryTotals.dining).toBe(0);
    expect(analytics.categoryCaps.dining).toBe(500);
  });

  it('aggregates expenses and normalizes category aliases correctly', () => {
    const mockExpenses: Expense[] = [
      {
        id: 'e1',
        tripId: 'trip-1',
        title: 'Shinkansen',
        amount: 150,
        currency: 'USD',
        category: 'transport',
        date: '2026-10-11',
        createdAt: '2026-10-11',
        updatedAt: '2026-10-11',
      },
      {
        id: 'e2',
        tripId: 'trip-1',
        title: 'Sushi dinner',
        amount: 80,
        currency: 'USD',
        category: 'food', // alias for dining
        date: '2026-10-11',
        createdAt: '2026-10-11',
        updatedAt: '2026-10-11',
      },
      {
        id: 'e3',
        tripId: 'trip-1',
        title: 'Ramen lunch',
        amount: 20,
        currency: 'USD',
        category: 'dining',
        date: '2026-10-12',
        createdAt: '2026-10-12',
        updatedAt: '2026-10-12',
      },
      {
        id: 'e4',
        tripId: 'trip-1',
        title: 'Hotel Shibuya',
        amount: 600,
        currency: 'USD',
        category: 'lodging',
        date: '2026-10-10',
        createdAt: '2026-10-10',
        updatedAt: '2026-10-10',
      },
    ];

    const analytics = computeBudgetAnalytics(mockExpenses, mockTrip, undefined, 'USD', new Date('2026-10-12'));

    expect(analytics.totalSpent).toBe(850);
    expect(analytics.remaining).toBe(1150);
    expect(analytics.spentPercent).toBe(42.5);
    expect(analytics.transactionCount).toBe(4);
    expect(analytics.categoryTotals.transport).toBe(150);
    expect(analytics.categoryTotals.dining).toBe(100); // 80 + 20
    expect(analytics.categoryTotals.lodging).toBe(600);
  });

  it('converts multi-currency expenses using exchange rates', () => {
    const rates = {
      USD: 1,
      EUR: 0.9, // 1 USD = 0.9 EUR => 1 EUR = 1.111 USD
      JPY: 150, // 1 USD = 150 JPY
    };

    const expenses: Expense[] = [
      {
        id: 'e1',
        tripId: 'trip-1',
        title: 'Metro card',
        amount: 1500, // 1500 JPY / 150 = 10 USD
        currency: 'JPY',
        category: 'transport',
        date: '2026-10-11',
        createdAt: '2026-10-11',
        updatedAt: '2026-10-11',
      },
      {
        id: 'e2',
        tripId: 'trip-1',
        title: 'Duty free shop',
        amount: 100, // 100 USD
        currency: 'USD',
        category: 'shopping',
        date: '2026-10-11',
        createdAt: '2026-10-11',
        updatedAt: '2026-10-11',
      },
    ];

    const analytics = computeBudgetAnalytics(expenses, mockTrip, rates, 'USD', new Date('2026-10-11'));

    expect(analytics.totalSpent).toBe(110);
    expect(analytics.categoryTotals.transport).toBe(10);
    expect(analytics.categoryTotals.shopping).toBe(100);
  });

  it('triggers isNearLimit when spend is between 90% and 100%', () => {
    const nearLimitExpenses: Expense[] = [
      {
        id: 'e1',
        tripId: 'trip-1',
        title: 'Expenses',
        amount: 1850, // 1850 / 2000 = 92.5%
        currency: 'USD',
        category: 'other',
        date: '2026-10-12',
        createdAt: '2026-10-12',
        updatedAt: '2026-10-12',
      },
    ];

    const analytics = computeBudgetAnalytics(nearLimitExpenses, mockTrip, undefined, 'USD', new Date('2026-10-12'));

    expect(analytics.isNearLimit).toBe(true);
    expect(analytics.isOverBudget).toBe(false);
  });

  it('triggers isOverBudget when spend exceeds approved limit', () => {
    const overBudgetExpenses: Expense[] = [
      {
        id: 'e1',
        tripId: 'trip-1',
        title: 'Luxury Dinner',
        amount: 2100, // > 2000
        currency: 'USD',
        category: 'dining',
        date: '2026-10-15',
        createdAt: '2026-10-15',
        updatedAt: '2026-10-15',
      },
    ];

    const analytics = computeBudgetAnalytics(overBudgetExpenses, mockTrip, undefined, 'USD', new Date('2026-10-15'));

    expect(analytics.isNearLimit).toBe(false);
    expect(analytics.isOverBudget).toBe(true);
    expect(analytics.remaining).toBe(-100);
  });

  it('computes daily average and remaining allowance based on timeline', () => {
    // 2026-10-10 to 2026-10-19 = 10 total days
    // When now is 2026-10-12: day 3 of 10 => elapsedDays = 3, remainingDays = 7
    const now = new Date('2026-10-12T12:00:00Z');
    const expenses: Expense[] = [
      {
        id: 'e1',
        tripId: 'trip-1',
        title: 'Meals & transit',
        amount: 300,
        currency: 'USD',
        category: 'dining',
        date: '2026-10-12',
        createdAt: '2026-10-12',
        updatedAt: '2026-10-12',
      },
    ];

    const analytics = computeBudgetAnalytics(expenses, mockTrip, undefined, 'USD', now);

    expect(analytics.totalDays).toBe(10);
    expect(analytics.elapsedDays).toBe(3);
    expect(analytics.remainingDays).toBe(7);
    expect(analytics.dailyAvg).toBe(100); // 300 spent over 3 days = 100/day
    // Remaining budget = 1700 over 7 remaining days
    expect(analytics.remainingDailyAllowance).toBeCloseTo(1700 / 7, 2);
  });

  it('handles null or missing trip safely without throwing', () => {
    const analytics = computeBudgetAnalytics([], null);

    expect(analytics.approvedLimit).toBe(0);
    expect(analytics.totalSpent).toBe(0);
    expect(analytics.remaining).toBe(0);
    expect(analytics.totalDays).toBe(0);
    expect(analytics.isNearLimit).toBe(false);
    expect(analytics.isOverBudget).toBe(false);
  });
});
