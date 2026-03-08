// grok-routes.ts -- The Grok Voice Agent upgrade path.
// When Deepgram's pre-recorded TTS isn't chaotic enough, users can
// connect directly to Grok's realtime voice agent via WebSocket.
//
// The flow: user's xAI key -> our server -> ephemeral token -> client.
// The real key never touches the phone. The phone gets a short-lived
// token and a WebSocket URL. Connect, talk, regret. In that order.
//
// POST /voice/grok/token    -- exchange xAI key for ephemeral token
// POST /voice/grok/validate -- check if xAI key is breathing

import type { FastifyInstance } from 'fastify';

import { openChapter } from '../services/dear-diary.js';
import {
  enableMaximumChaos,
  checkGrokPulse,
  getTheGrokPersonality,
  GROK_WS_URL,
} from '../services/the-upgrade.js';

const log = openChapter('grok-routes');

/**
 * Registers the Grok voice upgrade routes.
 * Two endpoints: one gives you the keys to the kingdom (temporarily),
 * the other checks if you even have a valid kingdom pass.
 *
 * @param app - The Fastify instance to bolt these routes onto
 */
export default async function grokRoutes(app: FastifyInstance): Promise<void> {
  // POST /voice/grok/token
  // Exchanges the user's xAI API key for an ephemeral token.
  // The key comes in via header (same pattern as GitHub routes),
  // the ephemeral token goes back in the response body.
  // The client then uses the token to connect to Grok's WebSocket directly.
  // We are merely the middleman. The reluctant middleman.
  app.post(
    '/voice/grok/token',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              expiresAt: { type: 'number' },
              voiceModel: { type: 'string' },
              wsUrl: { type: 'string' },
              systemPrompt: { type: 'string' },
            },
            required: ['token', 'expiresAt', 'voiceModel', 'wsUrl', 'systemPrompt'],
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              code: { type: 'string' },
            },
            required: ['error', 'code'],
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              code: { type: 'string' },
            },
            required: ['error', 'code'],
          },
        },
      },
    },
    async (request, reply) => {
      const xaiKey = request.headers['x-xai-key'] as string | undefined;

      if (!xaiKey) {
        log.warn('grok token requested without an xAI key. bold move.');
        return reply.status(401).send({
          error: 'No xAI key provided. Send it in the x-xai-key header. We keep secrets better than you do.',
          code: 'NO_XAI_KEY',
        });
      }

      try {
        const ephemeral = await enableMaximumChaos(xaiKey);
        const systemPrompt = getTheGrokPersonality();

        log.info(
          { expiresAt: ephemeral.expiresAt, voiceModel: ephemeral.voiceModel },
          'ephemeral token served. the upgrade is live.',
        );

        return reply.status(200).send({
          token: ephemeral.token,
          expiresAt: ephemeral.expiresAt,
          voiceModel: ephemeral.voiceModel,
          wsUrl: GROK_WS_URL,
          systemPrompt,
        });
      } catch (err: unknown) {
        const message = err instanceof Error
          ? err.message
          : 'Failed to get Grok token. The upgrade path is closed for maintenance.';
        log.error({ err }, 'grok token exchange failed');

        // Distinguish between auth failures and server errors
        const isAuthError = message.includes('dead') || message.includes('401');
        const statusCode = isAuthError ? 401 : 500;

        return reply.status(statusCode).send({
          error: message,
          code: isAuthError ? 'XAI_KEY_INVALID' : 'GROK_TOKEN_FAILED',
        });
      }
    },
  );

  // POST /voice/grok/validate
  // Checks if an xAI API key is alive. Quick pulse check.
  // The user sends their key, we poke xAI, report back.
  // No drama. Just a boolean. Refreshingly simple.
  app.post(
    '/voice/grok/validate',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              valid: { type: 'boolean' },
            },
            required: ['valid'],
          },
        },
      },
    },
    async (request, reply) => {
      const xaiKey = request.headers['x-xai-key'] as string | undefined;

      if (!xaiKey) {
        log.warn('grok validation requested without an xAI key. checking nothing.');
        return reply.status(200).send({ valid: false });
      }

      try {
        const valid = await checkGrokPulse(xaiKey);

        log.info({ valid }, 'xAI key validation result');

        return reply.status(200).send({ valid });
      } catch (err: unknown) {
        // checkGrokPulse catches its own errors and returns false,
        // but just in case someone refactors it to throw, we handle it.
        // Defensive programming: the only kind of defense we have.
        log.error({ err }, 'grok validation exploded unexpectedly');
        return reply.status(200).send({ valid: false });
      }
    },
  );
}
