import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Use DD/MM/YYYY');
const positiveIntegerSchema = z.coerce.number().int().positive();

const taggingQuerySchema = z.object({
  fromDate: dateSchema,
  toDate: dateSchema,
  mobileNumber: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number').optional(),
  instrumentType: positiveIntegerSchema.transform(String)
}).strict();

const vehicleQuerySchema = z.object({ gatepassId: z.string().min(1) }).strict();

const taggingRequestSchema = z.object({
  contactNumber: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit contact number').optional(),
  instrumentNumber: z.string().min(1),
  instrumentType: positiveIntegerSchema,
  instrumentTypeName: z.string().min(1),
  vehicleTypeId: positiveIntegerSchema,
  vehicleTypeName: z.string().min(1),
  vehicleNumber: z.string().min(1),
  latitude: z.string().min(1),
  longitude: z.string().min(1),
  ipAddress: z.string().min(1),
  vehicleImage: z.string().min(1),
  vehicleFullImage: z.string().min(1)
}).strict();

export const vehicleTaggingValidationSchemas = {
  'GET /api/vehicle-tagging/vehicles': { query: vehicleQuerySchema },
  'GET /api/vehicle-tagging/entries': { query: taggingQuerySchema },
  'POST /api/vehicle-tagging/entries': { body: taggingRequestSchema }
};
