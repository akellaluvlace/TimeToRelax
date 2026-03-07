import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import sensible from '@fastify/sensible';
import { facePalm } from '../src/middleware/face-palm.js';

describe('face-palm', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(sensible);
    app.setErrorHandler(facePalm);

    // A route that throws on purpose, for testing
    app.get('/explode', async () => {
      throw new Error('Everything is on fire');
    });

    // A route that throws a 400 via @fastify/sensible
    app.get('/bad-request', async (_request, reply) => {
      return reply.badRequest('You did this to yourself');
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return structured JSON for unhandled errors, not a stack trace', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/explode',
    });

    expect(response.statusCode).toBe(500);
    const body = response.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('code');
    // In dev mode, we include debug details
    expect(body).toHaveProperty('details');
    // 500s get a generic message, not the raw error
    expect(body.error).toBe('Something broke on our end. We are aware. Mildly.');
  });

  it('should pass through client error messages for 4xx errors', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/bad-request',
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe('You did this to yourself');
  });

  it('should never return HTML, ever', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/explode',
    });

    expect(response.headers['content-type']).toContain('application/json');
    expect(response.headers['content-type']).not.toContain('text/html');
  });
});
