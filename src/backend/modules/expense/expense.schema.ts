import { z } from 'zod';

export const locationSchema = z
  .object({
    dateTime: z.iso.datetime({ offset: true }),
    location: z.string().trim().min(1),
    coordinate: z.string().trim().min(1),
    processed: z.boolean().default(false),
  })
  .strict();

export const expenseValidationSchemas = {
  'POST /api/expenses/location': { body: locationSchema },
};
