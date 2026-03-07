// App factory. Assembles the Fastify instance with all plugins and routes.
// Separated from the entry point so tests can build an app without starting a server.

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';

import { facePalm } from './middleware/face-palm.js';
import vitalSigns from './routes/vital-signs.js';
import type { BackendConfig } from './config.js';

/**
 * Builds a configured Fastify instance.
 * Everything is registered here. The entry point just calls listen().
 *
 * @param config - Backend configuration from loadConfig()
 * @returns A fully configured Fastify instance, ready to listen or inject
 */
export async function buildApp(config: BackendConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
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

  // The last line of defence between our errors and the outside world
  app.setErrorHandler(facePalm);

  return app;
}
