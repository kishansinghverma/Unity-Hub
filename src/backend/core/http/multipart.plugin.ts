import multipart from '@fastify/multipart';
import formbody from '@fastify/formbody';
import fp from 'fastify-plugin';
import type { Env } from '../../config/env.js';

export const multipartPlugin = fp<{ config: Env }>(
  async (app, { config }) => {
    // For large uploads, provide multipart's onFile handler and await pipeline(part.file,
    // a disk/object-storage writable). Consume every stream, check part.file.truncated,
    // and remove partial objects on failure. Set part.value to stored-file metadata and
    // replace the route's Buffer schema with a metadata schema; onFile bypasses buffering.
    await app.register(multipart, {
      attachFieldsToBody: 'keyValues',
      throwFileSizeLimit: true,
      onFile: async (part) => {
        Object.assign(part, {
          value: { buffer: await part.toBuffer(), filename: part.filename },
        });
      },
      limits: { fileSize: config.MAX_FILE_SIZE, files: 2, fields: 7, parts: 9, fieldSize: 16384 },
    });
    await app.register(formbody);
  },
  { name: 'payload-parsers' },
);
