import Fastify, { LogController } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadEnv } from './config/env.js';
import type { Env } from './config/env.js';
import { buildContainer } from './core/di/container.js';
import { generateRequestId } from './core/tracing/trace-context.js';
import { tracingPlugin } from './core/tracing/tracing.plugin.js';
import { validationPlugin } from './core/validation/validation.plugin.js';
import { multipartPlugin } from './core/http/multipart.plugin.js';
import { registerErrorHandlers } from './core/errors/error-handler.js';
import { actionResponseHook } from './core/http/action-response.js';
import { createLogger } from './core/logging/logger.js';
import { mongoRoutes } from './modules/mongo/mongo.routes.js';
import { gatepassRoutes } from './modules/gatepass/gatepass.routes.js';
import { whatsappRoutes } from './modules/whatsapp/whatsapp.routes.js';
import { imagingRoutes } from './modules/imaging/imaging.routes.js';
import { fileRoutes } from './modules/file/file.routes.js';
import { emandiRoutes } from './modules/emandi/emandi.routes.js';
import { vehicleTaggingRoutes } from './modules/vehicleTagging/vehicleTagging.routes.js';
import { oakterRemoteRoutes } from './modules/oakterRemote/oakterRemote.routes.js';

export async function buildApp(config: Env = loadEnv()) {
  const app = Fastify({
    bodyLimit: config.BODY_LIMIT,
    requestIdHeader: false,
    genReqId: generateRequestId,
    logController: new LogController({ disableRequestLogging: true }),
    logger: {
      level: config.LOG_LEVEL,
      redact: {
        paths: [
          'authorization',
          'cookie',
          'password',
          '*.authorization',
          '*.cookie',
          '*.password',
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'body.password',
        ],
        censor: '[REDACTED]',
      },
      ...(config.NODE_ENV === 'development'
        ? {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:standard' },
            },
          }
        : {}),
    },
  }).withTypeProvider<ZodTypeProvider>();
  const container = buildContainer(config, createLogger(app.log));
  app.decorate('container', container);
  app.addHook('onClose', async () => {
    await container.resolve('mongoService').close();
    await container.dispose();
  });

  try {
    await app.register(tracingPlugin);
    const origins = config.CORS_ORIGIN ?? (config.NODE_ENV === 'development' ? ['*'] : []);
    await app.register(cors, {
      origin: origins.includes('*') ? '*' : origins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      exposedHeaders: ['x-request-id'],
    });
    await app.register(multipartPlugin, { config });
    await app.register(validationPlugin);
    registerErrorHandlers(app);
    app.addHook('preSerialization', actionResponseHook);

    const frontendRoot = [
      path.resolve('dist/frontends/emandi'),
      path.resolve('src/frontends/emandi/build')
    ].find(existsSync);

    if (frontendRoot) {
      await app.register(fastifyStatic, { root: frontendRoot, prefix: '/emandi/', decorateReply: true, wildcard: false });
      await app.register(fastifyStatic, { root: frontendRoot, prefix: '/remote/', decorateReply: false, wildcard: false });
      app.get('/emandi', async (_request, reply) => reply.sendFile('index.html'));
      app.get('/emandi/*', async (_request, reply) => reply.sendFile('index.html'));
      app.get('/remote', async (_request, reply) => reply.sendFile('index.html'));
      app.get('/remote/*', async (_request, reply) => reply.sendFile('index.html'));
    }

    await app.register(gatepassRoutes, { prefix: '/api/gatepasses' });
    await app.register(mongoRoutes, { prefix: '/api/mongo' });
    await app.register(whatsappRoutes, { prefix: '/api/whatsapp' });
    await app.register(imagingRoutes, { prefix: '/api/imaging' });
    await app.register(fileRoutes, { prefix: '/api/files' });
    await app.register(emandiRoutes, { prefix: '/api/emandi' });
    await app.register(vehicleTaggingRoutes, { prefix: '/api/vehicle-tagging' });
    await app.register(oakterRemoteRoutes, { prefix: '/api/oakter-remote' });

    return app;
  } catch (error) {
    await app.close();
    throw error;
  }
}
