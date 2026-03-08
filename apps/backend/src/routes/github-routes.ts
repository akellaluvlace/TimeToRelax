// github-routes.ts -- GitHub API routes.
// The bridge between your phone and your repos.
// Because apparently we need infrastructure to push code from a bus.

import type { FastifyInstance } from 'fastify';

import { proofOfGitHubLife, listTheDamage, tradeCodeForToken } from '../services/no-laptop-no-problem.js';
import { openChapter } from '../services/dear-diary.js';
import { loadConfig } from '../config.js';

const log = openChapter('github-routes');

/**
 * Registers all GitHub-related routes.
 * Token exchange, validation, and repo listing.
 * Everything you need to ship from inappropriate locations.
 *
 * @param app - The Fastify instance to register on
 */
export default async function githubRoutes(app: FastifyInstance): Promise<void> {
  // POST /github/token-exchange
  // Exchanges an OAuth code for a token. The mobile app sends the code,
  // we send it to GitHub with our client_secret, because secrets
  // belong on servers, not phones.
  app.post<{
    Body: { code: string };
    Reply: { token: string } | { error: string; code: string };
  }>(
    '/github/token-exchange',
    {
      schema: {
        body: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string', minLength: 1 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              token: { type: 'string' },
            },
            required: ['token'],
          },
        },
      },
    },
    async (request, reply) => {
      const config = loadConfig();
      if (!config.githubClientId || !config.githubClientSecret) {
        log.error('GitHub OAuth not configured on server');
        return reply.status(503).send({
          error: 'GitHub OAuth not configured. Server admin dropped the ball.',
          code: 'GITHUB_NOT_CONFIGURED',
        });
      }

      try {
        const token = await tradeCodeForToken(
          request.body.code,
          config.githubClientId,
          config.githubClientSecret,
        );
        return reply.send({ token });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Token exchange failed';
        log.error({ error: message }, 'token exchange failed');
        return reply.status(400).send({
          error: message,
          code: 'TOKEN_EXCHANGE_FAILED',
        });
      }
    },
  );

  // POST /github/validate
  // Checks if a GitHub token is still breathing.
  app.post<{
    Reply: { valid: boolean; username: string; scopes: string[] };
  }>(
    '/github/validate',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              valid: { type: 'boolean' },
              username: { type: 'string' },
              scopes: { type: 'array', items: { type: 'string' } },
            },
            required: ['valid', 'username', 'scopes'],
          },
        },
      },
    },
    async (request, reply) => {
      const token = request.headers['x-github-token'] as string | undefined;
      if (!token) {
        return reply.status(401).send({
          valid: false,
          username: '',
          scopes: [],
        });
      }

      const result = await proofOfGitHubLife(token);
      return reply.send(result);
    },
  );

  // GET /github/repos
  // Lists the user's repos. Sorted by recently pushed because
  // that's the only sort order that matters at 11pm.
  app.get<{
    Querystring: { page?: string };
  }>(
    '/github/repos',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              repos: { type: 'array' },
            },
            required: ['repos'],
          },
        },
      },
    },
    async (request, reply) => {
      const token = request.headers['x-github-token'] as string | undefined;
      if (!token) {
        return reply.status(401).send({ repos: [] });
      }

      const page = parseInt(request.query.page ?? '1', 10);
      const repos = await listTheDamage(token, page);
      return reply.send({ repos });
    },
  );
}
