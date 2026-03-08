// SSE streaming route. GET /session/:id/stream
// Opens a portal to the void for the mobile client.
// The client connects, we stream events, they watch in horror.
// If they disconnect and reconnect, we replay what they missed.
//
// Uses raw Fastify response streaming. No SSE library needed.
// We're not adding dependencies for something that's basically
// "write text with newlines to a socket."

import { randomUUID } from 'node:crypto';

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { openChapter } from '../services/dear-diary.js';
import {
  peekIntoTheVoid,
  disconnectFromTheVoid,
  gazeIntoTheVoid,
  formatSSE,
} from '../services/the-void.js';
import type { SSEConnection } from '../services/the-void.js';

const log = openChapter('the-void-route');

/** Route params for /session/:id/stream */
interface StreamParams {
  id: string;
}

/** Query string for reconnection replay */
interface StreamQuery {
  lastEventId?: string;
}

/**
 * Registers the SSE streaming route.
 * GET /session/:id/stream opens a persistent connection
 * that streams AgentEvents in SSE format.
 *
 * Supports reconnection via:
 * - Query param: ?lastEventId=42
 * - Standard header: Last-Event-ID (browsers send this automatically)
 *
 * @param app - The Fastify instance that will carry this burden
 */
export default async function theVoidRoute(app: FastifyInstance): Promise<void> {
  app.get<{ Params: StreamParams; Querystring: StreamQuery }>(
    '/session/:id/stream',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        querystring: {
          type: 'object',
          properties: {
            lastEventId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: StreamParams; Querystring: StreamQuery }>, reply: FastifyReply) => {
      const sessionId = request.params.id;

      // Check if this session's void exists.
      // If nobody has screamed into it yet, there's nothing to stream.
      const sessionVoid = gazeIntoTheVoid(sessionId);
      if (!sessionVoid) {
        return reply.status(404).send({
          error: 'No session found. Either it never existed or it was sealed. Both are sad.',
          code: 'SESSION_NOT_FOUND',
        });
      }

      // Figure out where to resume from.
      // Query param takes precedence over the standard header,
      // because we trust our own client more than browser defaults.
      const lastEventIdRaw =
        request.query.lastEventId ??
        (request.headers['last-event-id'] as string | undefined);

      const lastEventId = lastEventIdRaw !== undefined
        ? Number(lastEventIdRaw)
        : undefined;

      // Set SSE headers. These are non-negotiable.
      void reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // nginx, please don't buffer our streams
      });

      const connectionId = randomUUID();

      // Build the SSE connection that the-void.ts will use to write events
      const connection: SSEConnection = {
        id: connectionId,
        write: (chunk: string) => {
          reply.raw.write(chunk);
        },
        close: () => {
          if (!reply.raw.writableEnded) {
            reply.raw.end();
          }
        },
      };

      // Connect to the void and get any missed events
      const voidConnection = peekIntoTheVoid(sessionId, connection, lastEventId);

      // Replay missed events immediately
      for (const event of voidConnection.missedEvents) {
        reply.raw.write(formatSSE(event));
      }

      log.info(
        { sessionId, connectionId, lastEventId, replayed: voidConnection.missedEvents.length },
        'client connected to SSE stream',
      );

      // When the client disconnects (closes tab, loses network, switches to Instagram),
      // clean up the connection so we're not writing to a dead socket.
      request.raw.on('close', () => {
        disconnectFromTheVoid(sessionId, connectionId);
        log.debug({ sessionId, connectionId }, 'client disconnected from SSE stream');
      });
    },
  );
}
