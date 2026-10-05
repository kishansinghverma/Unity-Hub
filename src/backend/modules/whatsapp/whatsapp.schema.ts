import { z } from 'zod';

const sendMessageSchema = z.object({
  message: z.string().min(1)
}).strict();

const storageFileSchema = z.object({
  buffer: z.instanceof(Buffer),
  filename: z.string().min(1)
}).strict();

const sendFileUrlSchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().min(1),
  caption: z.string().optional()
}).strict();

const sendFileMultipartSchema = z.object({
  file: storageFileSchema,
  caption: z.string().optional()
}).strict();

const sendFileSchema = z.union([sendFileUrlSchema, sendFileMultipartSchema], {
  error: 'Provide either one file or a file URL'
});

export const whatsappValidationSchemas = {
  'POST /api/whatsapp/sendtext/emandi': { body: sendMessageSchema },
  'POST /api/whatsapp/sendtext/unityhub': { body: sendMessageSchema },
  'POST /api/whatsapp/sendfile/emandi': { body: sendFileSchema },
  'POST /api/whatsapp/sendfile/unityhub': { body: sendFileSchema }
};
