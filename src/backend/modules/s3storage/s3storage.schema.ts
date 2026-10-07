import { z } from 'zod';

const getFileQuerySchema = z.object({ path: z.string().trim().min(1) }).strict();

export const s3StorageValidationSchemas = {
  'GET /api/s3/get': { query: getFileQuerySchema }
};
