// voice-routes.ts -- The HTTP endpoints for voice I/O.
// Audio goes in, text comes out. Text goes in, audio comes out.
// The circle of voice-driven development, powered by Deepgram.
//
// POST /voice/transcribe -- send audio, get transcript
// POST /voice/speak -- send text, get audio
//
// We use HTTP instead of WebSocket for MVP because sometimes
// simplicity beats cleverness. WebSocket streaming is step 17's problem.

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { openChapter } from '../services/dear-diary.js';
import { hearConfession, deliverVerdict } from '../services/mouth-and-ears.js';

const log = openChapter('voice-routes');

/**
 * Registers the voice routes for STT and TTS.
 * Two endpoints. One listens, one talks. Just like a bad relationship.
 *
 * @param app - The Fastify instance to register routes on
 */
export default async function voiceRoutes(app: FastifyInstance): Promise<void> {
  // Register a content type parser for raw binary audio.
  // Fastify doesn't know what to do with application/octet-stream by default,
  // much like us when someone sends us a voice note at 2am.
  app.addContentTypeParser(
    'application/octet-stream',
    { parseAs: 'buffer' },
    (_request: FastifyRequest, body: Buffer, done: (err: null, body: Buffer) => void) => {
      done(null, body);
    },
  );

  // POST /voice/transcribe
  // Send raw audio, get back what Deepgram thinks you said.
  // Spoiler: it's usually wrong about the variable names.
  app.post(
    '/voice/transcribe',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              transcript: { type: 'string' },
              confidence: { type: 'number' },
            },
            required: ['transcript', 'confidence'],
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const audioBuffer = request.body;

      if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
        log.warn('received empty or non-buffer body for transcription');
        return reply.status(400).send({
          error: 'No audio data received. Send application/octet-stream with actual audio.',
          code: 'NO_AUDIO_DATA',
        });
      }

      try {
        const result = await hearConfession(audioBuffer);

        log.info(
          { transcriptLength: result.transcript.length, confidence: result.confidence },
          'transcription served',
        );

        return reply.status(200).send(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Transcription failed. The ears gave up.';
        log.error({ err }, 'transcription route failed');

        return reply.status(500).send({
          error: message,
          code: 'TRANSCRIPTION_FAILED',
        });
      }
    },
  );

  // POST /voice/speak
  // Send text, get audio back. The backend talks to Deepgram TTS
  // so the API key stays on the server, not on someone's phone
  // that they'll leave in an Uber next week.
  app.post<{ Body: { text: string } }>(
    '/voice/speak',
    {
      schema: {
        body: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string', minLength: 1 },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: { text: string } }>,
      reply: FastifyReply,
    ) => {
      const { text } = request.body;

      try {
        const audioBuffer = await deliverVerdict(text);

        log.info(
          { textLength: text.length, audioSize: audioBuffer.length },
          'TTS audio served',
        );

        return reply
          .status(200)
          .header('content-type', 'audio/mpeg')
          .send(audioBuffer);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'TTS failed. The mouth gave up.';
        log.error({ err }, 'TTS route failed');

        return reply.status(500).send({
          error: message,
          code: 'TTS_FAILED',
        });
      }
    },
  );
}
