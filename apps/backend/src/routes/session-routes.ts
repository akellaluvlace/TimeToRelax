// Session API routes. The endpoints that let a phone on a bus
// spawn, instruct, inspect, and terminate coding sessions.
// Every route has JSON Schema validation because we trust nobody.
// Especially not the person writing code on public transit.

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { openChapter } from '../services/dear-diary.js';
import {
  spawnRegret,
  unleash,
  assessDamage,
  releaseYouFromYourself,
} from '../services/enabler.js';

const log = openChapter('session-routes');

// ---------------------------------------------------------------------------
// Route param/body interfaces
// ---------------------------------------------------------------------------

interface CreateSessionBody {
  anthropicKey: string;
  model?: 'sonnet' | 'opus';
  repoUrl?: string;
  projectName?: string;
}

interface InstructBody {
  instruction: string;
}

interface SessionParams {
  id: string;
}

// ---------------------------------------------------------------------------
// JSON Schemas for request validation
// ---------------------------------------------------------------------------

const createSessionSchema = {
  body: {
    type: 'object',
    required: ['anthropicKey'],
    properties: {
      anthropicKey: { type: 'string', minLength: 1 },
      model: { type: 'string', enum: ['sonnet', 'opus'] },
      repoUrl: { type: 'string' },
      projectName: { type: 'string' },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        state: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            phase: { type: 'string' },
            userId: { type: 'string' },
            repoUrl: { type: 'string' },
            sandboxId: { type: 'string' },
            createdAt: { type: 'number' },
            lastActivityAt: { type: 'number' },
            filesChanged: { type: 'number' },
            turnsUsed: { type: 'number' },
          },
          required: ['id', 'phase', 'userId', 'createdAt', 'lastActivityAt', 'filesChanged', 'turnsUsed'],
        },
      },
      required: ['sessionId', 'state'],
    },
  },
} as const;

const instructSchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
  body: {
    type: 'object',
    required: ['instruction'],
    properties: {
      instruction: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
  },
  response: {
    202: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      required: ['message'],
    },
  },
} as const;

const stateSchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        state: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            phase: { type: 'string' },
            userId: { type: 'string' },
            repoUrl: { type: 'string' },
            sandboxId: { type: 'string' },
            createdAt: { type: 'number' },
            lastActivityAt: { type: 'number' },
            filesChanged: { type: 'number' },
            turnsUsed: { type: 'number' },
          },
          required: ['id', 'phase', 'userId', 'createdAt', 'lastActivityAt', 'filesChanged', 'turnsUsed'],
        },
      },
      required: ['state'],
    },
  },
} as const;

const deleteSchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      required: ['message'],
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

/**
 * Registers the session management routes. Four endpoints that cover
 * the full lifecycle of a coding session, from denial to acceptance.
 *
 * - POST /session/create - spawn a new session
 * - POST /session/:id/instruct - send an instruction
 * - GET /session/:id/state - check the damage
 * - DELETE /session/:id - end the suffering
 *
 * @param app - The Fastify instance that will carry these routes
 */
export default async function sessionRoutes(app: FastifyInstance): Promise<void> {
  // POST /session/create -- spawn a new session of regret
  app.post<{ Body: CreateSessionBody }>(
    '/session/create',
    { schema: createSessionSchema },
    async (
      request: FastifyRequest<{ Body: CreateSessionBody }>,
      reply: FastifyReply,
    ) => {
      // Temporary auth: x-user-id header. Real auth comes in step 13 (GitHub OAuth).
      // If you're reading this and judging us, wait until you see step 13.
      const userId = request.headers['x-user-id'];
      if (!userId || typeof userId !== 'string') {
        return reply.status(400).send({
          error: 'Missing x-user-id header. We need to know who to blame.',
          code: 'MISSING_USER_ID',
        });
      }

      try {
        const state = await spawnRegret(userId, {
          anthropicKey: request.body.anthropicKey,
          model: request.body.model,
          repoUrl: request.body.repoUrl,
          projectName: request.body.projectName,
        });

        log.info({ sessionId: state.id, userId }, 'session created via API');

        return reply.status(201).send({
          sessionId: state.id,
          state,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Session creation failed. The universe said no.';
        log.error({ userId, err }, 'session creation failed');

        return reply.status(400).send({
          error: message,
          code: 'SESSION_CREATE_FAILED',
        });
      }
    },
  );

  // POST /session/:id/instruct -- send an instruction to the agent
  app.post<{ Params: SessionParams; Body: InstructBody }>(
    '/session/:id/instruct',
    { schema: instructSchema },
    async (
      request: FastifyRequest<{ Params: SessionParams; Body: InstructBody }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const { instruction } = request.body;

      try {
        // Fire and forget. The real events come through SSE.
        // We don't await unleash because it streams events asynchronously.
        // The 202 response means "accepted, watch the SSE stream."
        void unleash(id, instruction);

        log.info({ sessionId: id, instructionLength: instruction.length }, 'instruction accepted');

        return reply.status(202).send({
          message: 'Unleashed. Watch the SSE stream.',
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Instruction failed. Try again or give up.';
        log.error({ sessionId: id, err }, 'instruction failed');

        return reply.status(404).send({
          error: message,
          code: 'INSTRUCT_FAILED',
        });
      }
    },
  );

  // GET /session/:id/state -- check the damage
  app.get<{ Params: SessionParams }>(
    '/session/:id/state',
    { schema: stateSchema },
    async (
      request: FastifyRequest<{ Params: SessionParams }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const state = assessDamage(id);

      if (!state) {
        return reply.status(404).send({
          error: 'Session not found. It either expired or never existed. Both are plausible.',
          code: 'SESSION_NOT_FOUND',
        });
      }

      return reply.status(200).send({ state });
    },
  );

  // DELETE /session/:id -- end the suffering
  app.delete<{ Params: SessionParams }>(
    '/session/:id',
    { schema: deleteSchema },
    async (
      request: FastifyRequest<{ Params: SessionParams }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;

      try {
        await releaseYouFromYourself(id);

        log.info({ sessionId: id }, 'session terminated via API');

        return reply.status(200).send({
          message: 'Released from your suffering.',
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Session termination failed. Even ending things is hard.';
        log.error({ sessionId: id, err }, 'session termination failed');

        return reply.status(404).send({
          error: message,
          code: 'SESSION_NOT_FOUND',
        });
      }
    },
  );
}
