import type { FastifyPluginAsync } from 'fastify';
import type { ImagingOperation } from './imaging.operations.js';
import type { ExtractTextRequest } from './imaging.types.js';

export const imagingRoutes: FastifyPluginAsync = async (app) => {
  const operations = app.container.resolve<ImagingOperation>('imagingOperation');

  app.post<ExtractTextRequest>('/captcha', async (request) => operations.extractText(request.body.base64string));
};
