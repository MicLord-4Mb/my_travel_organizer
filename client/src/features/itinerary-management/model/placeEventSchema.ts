import { z } from 'zod';
import { EVENT_CATEGORY_OPTIONS } from '@entities/itinerary';

type EventCategoryValue = (typeof EVENT_CATEGORY_OPTIONS)[number]['value'];
const categories = EVENT_CATEGORY_OPTIONS.map((o) => o.value) as [
  EventCategoryValue,
  ...EventCategoryValue[]
];


/**
 * Validation schema for itinerary stops, activities, and transit event forms.
 *
 * Enforces:
 * - Event title length (2 to 100 characters)
 * - Valid event category ('transport', 'lodging', 'activities', 'dining')
 * - Non-negative day index
 * - Valid 24h military time regex (HH:mm) with start/end temporal precedence validation
 * - Optional numeric cost and GPS coordinates
 * - Maximum note length of 500 characters
 */
export const placeEventSchema = z.object({
  /** Event title or landmark name */
  title: z
    .string()
    .min(2, { message: 'Title must be at least 2 characters' })
    .max(100, { message: 'Title is too long (max 100 characters)' }),
  /** Category classification */
  category: z.enum(categories, {
    message: 'Please select a valid category',
  }),
  /** Zero-based day index relative to trip start */
  dayIndex: z.coerce.number().min(0, { message: 'Day index must be 0 or greater' }),
  /** Optional start time string (HH:mm) */
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Valid format is HH:mm (e.g. 09:30)' })
    .or(z.literal(''))
    .optional(),
  /** Optional end time string (HH:mm) */
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Valid format is HH:mm (e.g. 11:00)' })
    .or(z.literal(''))
    .optional(),
  /** Optional estimated cost */
  cost: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined || (typeof val === 'number' && isNaN(val))) return undefined;
    return Number(val);
  }, z.number().min(0, { message: 'Cost cannot be negative' }).optional()),
  /** Currency code for event cost */
  currency: z.string().default('USD'),
  /** Name of location or venue */
  locationName: z.string().optional(),
  /** Physical street address */
  address: z.string().optional(),
  /** Latitude coordinate (-90 to 90) */
  lat: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined || (typeof val === 'number' && isNaN(val))) return undefined;
    return Number(val);
  }, z.number().optional().nullable()),
  /** Longitude coordinate (-180 to 180) */
  lng: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined || (typeof val === 'number' && isNaN(val))) return undefined;
    return Number(val);
  }, z.number().optional().nullable()),
  /** Optional notes or tips */
  notes: z.string().max(500, { message: 'Notes must be within 500 characters' }).optional(),
  /** Reservation confirmation or booking code */
  bookingRef: z.string().max(50, { message: 'Booking ref is too long' }).optional(),
}).refine(data => {
  if (data.startTime && data.endTime && data.startTime !== '' && data.endTime !== '') {
    return data.endTime > data.startTime;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['endTime']
});

/**
 * Inferred TypeScript shape of the validated place event form payload.
 */
export type PlaceEventFormData = z.infer<typeof placeEventSchema>;
