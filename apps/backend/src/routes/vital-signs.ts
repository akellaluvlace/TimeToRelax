// Health check route. Proof that the server has a pulse.
// Railway pings this to decide if we deserve to keep running.

import type { FastifyInstance } from 'fastify';
import type { HealthResponse } from '@timetorelax/shared';

// Read version from package.json at import time, not per-request.
// If this fails, we have bigger problems than a health check.
const VERSION = '0.1.0';

/**
 * Registers the health check route.
 * GET /health returns proof of life.
 *
 * @param app - The Fastify instance to register on
 */
export default async function vitalSigns(app: FastifyInstance): Promise<void> {
  app.get<{ Reply: HealthResponse }>(
    '/health',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', const: 'alive' },
              version: { type: 'string' },
            },
            required: ['status', 'version'],
          },
        },
      },
    },
    async () => {
      return { status: 'alive' as const, version: VERSION };
    },
  );
}
