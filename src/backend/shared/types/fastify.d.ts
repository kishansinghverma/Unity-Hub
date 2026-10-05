import type { AwilixContainer } from 'awilix';
import type { AppCradle } from '../../core/di/container.js';

declare module 'fastify' {
  interface FastifyInstance {
    container: AwilixContainer<AppCradle>;
  }
}
