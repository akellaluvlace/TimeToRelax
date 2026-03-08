import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

// Mock the GitHub service so we don't hit real APIs
vi.mock('../src/services/no-laptop-no-problem.js', () => ({
  proofOfGitHubLife: vi.fn().mockResolvedValue({
    valid: true,
    username: 'akellaluvlace',
    scopes: ['repo', 'read:user'],
  }),
  listTheDamage: vi.fn().mockResolvedValue([
    {
      name: 'TimeToRelax',
      fullName: 'akellaluvlace/TimeToRelax',
      description: 'Ship from inappropriate locations',
      cloneUrl: 'https://github.com/akellaluvlace/TimeToRelax.git',
      language: 'TypeScript',
      stargazersCount: 42,
      pushedAt: '2026-03-08T00:00:00Z',
      isPrivate: false,
    },
  ]),
  tradeCodeForToken: vi.fn().mockResolvedValue('ghp_exchanged_token'),
}));

// Mock the enabler so session route registration doesn't blow up
vi.mock('../src/services/enabler.js', () => ({
  spawnRegret: vi.fn(),
  unleash: vi.fn(),
  assessDamage: vi.fn(),
  releaseYouFromYourself: vi.fn(),
}));

// Mock the void
vi.mock('../src/services/the-void.js', () => ({
  screamIntoTheVoid: vi.fn(),
  sealTheVoid: vi.fn(),
  peekIntoTheVoid: vi.fn(),
  gazeIntoTheVoid: vi.fn(),
  disconnectFromTheVoid: vi.fn(),
}));

describe('github-routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const config = loadConfig();
    // Ensure GitHub OAuth is "configured" for the token-exchange test
    process.env['GITHUB_CLIENT_ID'] = 'test_client_id';
    process.env['GITHUB_CLIENT_SECRET'] = 'test_client_secret';
    app = await buildApp(config);
  });

  afterAll(async () => {
    await app.close();
    delete process.env['GITHUB_CLIENT_ID'];
    delete process.env['GITHUB_CLIENT_SECRET'];
  });

  describe('POST /github/validate', () => {
    it('should validate a token and return the username like a bouncer checking ID', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/github/validate',
        headers: { 'x-github-token': 'ghp_valid_token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json() as Record<string, unknown>;
      expect(body['valid']).toBe(true);
      expect(body['username']).toBe('akellaluvlace');
    });

    it('should reject requests without a token because we have standards', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/github/validate',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /github/repos', () => {
    it('should list repos for an authenticated user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/github/repos',
        headers: { 'x-github-token': 'ghp_valid_token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json() as { repos: Array<Record<string, unknown>> };
      expect(body.repos).toHaveLength(1);
      expect(body.repos[0]!['name']).toBe('TimeToRelax');
    });

    it('should return 401 when no token is provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/github/repos',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /github/token-exchange', () => {
    it('should exchange an OAuth code for a token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/github/token-exchange',
        payload: { code: 'auth_code_123' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json() as { token: string };
      expect(body.token).toBe('ghp_exchanged_token');
    });

    it('should reject requests without a code', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/github/token-exchange',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
