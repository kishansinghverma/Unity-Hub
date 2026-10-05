import type { FastifyPluginAsync } from 'fastify';
import type { MongoOperation } from './mongo.operations.js';

export const mongoRoutes: FastifyPluginAsync = async (app) => {
  const operations = app.container.resolve<MongoOperation>('mongoOperation');

  app.get('/setup', async () => operations.setup());
};
