import {parseLocalDate} from "@shared/lib/date";
import { z } from 'zod';
import { TRIP_STATUS_OPTIONS } from '@entities/trip';

type TripStatusValue = (typeof TRIP_STATUS_OPTIONS)[number]['value'];
const statuses = TRIP_STATUS_OPTIONS.map((o) => o.value) as [
  TripStatusValue,
  ...TripStatusValue[]
];


/**
 * Validation schema for Trip creation and edit forms.
 *
 * Validates:
 * - Title length (2 to 80 chars)
 * - Required destination location
 * - Valid start and end dates with temporal constraint (`endDate >= startDate`)
 * - Non-negative optional budget limit (preprocessed to handle empty strings or NaN)
 * - Currency code ISO format
 */
export const tripSchema = z
  .object({
    /** Human-readable trip title */
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .min(2, 'Title must be at least 2 characters')
      .max(80, 'Title is too long'),
    /** Optional detailed memo or notes */
    description: z.string().optional(),
    /** Destination city, country, or region */
    location: z.string().min(2, 'Location is required'),
    /** Trip start date in YYYY-MM-DD format */
    startDate: z.string().min(1, 'Start date is required'),
    /** Trip end date in YYYY-MM-DD format */
    endDate: z.string().min(1, 'End date is required'),
    /** Current trip lifecycle status */
    status: z.enum(statuses),
    /** Optional financial budget limit in base currency */
    budgetLimit: z.preprocess((val) => {
      if (val === '' || val === null || val === undefined || (typeof val === 'number' && isNaN(val))) return undefined;
      return Number(val);
    }, z.number().min(0, 'Budget must be a non-negative number').optional()),
    /** Base ISO 4217 currency code */
    currency: z.string().min(1, 'Currency is required'),
    /** Cover photo image URL */
    coverImageUrl: z
      .string()
      .url('Cover image must be a valid URL')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      const start = parseLocalDate(data.startDate);
      const end = parseLocalDate(data.endDate);
      if (start && end) {
        return end.getTime() >= start.getTime();
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

/**
 * Inferred TypeScript shape of the validated Trip form data.
 */
export type TripFormData = z.infer<typeof tripSchema>;
