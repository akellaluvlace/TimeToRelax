// voice-pipeline.test.ts -- Testing the mobile voice client.
// Making sure fetch calls go to the right places with the right shapes.
// No actual network calls. No actual Deepgram. Just vibes and mocks.

import {
  confessToTheServer,
  hearTheVerdict,
  RECONNECT_DELAYS,
} from '@/services/voice-pipeline';

// Store the original fetch so we can restore it
const originalFetch = global.fetch;

// Mock URL.createObjectURL since it doesn't exist in test environment
const mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-audio-url');
global.URL.createObjectURL = mockCreateObjectURL;

describe('voice-pipeline', () => {
  const BACKEND_URL = 'http://localhost:3000';
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('confessToTheServer', () => {
    it('should send audio and return transcript, like a confession booth with a receipt', async () => {
      // First fetch: reading the audio file from local URI
      const fakeBlob = new Blob(['fake-audio'], { type: 'audio/wav' });
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(fakeBlob),
        })
        // Second fetch: sending to backend
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              transcript: 'fix the login bug',
              confidence: 0.88,
            }),
        });

      const result = await confessToTheServer(
        'file:///tmp/audio.wav',
        BACKEND_URL,
      );

      expect(result.transcript).toBe('fix the login bug');
      expect(result.confidence).toBe(0.88);

      // Verify the second fetch call goes to the right endpoint
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const secondCall = mockFetch.mock.calls[1] as [string, RequestInit];
      expect(secondCall[0]).toBe(`${BACKEND_URL}/voice/transcribe`);
      expect(secondCall[1]?.method).toBe('POST');
      expect(secondCall[1]?.headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/octet-stream',
        }),
      );
    });

    it('should throw when backend returns error status', async () => {
      const fakeBlob = new Blob(['audio']);
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(fakeBlob),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal server error'),
        });

      await expect(
        confessToTheServer('file:///tmp/audio.wav', BACKEND_URL),
      ).rejects.toThrow('Transcription failed with status 500');
    });

    it('should throw when network request fails entirely', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

      await expect(
        confessToTheServer('file:///tmp/audio.wav', BACKEND_URL),
      ).rejects.toThrow('Network request failed');
    });

    it('should throw when response has unexpected shape', async () => {
      const fakeBlob = new Blob(['audio']);
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(fakeBlob),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ weird: 'response' }),
        });

      await expect(
        confessToTheServer('file:///tmp/audio.wav', BACKEND_URL),
      ).rejects.toThrow('unexpected response shape');
    });
  });

  describe('hearTheVerdict', () => {
    it('should send text and return audio URL', async () => {
      const fakeAudioBlob = new Blob(['fake-mp3-data'], {
        type: 'audio/mpeg',
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(fakeAudioBlob),
      });

      const audioUrl = await hearTheVerdict(
        'Your code compiles. Barely.',
        BACKEND_URL,
      );

      expect(audioUrl).toBe('blob:mock-audio-url');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(fakeAudioBlob);
      expect(mockFetch).toHaveBeenCalledWith(`${BACKEND_URL}/voice/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'Your code compiles. Barely.' }),
      });
    });

    it('should throw when backend returns error status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: () => Promise.resolve('Service unavailable'),
      });

      await expect(
        hearTheVerdict('Hello?', BACKEND_URL),
      ).rejects.toThrow('TTS failed with status 503');
    });

    it('should throw when network request fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(
        hearTheVerdict('Anyone there?', BACKEND_URL),
      ).rejects.toThrow('Connection refused');
    });
  });

  describe('RECONNECT_DELAYS', () => {
    it('should have exponential-ish backoff values', () => {
      expect(RECONNECT_DELAYS.length).toBeGreaterThan(0);
      // Each delay should be >= the previous one
      for (let i = 1; i < RECONNECT_DELAYS.length; i++) {
        expect(RECONNECT_DELAYS[i]).toBeGreaterThanOrEqual(
          RECONNECT_DELAYS[i - 1]!,
        );
      }
    });

    it('should cap at 10 seconds because patience has limits', () => {
      const maxDelay = RECONNECT_DELAYS[RECONNECT_DELAYS.length - 1];
      expect(maxDelay).toBeLessThanOrEqual(10000);
    });
  });
});
