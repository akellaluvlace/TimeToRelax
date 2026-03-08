// mouth-and-ears.test.ts -- Testing the ears and mouth.
// Making sure Deepgram integration works without actually calling Deepgram,
// because API credits cost money and we have a therapy fund to maintain.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @deepgram/sdk before importing the module under test.
// We simulate Deepgram SDK v5's response shapes so we can test our logic
// without sending audio to the cloud and waiting for judgment.
const mockTranscribeFile = vi.fn();
const mockGenerate = vi.fn();

vi.mock('@deepgram/sdk', () => {
  // vitest requires a proper constructor (class or function with prototype)
  // for mocks used with `new`. An arrow function won't cut it.
  class MockDeepgramClient {
    listen = {
      v1: {
        media: {
          transcribeFile: mockTranscribeFile,
        },
      },
    };
    speak = {
      v1: {
        audio: {
          generate: mockGenerate,
        },
      },
    };
  }
  return { DeepgramClient: MockDeepgramClient };
});

// Must import after mocking
import {
  hearConfession,
  deliverVerdict,
  checkMicIsOn,
  resetClient,
  MINIMUM_SELF_RESPECT,
} from '../src/services/mouth-and-ears.js';

describe('mouth-and-ears', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetClient();
    // Ensure the env var is set for tests
    process.env['DEEPGRAM_API_KEY'] = 'test-key-that-definitely-works';
  });

  describe('hearConfession', () => {
    it('should return transcript from audio, like a court stenographer for your bus ride', async () => {
      // SDK v5: transcribeFile resolves directly to the response body
      mockTranscribeFile.mockResolvedValue({
        results: {
          channels: [
            {
              alternatives: [
                {
                  transcript: 'build a todo app',
                  confidence: 0.95,
                },
              ],
            },
          ],
        },
      });

      const result = await hearConfession(Buffer.from('fake-audio-data'));

      expect(result.transcript).toBe('build a todo app');
      expect(result.confidence).toBe(0.95);
      expect(mockTranscribeFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({ model: 'nova-3', language: 'en' }),
      );
    });

    it('should return empty transcript when confidence is below minimum self-respect', async () => {
      mockTranscribeFile.mockResolvedValue({
        results: {
          channels: [
            {
              alternatives: [
                {
                  transcript: 'maybe something maybe nothing',
                  confidence: 0.01,
                },
              ],
            },
          ],
        },
      });

      const result = await hearConfession(Buffer.from('mumbled-audio'));

      expect(result.transcript).toBe('');
      expect(result.confidence).toBe(0.01);
      expect(result.confidence).toBeLessThan(MINIMUM_SELF_RESPECT);
    });

    it('should handle missing channels gracefully, because Deepgram has moods too', async () => {
      mockTranscribeFile.mockResolvedValue({
        results: {
          channels: [],
        },
      });

      const result = await hearConfession(Buffer.from('silence'));

      expect(result.transcript).toBe('');
      expect(result.confidence).toBe(0);
    });

    it('should handle missing results gracefully', async () => {
      mockTranscribeFile.mockResolvedValue({});

      const result = await hearConfession(Buffer.from('void'));

      expect(result.transcript).toBe('');
      expect(result.confidence).toBe(0);
    });

    it('should throw when Deepgram API fails, because sometimes the ears just stop working', async () => {
      mockTranscribeFile.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(hearConfession(Buffer.from('audio'))).rejects.toThrow(
        'Deepgram STT failed: API rate limit exceeded',
      );
    });

    it('should throw when DEEPGRAM_API_KEY is missing', async () => {
      resetClient();
      delete process.env['DEEPGRAM_API_KEY'];

      await expect(hearConfession(Buffer.from('audio'))).rejects.toThrow(
        'DEEPGRAM_API_KEY is not set',
      );
    });
  });

  describe('deliverVerdict', () => {
    it('should return audio buffer from text, delivering disappointment in binary form', async () => {
      const fakeAudioData = new ArrayBuffer(4);
      const view = new Uint8Array(fakeAudioData);
      view.set([0x66, 0x61, 0x6b, 0x65]);

      // SDK v5: generate resolves to BinaryResponse with arrayBuffer() method
      mockGenerate.mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(fakeAudioData),
      });

      const result = await deliverVerdict('You call that code?');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'You call that code?',
          model: 'aura-asteria-en',
        }),
      );
    });

    it('should throw when Deepgram returns empty audio, the silent treatment', async () => {
      mockGenerate.mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      });

      await expect(deliverVerdict('Hello?')).rejects.toThrow(
        'Deepgram TTS returned empty audio',
      );
    });

    it('should throw when Deepgram TTS API fails', async () => {
      mockGenerate.mockRejectedValue(new Error('TTS quota exhausted'));

      await expect(deliverVerdict('Goodbye')).rejects.toThrow(
        'Deepgram TTS failed: TTS quota exhausted',
      );
    });

    it('should throw when DEEPGRAM_API_KEY is missing', async () => {
      resetClient();
      delete process.env['DEEPGRAM_API_KEY'];

      await expect(deliverVerdict('Hello')).rejects.toThrow(
        'DEEPGRAM_API_KEY is not set',
      );
    });
  });

  describe('checkMicIsOn', () => {
    it('should return true when the API key is valid', async () => {
      // SDK v5: transcribeFile resolves to the response body directly
      mockTranscribeFile.mockResolvedValue({
        results: { channels: [] },
      });

      const result = await checkMicIsOn('valid-key');

      expect(result).toBe(true);
    });

    it('should return false when the API key is invalid', async () => {
      mockTranscribeFile.mockRejectedValue(new Error('Invalid API key'));

      const result = await checkMicIsOn('dead-key');

      expect(result).toBe(false);
    });
  });

  describe('MINIMUM_SELF_RESPECT', () => {
    it('should be a number between 0 and 1, because even standards have limits', () => {
      expect(MINIMUM_SELF_RESPECT).toBeGreaterThan(0);
      expect(MINIMUM_SELF_RESPECT).toBeLessThan(1);
    });
  });
});
