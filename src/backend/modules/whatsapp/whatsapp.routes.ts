import type { FastifyPluginAsync } from 'fastify';
import type { WhatsAppOperation } from './whatsapp.operations.js';
import type { SendFileRequest, SendMessageRequest } from './whatsapp.types.js';

export const whatsappRoutes: FastifyPluginAsync = async (app) => {
  const operations = app.container.resolve<WhatsAppOperation>('whatsappOperation');

  app.post<SendMessageRequest>('/sendtext/emandi', async (request) =>
    operations.sendMessageToEmandiGroup(request.body.message));

  app.post<SendMessageRequest>('/sendtext/unityhub', async (request) =>
    operations.sendMessageToUnityHubGroup(request.body.message));

  app.post<SendFileRequest>('/sendfile/emandi', async (request) =>
    operations.sendFileToEmandiGroup(request.body));

  app.post<SendFileRequest>('/sendfile/unityhub', async (request) =>
    operations.sendFileToUnityHubGroup(request.body));
};
