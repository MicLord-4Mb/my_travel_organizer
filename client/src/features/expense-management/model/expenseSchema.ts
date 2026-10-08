import { z } from 'zod';
import { EXPENSE_CATEGORY_OPTIONS } from '@entities/expense';

type ExpenseCategoryValue = (typeof EXPENSE_CATEGORY_OPTIONS)[number]['value'];
const categories = EXPENSE_CATEGORY_OPTIONS.map((o) => o.value) as [
  ExpenseCategoryValue,
  ...ExpenseCategoryValue[]
];


/**
 * Validation schema for expense entry and modification forms.
 *
 * Validates:
 * - Merchant name or title (required, max 100 characters)
 * - Amount strictly greater than zero (with string-to-number preprocessing)
 * - ISO currency code
 * - Canonical expense category
 * - Transaction date (YYYY-MM-DD)
 * - Optional link to itinerary stop (`placeEventId`), payment method, notes, and day index
 */
export const expenseSchema = z.object({
  /** Transaction label or merchant name */
  title: z
    .string()
    .trim()
    .min(1, 'Description or merchant name is required')
    .max(100, 'Title is too long (maximum 100 characters)'),
  /** Positive transaction amount */
  amount: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined || (typeof val === 'number' && isNaN(val))) return undefined;
    return Number(val);
  }, z.number().positive('Amount must be strictly greater than 0')),
  /** ISO 4217 transaction currency code */
  currency: z
    .string()
    .min(1, 'Currency is required'),
  /** Budget categorization */
  category: z.enum(categories),
  /** Calendar date of transaction (YYYY-MM-DD) */
  date: z
    .string()
    .min(1, 'Transaction date is required'),
  /** Optional relation pointing to an itinerary stop */
  placeEventId: z.string().optional(),
  /** Payment method descriptor (e.g. 'Credit Card', 'Cash') */
  paymentMethod: z.string().optional(),
  /** Optional transaction memo */
  notes: z.string().max(300, 'Notes are too long (maximum 300 characters)').optional(),
  /** Zero-based trip day index */
  dayIndex: z.coerce.number().optional(),
});

/**
 * Inferred TypeScript shape of the validated expense form payload.
 */
export type ExpenseFormData = z.infer<typeof expenseSchema>;
