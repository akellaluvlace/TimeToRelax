// App factory. Assembles the Fastify instance with all plugins and routes.
// Separated from the entry point so tests can build an app without starting a server.

import Fastify, { type FastifyBaseLogger, type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';

import { facePalm } from './middleware/face-palm.js';
import vitalSigns from './routes/vital-signs.js';
import theVoidRoute from './routes/the-void-route.js';
import type { BackendConfig } from './config.js';
import { spawnDiary } from './services/dear-diary.js';

/**
 * Builds a configured Fastify instance.
 * Everything is registered here. The entry point just calls listen().
 * Now with a proper diary so our logs aren't just screaming into the void.
 *
 * @param config - Backend configuration from loadConfig()
 * @returns A fully configured Fastify instance, ready to listen or inject
 */
export async function buildApp(config: BackendConfig): Promise<FastifyInstance> {
  const app = Fastify({
    // Fastify gets our pino instance instead of creating its own.
    // One diary to rule them all. One diary to find them.
    // TODO(nikita): revisit this cast when Fastify 5 stabilizes its generic logger types.
    // pino.Logger is a strict superset of FastifyBaseLogger at runtime; the cast
    // bridges the structural type gap that Fastify's generics enforce at compile time.
    loggerInstance: spawnDiary(config.logLevel) as FastifyBaseLogger,
  });

  // Plugins
  await app.register(cors);
  await app.register(sensible);
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Routes
  await app.register(vitalSigns);
  await app.register(theVoidRoute);

  // The last line of defence between our errors and the outside world
  app.setErrorHandler(facePalm);

  return app;
}
