// ship-routes.test.ts -- Testing the ship flow endpoints.
// Accept, push, PR. Three steps to make your code someone else's problem.
// We mock the services because real git operations in tests are for the brave.

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import {
  forget,
  assessDamage as trackerAssessDamage,
  setOnExpired,
} from '../src/services/regret-tracker.js';
import { resetSessionFactory } from '../src/services/enabler.js';

// Mock the ship flow services so we don't need real sandboxes or GitHub
vi.mock('../src/services/no-laptop-no-problem.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/services/no-laptop-no-problem.js')>();
  return {
    ...original,
    noTakebacksies: vi.fn().mockResolvedValue({
      branch: 'ttr/add-dark-mode',
      commitHash: 'abc1234',
      filesChanged: 3,
    }),
    shipFromInappropriateLocation: vi.fn().mockResolvedValue({
      branch: 'ttr/add-dark-mode',
      url: 'https://github.com/user/repo/tree/ttr/add-dark-mode',
    }),
    makeItSomeoneElsesProblem: vi.fn().mockResolvedValue({
      prUrl: 'https://github.com/user/repo/pull/42',
      prNumber: 42,
    }),
  };
});

const VALID_KEY = 'sk-ant-test-key-for-ship-routes';

describe('ship-routes', () => {
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
    for (const [sessionId] of trackerAssessDamage()) {
      forget(sessionId);
    }
    setOnExpired(null);
    resetSessionFactory();
    vi.clearAllMocks();
  });

  /**
   * Helper: creates a session with a sandboxId so ship routes have something to work with.
   * We mock the enabler to return a session that has a sandbox attached.
   */
  async function createSessionWithSandbox(): Promise<string> {
    const response = await app.inject({
      method: 'POST',
      url: '/session/create',
      headers: { 'x-user-id': 'test-user' },
      payload: { anthropicKey: VALID_KEY },
    });

    const { sessionId } = response.json() as { sessionId: string };

    // The mock session factory doesn't create a sandbox, so we need to
    // manually set the sandboxId on the tracked session for ship routes to work.
    const sessions = trackerAssessDamage();
    const tracked = sessions.get(sessionId);
    if (tracked) {
      tracked.session.sandboxId = 'test-sandbox-id';
    }

    return sessionId;
  }

  describe('POST /session/:id/accept', () => {
    it('should commit changes and return result', async () => {
      const sessionId = await createSessionWithSandbox();

      const response = await app.inject({
        method: 'POST',
        url: `/session/${sessionId}/accept`,
        headers: { 'x-user-id': 'test-user' },
        payload: { description: 'add dark mode' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.branch).toBe('ttr/add-dark-mode');
      expect(body.commitHash).toBe('abc1234');
      expect(body.filesChanged).toBe(3);
    });

    it('should return 404 for unknown session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/nonexistent/accept',
        headers: { 'x-user-id': 'test-user' },
        payload: { description: 'whatever' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 when session has no sandbox', async () => {
      // Create a session without setting sandboxId
      const createResponse = await app.inject({
        method: 'POST',
        url: '/session/create',
        headers: { 'x-user-id': 'test-user' },
        payload: { anthropicKey: VALID_KEY },
      });
      const { sessionId } = createResponse.json() as { sessionId: string };

      const response = await app.inject({
        method: 'POST',
        url: `/session/${sessionId}/accept`,
        headers: { 'x-user-id': 'test-user' },
        payload: { description: 'nope' },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.code).toBe('NO_SANDBOX');
    });

    it('should reject missing description', async () => {
      const sessionId = await createSessionWithSandbox();

      const response = await app.inject({
        method: 'POST',
        url: `/session/${sessionId}/accept`,
        headers: { 'x-user-id': 'test-user' },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /session/:id/push', () => {
    it('should push and return branch URL', async () => {
      const sessionId = await createSessionWithSandbox();

      const response = await app.inject({
        method: 'POST',
        url: `/session/${sessionId}/push`,
        headers: {
          'x-user-id': 'test-user',
          'x-github-token': 'ghp_test_token',
        },
        payload: { repoUrl: 'https://github.com/user/repo.git' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.branch).toBe('ttr/add-dark-mode');
      expect(body.url).toContain('github.com');
    });

    it('should return 404 for unknown session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/nonexistent/push',
        headers: {
          'x-user-id': 'test-user',
          'x-github-token': 'ghp_test_token',
        },
        payload: { repoUrl: 'https://github.com/user/repo.git' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject missing github token header', async () => {
      const sessionId = await createSessionWithSandbox();

      const response = await app.inject({
        method: 'POST',
        url: `/session/${sessionId}/push`,
        headers: { 'x-user-id': 'test-user' },
        payload: { repoUrl: 'https://github.com/user/repo.git' },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.code).toBe('MISSING_GITHUB_TOKEN');
    });
  });

  describe('POST /session/:id/pr', () => {
    it('should create PR and return URL with 201', async () => {
      const sessionId = await createSessionWithSandbox();

      const response = await app.inject({
        method: 'POST',
        url: `/session/${sessionId}/pr`,
        headers: {
          'x-user-id': 'test-user',
          'x-github-token': 'ghp_test_token',
        },
        payload: {
          repoFullName: 'user/repo',
          title: 'feat: add dark mode',
          description: 'Shipped from a bus. Your manager would be so proud.',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.prUrl).toBe('https://github.com/user/repo/pull/42');
      expect(body.prNumber).toBe(42);
    });

    it('should return 404 for unknown session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/nonexistent/pr',
        headers: {
          'x-user-id': 'test-user',
          'x-github-token': 'ghp_test_token',
        },
        payload: {
          repoFullName: 'user/repo',
          title: 'feat: whatever',
          description: 'nope',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject missing github token header', async () => {
      const sessionId = await createSessionWithSandbox();

      const response = await app.inject({
        method: 'POST',
        url: `/session/${sessionId}/pr`,
        headers: { 'x-user-id': 'test-user' },
        payload: {
          repoFullName: 'user/repo',
          title: 'feat: test',
          description: 'test',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.code).toBe('MISSING_GITHUB_TOKEN');
    });
  });
});
