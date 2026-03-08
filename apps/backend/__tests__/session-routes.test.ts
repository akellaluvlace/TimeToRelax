import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import {
  forget,
  assessDamage as trackerAssessDamage,
  setOnExpired,
} from '../src/services/regret-tracker.js';
import { resetSessionFactory } from '../src/services/enabler.js';

const VALID_KEY = 'sk-ant-test-key-for-routes';

describe('session-routes', () => {
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

  describe('POST /session/create', () => {
    it('should return 201 with a sessionId when given a valid key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/create',
        headers: { 'x-user-id': 'test-user' },
        payload: { anthropicKey: VALID_KEY },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.sessionId).toBeDefined();
      expect(body.state).toBeDefined();
      expect(body.state.phase).toBe('denial');
      expect(body.state.userId).toBe('test-user');
    });

    it('should reject missing anthropicKey with 400 because we validate', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/create',
        headers: { 'x-user-id': 'test-user' },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject missing x-user-id header with 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/create',
        payload: { anthropicKey: VALID_KEY },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toContain('x-user-id');
    });

    it('should reject invalid API key format with 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/create',
        headers: { 'x-user-id': 'test-user' },
        payload: { anthropicKey: 'invalid-key' },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toContain('does not look right');
    });

    it('should accept optional model parameter', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/create',
        headers: { 'x-user-id': 'test-user' },
        payload: { anthropicKey: VALID_KEY, model: 'opus' },
      });

      expect(response.statusCode).toBe(201);
    });
  });

  describe('POST /session/:id/instruct', () => {
    it('should return 202 for a valid session and instruction', async () => {
      // First create a session
      const createResponse = await app.inject({
        method: 'POST',
        url: '/session/create',
        headers: { 'x-user-id': 'test-user' },
        payload: { anthropicKey: VALID_KEY },
      });
      const { sessionId } = createResponse.json();

      const response = await app.inject({
        method: 'POST',
        url: `/session/${sessionId}/instruct`,
        payload: { instruction: 'add a button' },
      });

      expect(response.statusCode).toBe(202);
      const body = response.json();
      expect(body.message).toContain('Unleashed');
    });

    it('should reject missing instruction with 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/fake-id/instruct',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /session/:id/state', () => {
    it('should return session state for an existing session', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/session/create',
        headers: { 'x-user-id': 'test-user' },
        payload: { anthropicKey: VALID_KEY },
      });
      const { sessionId } = createResponse.json();

      const response = await app.inject({
        method: 'GET',
        url: `/session/${sessionId}/state`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.state).toBeDefined();
      expect(body.state.id).toBe(sessionId);
    });

    it('should return 404 for a session that does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/session/nonexistent/state',
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBeDefined();
    });
  });

  describe('DELETE /session/:id', () => {
    it('should clean up and return 200 for an existing session', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/session/create',
        headers: { 'x-user-id': 'test-user' },
        payload: { anthropicKey: VALID_KEY },
      });
      const { sessionId } = createResponse.json();

      const response = await app.inject({
        method: 'DELETE',
        url: `/session/${sessionId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.message).toContain('Released');

      // Verify session is gone
      const stateResponse = await app.inject({
        method: 'GET',
        url: `/session/${sessionId}/state`,
      });
      expect(stateResponse.statusCode).toBe(404);
    });

    it('should return 404 for a session that does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/session/nonexistent',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
