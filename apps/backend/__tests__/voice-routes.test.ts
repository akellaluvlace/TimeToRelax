// voice-routes.test.ts -- Testing the voice HTTP endpoints.
// Making sure audio goes in and text comes out, and vice versa.
// All without actually talking to Deepgram, because we have standards. And a budget.

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';

// Mock the mouth-and-ears service so we don't call Deepgram in tests.
// Our tests should be fast, deterministic, and free.
vi.mock('../src/services/mouth-and-ears.js', () => ({
  hearConfession: vi.fn(),
  deliverVerdict: vi.fn(),
}));

import { buildApp } from '../src/app.js';
import { hearConfession, deliverVerdict } from '../src/services/mouth-and-ears.js';

const mockHearConfession = vi.mocked(hearConfession);
const mockDeliverVerdict = vi.mocked(deliverVerdict);

describe('voice-routes', () => {
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

  describe('POST /voice/transcribe', () => {
    it('should return transcript from audio data', async () => {
      mockHearConfession.mockResolvedValue({
        transcript: 'create a react component',
        confidence: 0.92,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/voice/transcribe',
        headers: {
          'content-type': 'application/octet-stream',
        },
        payload: Buffer.from('fake-audio-bytes'),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.transcript).toBe('create a react component');
      expect(body.confidence).toBe(0.92);
    });

    it('should return 400 when no audio data is sent', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/voice/transcribe',
        headers: {
          'content-type': 'application/octet-stream',
        },
        payload: Buffer.alloc(0),
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toBeDefined();
      expect(body.code).toBe('NO_AUDIO_DATA');
    });

    it('should return 500 when transcription service fails', async () => {
      mockHearConfession.mockRejectedValue(
        new Error('Deepgram STT failed: connection timeout'),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/voice/transcribe',
        headers: {
          'content-type': 'application/octet-stream',
        },
        payload: Buffer.from('some-audio'),
      });

      expect(response.statusCode).toBe(500);
      const body = response.json();
      expect(body.code).toBe('TRANSCRIPTION_FAILED');
    });
  });

  describe('POST /voice/speak', () => {
    it('should return audio buffer from text', async () => {
      const fakeAudio = Buffer.from('fake-mp3-audio-data');
      mockDeliverVerdict.mockResolvedValue(fakeAudio);

      const response = await app.inject({
        method: 'POST',
        url: '/voice/speak',
        headers: {
          'content-type': 'application/json',
        },
        payload: { text: 'Your code is technically functional.' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('audio/mpeg');
      // The raw body should match our fake audio
      expect(response.rawPayload).toEqual(fakeAudio);
    });

    it('should return 400 when text is missing from body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/voice/speak',
        headers: {
          'content-type': 'application/json',
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when text is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/voice/speak',
        headers: {
          'content-type': 'application/json',
        },
        payload: { text: '' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 500 when TTS service fails', async () => {
      mockDeliverVerdict.mockRejectedValue(
        new Error('Deepgram TTS failed: model unavailable'),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/voice/speak',
        headers: {
          'content-type': 'application/json',
        },
        payload: { text: 'This will fail.' },
      });

      expect(response.statusCode).toBe(500);
      const body = response.json();
      expect(body.code).toBe('TTS_FAILED');
    });
  });
});
