// existing-project-routes.test.ts -- Testing the existing project endpoint.
// Making sure you can clone and explore repos from a phone on a bus.
// What could go wrong? Everything. But at least we test for it.

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import {
  forget,
  assessDamage as trackerAssessDamage,
  setOnExpired,
} from '../src/services/regret-tracker.js';
import { resetSessionFactory } from '../src/services/enabler.js';

const VALID_KEY = 'sk-ant-test-key-for-existing-project';

describe('existing-project-routes', () => {
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

  afterEach(() => {
    // Clean up sessions between tests
    for (const [sessionId] of trackerAssessDamage()) {
      forget(sessionId);
    }
    setOnExpired(null);
    resetSessionFactory();
    vi.clearAllMocks();
  });

  describe('POST /session/existing-project', () => {
    it('should return 201 with a sessionId when given valid inputs', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/existing-project',
        headers: { 'x-user-id': 'test-user' },
        payload: {
          anthropicKey: VALID_KEY,
          repoUrl: 'https://github.com/test/repo.git',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.sessionId).toBeDefined();
    });

    it('should return 400 for missing repoUrl because we need to know what to clone', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/existing-project',
        headers: { 'x-user-id': 'test-user' },
        payload: {
          anthropicKey: VALID_KEY,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for missing anthropicKey because we need to authenticate', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/existing-project',
        headers: { 'x-user-id': 'test-user' },
        payload: {
          repoUrl: 'https://github.com/test/repo.git',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for missing x-user-id header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/existing-project',
        payload: {
          anthropicKey: VALID_KEY,
          repoUrl: 'https://github.com/test/repo.git',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toContain('x-user-id');
    });

    it('should return 400 for invalid API key format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/existing-project',
        headers: { 'x-user-id': 'test-user' },
        payload: {
          anthropicKey: 'not-a-real-key',
          repoUrl: 'https://github.com/test/repo.git',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toContain('does not look right');
    });

    it('should accept optional subdirectory parameter', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/existing-project',
        headers: { 'x-user-id': 'test-user' },
        payload: {
          anthropicKey: VALID_KEY,
          repoUrl: 'https://github.com/test/monorepo.git',
          subdirectory: 'packages/core',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.sessionId).toBeDefined();
    });

    it('should accept optional model parameter', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/existing-project',
        headers: { 'x-user-id': 'test-user' },
        payload: {
          anthropicKey: VALID_KEY,
          repoUrl: 'https://github.com/test/repo.git',
          model: 'opus',
        },
      });

      expect(response.statusCode).toBe(201);
    });
  });
});
