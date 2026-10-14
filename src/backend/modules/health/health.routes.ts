import type { FastifyPluginAsync } from 'fastify';
import type { HealthOperation } from './health.operations.js';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  const operations = app.container.resolve<HealthOperation>('healthOperation');

  app.get('/', async () => operations.getHealth());
};
