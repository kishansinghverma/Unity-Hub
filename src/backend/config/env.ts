import 'dotenv/config';
import { z } from 'zod';

const originSchema = z
  .string()
  .url()
  .refine((value) => new URL(value).origin === value, {
    message: 'Use an origin without a path or trailing slash',
  });

const corsSchema = z
  .string()
  .transform((value) => value.split(',').map((origin) => origin.trim()))
  .pipe(z.union([z.tuple([z.literal('*')]), z.array(originSchema).min(1)]));

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: corsSchema.optional(),
  MAX_FILE_SIZE: z.coerce.number().int().positive().max(104857600).default(20971520),
  BODY_LIMIT: z.coerce.number().int().positive().max(104857600).default(1048576),
  MONGO_CONNECTION_STRING: z.string().min(1).default('mongodb://127.0.0.1:27017'),
  GREEN_API_URI: z.string().url().optional(),
  GREEN_API_FS: z.string().url().optional(),
  GREEN_API_INSTANCE_ID: z.string().min(1).optional(),
  GREEN_API_TOKEN: z.string().min(1).optional(),
  OCR_SPACE_API_KEY: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).optional(),
  VAULT_ENCRYPTION_KEY: z.string().min(1).optional(),
  VEHICLE_TAGGING_MOBILE_NUMBER: z.string().min(1).optional(),
  OAKTER_REMOTE_BASE_URL: z.string().url().optional(),
  OAKTER_RENEW_SESSION_URL: z.string().url().optional(),
  OAKTER_USERNAME: z.string().min(1).optional(),
  OAKTER_SESSION_ID: z.string().min(1).optional(),
  OAKTER_REMOTE_ID: z.string().min(1).optional(),
  OAKTER_AUTH_TOKEN: z.string().min(1).optional()
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
