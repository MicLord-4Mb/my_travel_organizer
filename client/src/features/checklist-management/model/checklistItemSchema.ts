import { z } from 'zod';

/**
 * Validation schema for individual checklist and luggage packing items.
 *
 * Enforces:
 * - Title length (2 to 100 characters)
 * - Item phase type ('pretrip' vs 'luggage')
 * - Category classification ('documents', 'bookings', 'insurance', 'clothes', 'gear', 'meds', 'tasks')
 * - Priority level ('high', 'normal', 'optional')
 * - Quantity constraint (1 to 99)
 */
export const checklistItemSchema = z.object({
  /** Item description or name */
  title: z.string().min(2, 'Title must be at least 2 characters').max(100, 'Title is too long'),
  /** Phase type: pre-departure preparation vs luggage packing */
  type: z.enum(['pretrip', 'luggage']),
  /** Organizational category */
  category: z.enum(['documents', 'bookings', 'insurance', 'clothes', 'gear', 'meds', 'tasks']),
  /** Priority urgency */
  priority: z.enum(['high', 'normal', 'optional']),
  /** Optional pack quantity */
  quantity: z.number().min(1).max(99).optional(),
});

/**
 * Inferred TypeScript shape of the validated checklist item form payload.
 */
export type ChecklistItemFormData = z.infer<typeof checklistItemSchema>;
