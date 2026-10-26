import type { FastifyPluginAsync } from 'fastify';
import type { EmandiOperation } from './emandi.operations.js';
import type { GatepassRequest, NinerRequest } from './emandi.types.js';

export const emandiRoutes: FastifyPluginAsync = async (app) => {
  const operations = app.container.resolve<EmandiOperation>('emandiOperation');

  app.post<{ Body: GatepassRequest }>('/gatepasses', async (request) => operations.executeGatepassRequest(request.body));
  app.post<{ Body: NinerRequest }>('/niners', async (request) => operations.executeNinerRequest(request.body));
};
