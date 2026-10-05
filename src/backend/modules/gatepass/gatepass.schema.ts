import { z } from 'zod';

export const idSchema = z
  .object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId') })
  .strict();

export const partySchema = z
  .object({
    name: z.string().trim().min(3),
    mandi: z.string().trim().min(3),
    state: z.string().trim().min(3),
    stateCode: z.number(),
    distance: z.number(),
    licenceNumber: z
      .string()
      .trim()
      .transform((value) => (value === '' ? undefined : value))
      .optional(),
  })
  .strict();

const numberField = z
  .union([
    z.number(),
    z.string().trim().min(1).transform((value) => Number(value)).refine(Number.isFinite),
  ])
  .pipe(z.number());

const partyField = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}, partySchema);

const storageImageSchema = z.object({
  buffer: z.instanceof(Buffer),
  filename: z.string().regex(/\.(jpe?g|png|heif|heic)$/i, 'Unsupported file provided')
}).strict();

export const finalizeGatepassSchema = z
  .object({
    gatepassId: z.string().trim().optional(),
    ninerId: z.string().trim().optional(),
    rate: z.union([z.string().trim().min(1), z.literal(0)]).optional(),
  })
  .strict();

export const createGatepassSchema = z
  .object({
    date: z.iso.datetime({ offset: true }),
    seller: z.string().trim().min(3),
    weight: numberField,
    bags: numberField,
    vehicleNumber: z.string().trim().min(6),
    vehicleType: numberField.pipe(z.number().max(4)),
    party: partyField,
    vehicleImage: storageImageSchema.optional(),
    plateImage: storageImageSchema.optional(),
  })
  .strict();

export const gatepassValidationSchemas = {
  'POST /api/gatepasses/push': { body: createGatepassSchema },
  'PATCH /api/gatepasses/finalize': { body: finalizeGatepassSchema },
  'GET /api/gatepasses/requeue/:id': { params: idSchema },
  'DELETE /api/gatepasses/:id': { params: idSchema },
  'POST /api/gatepasses/parties': { body: partySchema },
  'PATCH /api/gatepasses/parties/:id': { body: partySchema, params: idSchema },
  'DELETE /api/gatepasses/parties/:id': { params: idSchema },
};
