import type { FastifyPluginAsync } from 'fastify';
import type { OakterRemoteOperation } from './oakterRemote.operations.js';
import type { OakterCommandRequest } from './oakterRemote.types.js';

export const oakterRemoteRoutes: FastifyPluginAsync = async (app) => {
  const operations = app.container.resolve<OakterRemoteOperation>('oakterRemoteOperation');

  app.get('/status', async () => operations.status());
  app.get('/devices', async () => operations.devices());
  app.get('/sync', async () => operations.sync());
  app.post<{ Body: OakterCommandRequest }>('/commands', async (request) => operations.command(request.body));
};
