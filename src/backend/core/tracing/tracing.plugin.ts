import fp from 'fastify-plugin';
import { createLogger } from '../logging/logger.js';
import { LogSource } from '../logging/log-sources.js';

export const tracingPlugin = fp(
  async (app) => {
    const httpLogger = createLogger(app.log).for(LogSource.HTTP);

    app.addHook('onRequest', async (request, reply) => {
      reply.header('x-request-id', request.id);
      httpLogger.info(`${request.method} ${request.url} | TraceId: ${request.id}`);
    });
  },
  { name: 'tracing' },
);
