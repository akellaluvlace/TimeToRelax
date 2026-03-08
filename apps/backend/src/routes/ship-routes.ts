// Ship routes. The endpoints that let you commit, push, and PR
// from a phone on a bus. Three steps to make your code someone
// else's problem. The holy trinity of mobile development.
//
// Accept -> Push -> PR. In that order. Skipping steps is how
// you end up pushing uncommitted changes. Don't be that person.

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { openChapter } from '../services/dear-diary.js';
import { assessDamage } from '../services/enabler.js';
import {
  noTakebacksies,
  shipFromInappropriateLocation,
  makeItSomeoneElsesProblem,
} from '../services/no-laptop-no-problem.js';

const log = openChapter('ship-routes');

// ---------------------------------------------------------------------------
// Route param/body interfaces
// ---------------------------------------------------------------------------

interface SessionParams {
  id: string;
}

interface AcceptBody {
  description: string;
}

interface PushBody {
  repoUrl: string;
}

interface CreatePRBody {
  repoFullName: string;
  title: string;
  description: string;
}

// ---------------------------------------------------------------------------
// JSON Schemas for request validation
// ---------------------------------------------------------------------------

const acceptSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
  },
  body: {
    type: 'object',
    required: ['description'],
    properties: {
      description: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        branch: { type: 'string' },
        commitHash: { type: 'string' },
        filesChanged: { type: 'number' },
      },
      required: ['branch', 'commitHash', 'filesChanged'],
    },
  },
} as const;

const pushSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
  },
  body: {
    type: 'object',
    required: ['repoUrl'],
    properties: {
      repoUrl: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        branch: { type: 'string' },
        url: { type: 'string' },
      },
      required: ['branch', 'url'],
    },
  },
} as const;

const prSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
  },
  body: {
    type: 'object',
    required: ['repoFullName', 'title', 'description'],
    properties: {
      repoFullName: { type: 'string', minLength: 1 },
      title: { type: 'string', minLength: 1 },
      description: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      type: 'object',
      properties: {
        prUrl: { type: 'string' },
        prNumber: { type: 'number' },
      },
      required: ['prUrl', 'prNumber'],
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validates that a session exists and has a sandbox attached.
 * Without a sandbox, there's nothing to commit or push.
 * Returns the session state, or sends an error reply and returns null.
 *
 * @param sessionId - The session to validate
 * @param reply - The Fastify reply for sending errors
 * @returns The session state if valid, null if not
 */
function validateSessionForShip(
  sessionId: string,
  reply: FastifyReply,
): { sandboxId: string } | null {
  const session = assessDamage(sessionId);
  if (!session) {
    void reply.status(404).send({
      error: 'Session not found. It either expired or never existed. Both are plausible.',
      code: 'SESSION_NOT_FOUND',
    });
    return null;
  }

  if (!session.sandboxId) {
    void reply.status(400).send({
      error: 'Session has no sandbox. Cannot ship nothing. Even we have limits.',
      code: 'NO_SANDBOX',
    });
    return null;
  }

  return { sandboxId: session.sandboxId };
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

/**
 * Registers the ship flow routes. Three endpoints that cover
 * the full journey from "I made changes" to "it's someone else's problem."
 *
 * - POST /session/:id/accept - commit changes to a branch
 * - POST /session/:id/push - push the branch to GitHub
 * - POST /session/:id/pr - create a pull request
 *
 * @param app - The Fastify instance that will carry these routes
 */
export default async function shipRoutes(app: FastifyInstance): Promise<void> {
  // POST /session/:id/accept -- commit changes. no take-backsies.
  app.post<{ Params: SessionParams; Body: AcceptBody }>(
    '/session/:id/accept',
    { schema: acceptSchema },
    async (
      request: FastifyRequest<{ Params: SessionParams; Body: AcceptBody }>,
      reply: FastifyReply,
    ) => {
      const userId = request.headers['x-user-id'];
      if (!userId || typeof userId !== 'string') {
        return reply.status(400).send({
          error: 'Missing x-user-id header. We need to know who to blame.',
          code: 'MISSING_USER_ID',
        });
      }

      const { id } = request.params;
      const validated = validateSessionForShip(id, reply);
      if (!validated) return;

      try {
        const result = await noTakebacksies(validated.sandboxId, request.body.description);

        log.info(
          { sessionId: id, branch: result.branch, filesChanged: result.filesChanged },
          'changes accepted. there is no going back.',
        );

        return reply.status(200).send(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Commit failed. The universe said no.';
        log.error({ sessionId: id, err }, 'accept failed');
        return reply.status(500).send({
          error: message,
          code: 'COMMIT_FAILED',
        });
      }
    },
  );

  // POST /session/:id/push -- push to GitHub from literally anywhere
  app.post<{ Params: SessionParams; Body: PushBody }>(
    '/session/:id/push',
    { schema: pushSchema },
    async (
      request: FastifyRequest<{ Params: SessionParams; Body: PushBody }>,
      reply: FastifyReply,
    ) => {
      const userId = request.headers['x-user-id'];
      if (!userId || typeof userId !== 'string') {
        return reply.status(400).send({
          error: 'Missing x-user-id header. We need to know who to blame.',
          code: 'MISSING_USER_ID',
        });
      }

      const githubToken = request.headers['x-github-token'];
      if (!githubToken || typeof githubToken !== 'string') {
        return reply.status(400).send({
          error: 'Missing x-github-token header. Can\'t push without credentials. We\'re hackers, not that kind.',
          code: 'MISSING_GITHUB_TOKEN',
        });
      }

      const { id } = request.params;
      const validated = validateSessionForShip(id, reply);
      if (!validated) return;

      try {
        const result = await shipFromInappropriateLocation(
          validated.sandboxId,
          githubToken,
          request.body.repoUrl,
        );

        log.info(
          { sessionId: id, branch: result.branch, url: result.url },
          'pushed. your manager would be so proud.',
        );

        return reply.status(200).send(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Push failed. Check your token and try again.';
        log.error({ sessionId: id, err }, 'push failed');
        return reply.status(500).send({
          error: message,
          code: 'PUSH_FAILED',
        });
      }
    },
  );

  // POST /session/:id/pr -- create a PR. make it someone else's problem.
  app.post<{ Params: SessionParams; Body: CreatePRBody }>(
    '/session/:id/pr',
    { schema: prSchema },
    async (
      request: FastifyRequest<{ Params: SessionParams; Body: CreatePRBody }>,
      reply: FastifyReply,
    ) => {
      const userId = request.headers['x-user-id'];
      if (!userId || typeof userId !== 'string') {
        return reply.status(400).send({
          error: 'Missing x-user-id header. We need to know who to blame.',
          code: 'MISSING_USER_ID',
        });
      }

      const githubToken = request.headers['x-github-token'];
      if (!githubToken || typeof githubToken !== 'string') {
        return reply.status(400).send({
          error: 'Missing x-github-token header. Can\'t create PRs without credentials.',
          code: 'MISSING_GITHUB_TOKEN',
        });
      }

      const { id } = request.params;
      const session = assessDamage(id);
      if (!session) {
        return reply.status(404).send({
          error: 'Session not found. It either expired or never existed.',
          code: 'SESSION_NOT_FOUND',
        });
      }

      try {
        const result = await makeItSomeoneElsesProblem(
          githubToken,
          request.body.repoFullName,
          request.body.title,
          request.body.title,
          request.body.description,
        );

        log.info(
          { sessionId: id, prNumber: result.prNumber, prUrl: result.prUrl },
          'PR created. it is now someone else\'s problem.',
        );

        return reply.status(201).send(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'PR creation failed. GitHub said no.';
        log.error({ sessionId: id, err }, 'PR creation failed');
        return reply.status(500).send({
          error: message,
          code: 'PR_CREATION_FAILED',
        });
      }
    },
  );
}
