import pino from 'pino';
import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';
import { AppError } from './core/errors/app-error.js';
import { ErrorCodes } from './core/errors/error-codes.js';

const bootstrapLogger = pino({
  ...(process.env.NODE_ENV === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } } }
    : {})
});

const errorDetails = (error: unknown) => ({
  errorType: error instanceof AppError ? error.code : ErrorCodes.InternalError,
  message: error instanceof Error ? error.message : 'An unexpected error occurred'
});

async function main(): Promise<void> {
  const config = loadEnv();
  const app = await buildApp(config);
  const cronJobsService = app.container.resolve('cronJobsService');
  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    await cronJobsService.stop();
    app.log.info({ signal }, 'Shutting down');
    const timeout = setTimeout(() => {
      app.log.error('Graceful shutdown timed out');
      process.exit(1);
    }, 10000);
    timeout.unref();
    try {
      await app.close();
    } catch (error) {
      const details = errorDetails(error);
      app.log.error(details, `Shutdown failed :: ${details.message}`);
      process.exitCode = 1;
    } finally {
      clearTimeout(timeout);
    }
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  try {
    await app.listen({ host: config.HOST, port: config.PORT });
    cronJobsService.start();
    app.container.resolve('mongoService').initialize().catch((error: unknown) => {
      const details = errorDetails(error);
      app.log.error(details, `Mongo initialization failed :: ${details.message}`);
    });
  } catch (error) {
    const details = errorDetails(error);
    app.log.error(details, `Unable to start server :: ${details.message}`);
    process.exitCode = 1;
    await app.close();
  }
}

main().catch((error: unknown) => {
  const details = errorDetails(error);
  bootstrapLogger.error(details, `Application startup failed :: ${details.message}`);
  process.exitCode = 1;
});
