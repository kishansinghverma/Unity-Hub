import { z } from 'zod';

const base64Schema = z.string().refine((value) => {
  const encoded = value.startsWith('data:') ? value.match(/^data:[^;,]+;base64,(.+)$/)?.[1] : value;

  return encoded !== undefined && encoded.length > 0 && encoded.length % 4 === 0 &&
    /^[A-Za-z0-9+/]*={0,2}$/.test(encoded) && Buffer.from(encoded, 'base64').toString('base64') === encoded;
}, 'Invalid Base64 image');

const extractTextSchema = z.object({ base64string: base64Schema }).strict();

export const imagingValidationSchemas = {
  'POST /api/imaging/captcha': { body: extractTextSchema }
};
