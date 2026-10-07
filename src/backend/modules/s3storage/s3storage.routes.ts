import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { S3StorageOperation } from './s3storage.operations.js';
import { FileUtils } from '../../core/utils/file.js';

export const s3StorageRoutes: FastifyPluginAsync = async (app) => {
  const operations = app.container.resolve<S3StorageOperation>('s3StorageOperation');

  app.get<{ Querystring: { path: string } }>('/get', async (request, reply) => {
    const path = request.query.path;
    const file = await operations.download(path);
    
    return reply.type(FileUtils.GetMimeType(path)).send(file);
  });
};
