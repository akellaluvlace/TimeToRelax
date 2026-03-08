import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'node:http';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import {
  screamIntoTheVoid,
  sealTheVoid,
} from '../src/services/the-void.js';
import { AgentEventType } from '@timetorelax/shared';

describe('the-void-route', () => {
  let app: FastifyInstance;
  let baseUrl: string;

  beforeAll(async () => {
    app = await buildApp({
      port: 0,
      host: '127.0.0.1',
      nodeEnv: 'development',
      logLevel: 'silent',
    });
    // Start a real server so we can test SSE streaming without inject() hanging
    const address = await app.listen({ port: 0, host: '127.0.0.1' });
    baseUrl = address;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    sealTheVoid('route-test-session');
  });

  it('should return 404 for a session that does not exist, because you cannot stream nothing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/session/nonexistent-session/stream',
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.code).toBe('SESSION_NOT_FOUND');
  });

  it('should return 404 with a cynical error message, not a corporate one', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/session/ghost/stream',
    });

    const body = response.json();
    expect(body.error).toBeDefined();
    expect(body.error).not.toContain('Internal Server Error');
  });

  it('should set correct SSE headers when a session exists', async () => {
    // Create a session in the void first
    screamIntoTheVoid('route-test-session', {
      type: AgentEventType.AGENT_THINKING,
      data: {},
    });

    // Use raw http request so we can inspect headers on the streaming response.
    // We connect with lastEventId=0 so we get a replayed event immediately,
    // then read the first data chunk and tear down.
    const { headers } = await new Promise<{ headers: http.IncomingHttpHeaders }>((resolve, reject) => {
      const req = http.get(
        `${baseUrl}/session/route-test-session/stream?lastEventId=0`,
        (res) => {
          res.setEncoding('utf8');
          // Wait for the first data chunk before destroying.
          // This ensures the response has fully started and headers are committed.
          res.once('data', () => {
            resolve({ headers: res.headers });
            res.destroy();
          });
        },
      );
      req.on('error', (err) => {
        if ((err as NodeJS.ErrnoException).code !== 'ECONNRESET') {
          reject(err);
        }
      });
    });

    expect(headers['content-type']).toBe('text/event-stream');
    expect(headers['cache-control']).toBe('no-cache');
    expect(headers['connection']).toBe('keep-alive');
  });

  it('should stream events in SSE format when they arrive', async () => {
    screamIntoTheVoid('route-test-session', {
      type: AgentEventType.AGENT_THINKING,
      data: {},
    });

    // Connect and read the first chunk (replayed event from lastEventId=0)
    const firstChunk = await new Promise<string>((resolve, reject) => {
      const req = http.get(
        `${baseUrl}/session/route-test-session/stream?lastEventId=0`,
        (res) => {
          res.setEncoding('utf8');
          res.once('data', (chunk: string) => {
            resolve(chunk);
            req.destroy();
          });
        },
      );
      req.on('error', (err) => {
        if ((err as NodeJS.ErrnoException).code !== 'ECONNRESET') {
          reject(err);
        }
      });
    });

    // Verify SSE format
    expect(firstChunk).toContain('id: 1');
    expect(firstChunk).toContain('event: agent_thinking');
    expect(firstChunk).toContain('data: ');
  });

  it('should replay missed events when lastEventId is provided via query', async () => {
    // Emit 3 events
    screamIntoTheVoid('route-test-session', {
      type: AgentEventType.AGENT_THINKING,
      data: {},
    });
    screamIntoTheVoid('route-test-session', {
      type: AgentEventType.AGENT_WRITING,
      data: {},
    });
    screamIntoTheVoid('route-test-session', {
      type: AgentEventType.BUILD_SUCCESS,
      data: { command: 'npm test', exitCode: 0, output: 'pass' },
    });

    // Reconnect having seen event 1
    const chunks = await new Promise<string>((resolve, reject) => {
      const req = http.get(
        `${baseUrl}/session/route-test-session/stream?lastEventId=1`,
        (res) => {
          res.setEncoding('utf8');
          let data = '';
          res.on('data', (chunk: string) => {
            data += chunk;
            // We expect 2 replayed events (ids 2 and 3)
            if (data.includes('id: 3')) {
              resolve(data);
              req.destroy();
            }
          });
        },
      );
      req.on('error', (err) => {
        if ((err as NodeJS.ErrnoException).code !== 'ECONNRESET') {
          reject(err);
        }
      });
    });

    // Should contain events 2 and 3 but not event 1
    expect(chunks).not.toContain('id: 1\n');
    expect(chunks).toContain('id: 2');
    expect(chunks).toContain('id: 3');
    expect(chunks).toContain('event: agent_writing');
    expect(chunks).toContain('event: build_success');
  });

  it('should validate the session ID param is present', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/session//stream',
    });

    expect(response.statusCode).toBe(404);
  });
});
