import { describe, it, expect } from 'vitest';
import { checklistItemSchema, type ChecklistItemFormData } from './checklistItemSchema';

describe('checklistItemSchema validation', () => {
  const validItem: ChecklistItemFormData = {
    title: 'Passport & International Driving Permit',
    type: 'pretrip',
    category: 'documents',
    priority: 'high',
    quantity: 1,
  };

  it('validates a correct checklist item payload', () => {
    const result = checklistItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  describe('title validation', () => {
    it('fails when title is shorter than 2 characters', () => {
      const result = checklistItemSchema.safeParse({ ...validItem, title: 'P' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title must be at least 2 characters');
      }
    });

    it('fails when title exceeds 100 characters', () => {
      const result = checklistItemSchema.safeParse({
        ...validItem,
        title: 'X'.repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is too long');
      }
    });
  });

  describe('type and category validation', () => {
    it('accepts luggage packing item with clothes category', () => {
      const result = checklistItemSchema.safeParse({
        ...validItem,
        type: 'luggage',
        category: 'clothes',
        quantity: 5,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid checklist type', () => {
      const result = checklistItemSchema.safeParse({
        ...validItem,
        type: 'flight' as any,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('quantity validation', () => {
    it('permits undefined quantity', () => {
      const result = checklistItemSchema.safeParse({
        ...validItem,
        quantity: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('rejects quantity below 1', () => {
      const result = checklistItemSchema.safeParse({
        ...validItem,
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects quantity above 99', () => {
      const result = checklistItemSchema.safeParse({
        ...validItem,
        quantity: 100,
      });
      expect(result.success).toBe(false);
    });
  });
});
