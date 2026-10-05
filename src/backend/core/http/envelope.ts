import { z } from 'zod';

export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});
const metaSchema = z.object({ traceId: z.string() });
export const errorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional() }),
  meta: metaSchema,
});

export function successEnvelopeSchema<Schema extends z.ZodType>(schema: Schema) {
  return z.object({ success: z.literal(true), data: schema, meta: metaSchema });
}

export function listEnvelopeSchema<Schema extends z.ZodType>(schema: Schema) {
  return z.object({
    success: z.literal(true),
    data: z.array(schema),
    meta: metaSchema.extend({ pagination: paginationMetaSchema }),
  });
}

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
export type SuccessEnvelope<Data> = z.infer<
  ReturnType<typeof successEnvelopeSchema<z.ZodType<Data>>>
>;
export type ListEnvelope<Data> = z.infer<ReturnType<typeof listEnvelopeSchema<z.ZodType<Data>>>>;

export function success<Data>(data: Data, traceId: string): SuccessEnvelope<Data> {
  return { success: true, data, meta: { traceId } };
}

export function successList<Data>(
  data: Data[],
  traceId: string,
  pagination: PaginationMeta,
): ListEnvelope<Data> {
  return { success: true, data, meta: { traceId, pagination } };
}

export function failure(
  code: string,
  message: string,
  traceId: string,
  details?: unknown,
): ErrorEnvelope {
  return {
    success: false,
    error: { code, message, ...(details === undefined ? {} : { details }) },
    meta: { traceId },
  };
}

export const errorResponses = { '4xx': errorEnvelopeSchema, '5xx': errorEnvelopeSchema };
