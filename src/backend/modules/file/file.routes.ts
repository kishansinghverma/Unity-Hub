import type { FastifyPluginAsync } from 'fastify';
import type { FileOperation } from './file.operations.js';
import type { FileUpload } from './file.types.js';

type UploadRequest = { Body: { file: FileUpload } };

export const fileRoutes: FastifyPluginAsync = async (app) => {
  const operations = app.container.resolve<FileOperation>('fileOperation');

  app.post<UploadRequest>('/', async (request) => operations.saveIncomingFile(request.body.file));

  app.get<{ Params: { fileName: string } }>('/:fileName', async (request, reply) => {
    const file = await operations.readFile(request.params.fileName);
    return reply.type('application/pdf').send(file);
  });
};
