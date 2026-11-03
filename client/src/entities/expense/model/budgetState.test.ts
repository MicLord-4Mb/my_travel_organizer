import { describe, it, expect } from 'vitest';
import { getBudgetState, getBudgetPercent } from './budgetAnalytics';

describe('getBudgetState', () => {
  it('is normal when there is no limit', () => {
    expect(getBudgetState(500, undefined)).toBe('normal');
    expect(getBudgetState(500, 0)).toBe('normal');
    expect(getBudgetState(500, null)).toBe('normal');
  });

  it('is normal below 90%', () => {
    expect(getBudgetState(89, 100)).toBe('normal');
  });

  it('is warning from 90% up to and including 100%', () => {
    expect(getBudgetState(90, 100)).toBe('warning');
    expect(getBudgetState(100, 100)).toBe('warning');
  });

  it('is danger strictly above 100%', () => {
    expect(getBudgetState(100.01, 100)).toBe('danger');
    expect(getBudgetState(140, 100)).toBe('danger');
  });
});

describe('getBudgetPercent', () => {
  it('does not cap deficits at 100%', () => {
    expect(getBudgetPercent(140, 100)).toBe(140);
  });

  it('returns 0 without a limit', () => {
    expect(getBudgetPercent(140, undefined)).toBe(0);
  });
});

