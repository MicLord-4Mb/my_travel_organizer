import { z } from 'zod';
import { CHECKLIST_TYPE_OPTIONS, CHECKLIST_CATEGORIES_BY_TYPE, CHECKLIST_PRIORITY_OPTIONS } from '@entities/checklist';

type ChecklistTypeValue = (typeof CHECKLIST_TYPE_OPTIONS)[number]['value'];
const types = CHECKLIST_TYPE_OPTIONS.map((o) => o.value) as [
  ChecklistTypeValue,
  ...ChecklistTypeValue[]
];

type ChecklistCategoryValue =
  | (typeof CHECKLIST_CATEGORIES_BY_TYPE.pretrip)[number]['value']
  | (typeof CHECKLIST_CATEGORIES_BY_TYPE.luggage)[number]['value'];
const categories = [
  ...CHECKLIST_CATEGORIES_BY_TYPE.pretrip.map((o) => o.value),
  ...CHECKLIST_CATEGORIES_BY_TYPE.luggage.map((o) => o.value),
] as [ChecklistCategoryValue, ...ChecklistCategoryValue[]];

type ChecklistPriorityValue = (typeof CHECKLIST_PRIORITY_OPTIONS)[number]['value'];
const priorities = CHECKLIST_PRIORITY_OPTIONS.map((o) => o.value) as [
  ChecklistPriorityValue,
  ...ChecklistPriorityValue[]
];


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
  type: z.enum(types),
  /** Organizational category */
  category: z.enum(categories),
  /** Priority urgency */
  priority: z.enum(priorities),
  /** Optional pack quantity */
  quantity: z.number().min(1).max(99).optional(),
});

/**
 * Inferred TypeScript shape of the validated checklist item form payload.
 */
export type ChecklistItemFormData = z.infer<typeof checklistItemSchema>;
