import { z } from 'zod';

export const idParamSchema = z.object({ id: z.uuid() }).strict();
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(Number.MAX_SAFE_INTEGER).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const fileBufferSchema = z.instanceof(Buffer).refine((buffer) => buffer.length > 0, {
  message: 'File must not be empty',
});
export const booleanSchema = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => (typeof value === 'string' ? value === 'true' : value))
  .pipe(z.coerce.boolean());
