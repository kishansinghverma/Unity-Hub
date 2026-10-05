import { z } from 'zod';

const numericIdentifier = z.string().regex(/^[1-9]\d*$/, 'Must be a positive numeric value');
const commandSchema = z.object({
  commandId: numericIdentifier,
  remoteId: z.union([numericIdentifier, z.number().int().positive()])
}).strict();

export const oakterRemoteValidationSchemas = {
  'POST /api/oakter-remote/commands': { body: commandSchema }
};
