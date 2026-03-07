import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

describe('vital-signs', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({
      port: 0,
      host: '127.0.0.1',
      nodeEnv: 'development',
      logLevel: 'silent',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should confirm the server has a pulse', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toEqual({
      status: 'alive',
      version: '0.1.0',
    });
  });

  it('should return JSON content-type on health check', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.headers['content-type']).toContain('application/json');
  });

  it('should return 404 for routes that do not exist, because some things are not meant to be', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/meaning-of-life',
    });

    expect(response.statusCode).toBe(404);
  });
});
