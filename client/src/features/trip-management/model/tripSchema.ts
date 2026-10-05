import { z } from 'zod';

export const tripSchema = z
  .object({
    title: z.string().min(2, 'Title must be at least 2 characters').max(80, 'Title is too long'),
    description: z.string().optional(),
    location: z.string().min(2, 'Location is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']),
    budgetLimit: z.number().min(0, 'Budget must be a non-negative number').optional(),
    currency: z.string().min(1, 'Currency is required'),
    coverImageUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

export type TripFormData = z.infer<typeof tripSchema>;
