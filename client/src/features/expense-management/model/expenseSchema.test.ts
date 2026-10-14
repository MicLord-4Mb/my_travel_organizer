import { describe, it, expect } from 'vitest';
import { expenseSchema, type ExpenseFormData } from './expenseSchema';

describe('expenseSchema validation', () => {
  const validExpense: ExpenseFormData = {
    title: 'Dinner at Shibuya Ramen',
    amount: 35.5,
    currency: 'USD',
    category: 'dining',
    date: '2026-10-16',
    placeEventId: 'event-101',
    paymentMethod: 'Credit Card',
    notes: 'Delicious tonkotsu bowl',
    dayIndex: 1,
  };

  it('validates a complete and correct expense object', () => {
    const result = expenseSchema.safeParse(validExpense);
    expect(result.success).toBe(true);
  });

  describe('title validation', () => {
    it('fails when title is empty or only whitespace', () => {
      const emptyResult = expenseSchema.safeParse({ ...validExpense, title: '' });
      expect(emptyResult.success).toBe(false);

      const whitespaceResult = expenseSchema.safeParse({ ...validExpense, title: '    ' });
      expect(whitespaceResult.success).toBe(false);
    });

    it('fails when title exceeds 100 characters', () => {
      const result = expenseSchema.safeParse({
        ...validExpense,
        title: 'M'.repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is too long (maximum 100 characters)');
      }
    });
  });

  describe('amount validation and preprocessing', () => {
    it('accepts string input and parses into number', () => {
      const result = expenseSchema.safeParse({
        ...validExpense,
        amount: '42.99' as any,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(42.99);
      }
    });

    it('rejects zero amount', () => {
      const result = expenseSchema.safeParse({ ...validExpense, amount: 0 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Amount must be strictly greater than 0');
      }
    });

    it('rejects negative amount', () => {
      const result = expenseSchema.safeParse({ ...validExpense, amount: -15 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Amount must be strictly greater than 0');
      }
    });

    it('fails when amount is missing or empty string', () => {
      const result = expenseSchema.safeParse({ ...validExpense, amount: '' as any });
      expect(result.success).toBe(false);
    });
  });

  describe('category validation', () => {
    it('fails with invalid category string', () => {
      const result = expenseSchema.safeParse({
        ...validExpense,
        category: 'unsupported-category' as any,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('notes length validation', () => {
    it('fails when notes exceed 300 characters', () => {
      const result = expenseSchema.safeParse({
        ...validExpense,
        notes: 'X'.repeat(301),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Notes are too long (maximum 300 characters)');
      }
    });
  });
});
