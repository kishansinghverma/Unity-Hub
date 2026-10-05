import type { FastifyPluginAsync } from 'fastify';
import type { GatepassOperation } from './gatepass.operations.js';
import type {
  CreatePartyRequest,
  DeletePartyRequest,
  DeleteQueuedRequest,
  FinalizeRequest,
  PushRequest,
  RequeueRequest,
  UpdatePartyRequest,
} from './gatepass.types.js';

export const gatepassRoutes: FastifyPluginAsync = async (app) => {
  const operations = app.container.resolve<GatepassOperation>('gatepassOperation');

  app.get('/queued', async () => operations.listQueued());

  app.get('/processed', async () => operations.listProcessed());

  app.get('/peek', async () => operations.peek());

  app.get('/pop', async () => operations.pop());

  app.post<PushRequest>('/push', async (request) => operations.push(request.body));

  app.patch<FinalizeRequest>('/finalize', async (request) => operations.finalize(request.body));

  app.get<RequeueRequest>('/requeue/:id', async (request) => operations.requeue(request.params.id));

  app.delete<DeleteQueuedRequest>('/:id', async (request) => operations.deleteQueued(request.params.id));

  app.get('/parties', async () => operations.listParties());

  app.post<CreatePartyRequest>('/parties', async (request) => operations.addParty(request.body));

  app.patch<UpdatePartyRequest>('/parties/:id', async (request) => operations.updateParty(request.params.id, request.body));

  app.delete<DeletePartyRequest>('/parties/:id', async (request) => operations.deleteParty(request.params.id));
};
