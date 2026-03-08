// grok-voice.test.ts -- Testing the Grok Realtime API client.
// Making sure the upgrade path works before users commit to it.
// No actual WebSockets. No actual xAI. Just mocks and trust issues.

import {
  acquireTheUpgrade,
  connectToTheUpgrade,
  validateTheUpgrade,
} from '@/services/grok-voice';

import type { GrokSessionInfo } from '@/services/grok-voice';

// Mock the confession booth so tests don't spray logs everywhere
jest.mock('../src/services/confessional', () => ({
  openBooth: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Store the original fetch so we can restore it after we're done
const originalFetch = global.fetch;

// Mock WebSocket because Node doesn't have one and phones aren't test runners
class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  url: string;
  protocols: string | string[];

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  sentMessages: string[] = [];

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols ?? '';
    // Auto-open on next tick so onopen handlers have time to register
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  // Helper to simulate incoming messages in tests
  simulateMessage(data: Record<string, unknown>): void {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) } as MessageEvent);
    }
  }

  // Helper to simulate errors in tests
  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Track all created WebSocket instances so tests can inspect them
let lastCreatedWebSocket: MockWebSocket | null = null;

// Install the mock globally
(global as Record<string, unknown>).WebSocket = class extends MockWebSocket {
  constructor(url: string, protocols?: string | string[]) {
    super(url, protocols);
    lastCreatedWebSocket = this;
  }
};

/** A valid session info object for testing. The bare minimum for a Grok session. */
const VALID_SESSION_INFO: GrokSessionInfo = {
  token: 'test-token-123',
  wsUrl: 'wss://grok.example.com/realtime',
  systemPrompt: 'You are a cynical co-founder who judges code quality.',
  voiceModel: 'grok-3-fast',
  expiresAt: Date.now() + 3_600_000,
};

describe('grok-voice', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    lastCreatedWebSocket = null;
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('acquireTheUpgrade', () => {
    it('should successfully acquire a session token when the backend cooperates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(VALID_SESSION_INFO),
      });

      const result = await acquireTheUpgrade('http://localhost:3000', 'xai-test-key');

      expect(result.token).toBe('test-token-123');
      expect(result.wsUrl).toBe('wss://grok.example.com/realtime');
      expect(result.voiceModel).toBe('grok-3-fast');
      expect(result.systemPrompt).toBe('You are a cynical co-founder who judges code quality.');

      // Verify we sent the key in the right header
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/voice/grok/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-xai-key': 'xai-test-key',
          }),
        }),
      );
    });

    it('should throw when the backend decides today is not the day', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Invalid xAI key'),
      });

      await expect(
        acquireTheUpgrade('http://localhost:3000', 'bad-key'),
      ).rejects.toThrow('Grok token acquisition failed with status 401');
    });

    it('should throw when the backend returns garbage instead of session info', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ surprise: 'wrong shape entirely' }),
      });

      await expect(
        acquireTheUpgrade('http://localhost:3000', 'xai-key'),
      ).rejects.toThrow('unexpected response shape');
    });

    it('should throw when the network vanishes mid-request', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

      await expect(
        acquireTheUpgrade('http://localhost:3000', 'xai-key'),
      ).rejects.toThrow('Network request failed');
    });
  });

  describe('validateTheUpgrade', () => {
    it('should return true when xAI confirms the key has a pulse', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ valid: true }),
      });

      const result = await validateTheUpgrade('http://localhost:3000', 'xai-good-key');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/voice/grok/validate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-xai-key': 'xai-good-key',
          }),
        }),
      );
    });

    it('should return false when the key is as dead as your side project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ valid: false }),
      });

      const result = await validateTheUpgrade('http://localhost:3000', 'xai-dead-key');
      expect(result).toBe(false);
    });

    it('should return false when the backend returns an error status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal server error'),
      });

      const result = await validateTheUpgrade('http://localhost:3000', 'xai-key');
      expect(result).toBe(false);
    });

    it('should return false when the network disappears instead of crashing', async () => {
      mockFetch.mockRejectedValueOnce(new Error('DNS resolution failed'));

      const result = await validateTheUpgrade('http://localhost:3000', 'xai-key');
      expect(result).toBe(false);
    });
  });

  describe('connectToTheUpgrade', () => {
    it('should create a connection object with all the methods a developer could want', () => {
      const connection = connectToTheUpgrade(VALID_SESSION_INFO);

      expect(typeof connection.sendAudio).toBe('function');
      expect(typeof connection.onTranscript).toBe('function');
      expect(typeof connection.onAudio).toBe('function');
      expect(typeof connection.onError).toBe('function');
      expect(typeof connection.disconnect).toBe('function');
      expect(typeof connection.isConnected).toBe('function');
    });

    it('should send session.update on connection because Grok needs to know the rules', (done) => {
      connectToTheUpgrade(VALID_SESSION_INFO);

      // Wait for the WebSocket onopen to fire (setTimeout 0 in mock)
      setTimeout(() => {
        expect(lastCreatedWebSocket).not.toBeNull();
        expect(lastCreatedWebSocket!.sentMessages.length).toBe(1);

        const sessionUpdate = JSON.parse(lastCreatedWebSocket!.sentMessages[0]!) as Record<string, unknown>;
        expect(sessionUpdate).toEqual(
          expect.objectContaining({
            type: 'session.update',
            session: expect.objectContaining({
              instructions: VALID_SESSION_INFO.systemPrompt,
              model: VALID_SESSION_INFO.voiceModel,
            }),
          }),
        );
        done();
      }, 10);
    });

    it('should deliver transcript events to registered callbacks', (done) => {
      const connection = connectToTheUpgrade(VALID_SESSION_INFO);

      const transcripts: Array<{ text: string; isFinal: boolean }> = [];
      connection.onTranscript((text, isFinal) => {
        transcripts.push({ text, isFinal });
      });

      setTimeout(() => {
        // Simulate a final transcript event
        lastCreatedWebSocket!.simulateMessage({
          type: 'conversation.item.input_audio_transcription.completed',
          transcript: 'fix the login bug',
        });

        expect(transcripts).toEqual([
          { text: 'fix the login bug', isFinal: true },
        ]);
        done();
      }, 10);
    });

    it('should deliver audio events to registered callbacks', (done) => {
      const connection = connectToTheUpgrade(VALID_SESSION_INFO);

      const audioChunks: string[] = [];
      connection.onAudio((base64Audio) => {
        audioChunks.push(base64Audio);
      });

      setTimeout(() => {
        lastCreatedWebSocket!.simulateMessage({
          type: 'response.audio.delta',
          delta: 'base64audiodata==',
        });

        expect(audioChunks).toEqual(['base64audiodata==']);
        done();
      }, 10);
    });

    it('should deliver error events when Grok has an opinion about your code', (done) => {
      const connection = connectToTheUpgrade(VALID_SESSION_INFO);

      const errors: Error[] = [];
      connection.onError((err) => {
        errors.push(err);
      });

      setTimeout(() => {
        lastCreatedWebSocket!.simulateMessage({
          type: 'error',
          error: {
            message: 'Rate limit exceeded',
            code: 'rate_limit',
          },
        });

        expect(errors.length).toBe(1);
        expect(errors[0]!.message).toContain('Rate limit exceeded');
        done();
      }, 10);
    });

    it('should close the WebSocket when disconnect is called because goodbyes matter', () => {
      const connection = connectToTheUpgrade(VALID_SESSION_INFO);

      connection.disconnect();

      expect(lastCreatedWebSocket).not.toBeNull();
      expect(lastCreatedWebSocket!.readyState).toBe(MockWebSocket.CLOSED);
    });

    it('should send audio chunks through the WebSocket when connected', (done) => {
      const connection = connectToTheUpgrade(VALID_SESSION_INFO);

      setTimeout(() => {
        connection.sendAudio('dGVzdC1hdWRpby1kYXRh');

        // First message is session.update, second is our audio
        expect(lastCreatedWebSocket!.sentMessages.length).toBe(2);
        const audioEvent = JSON.parse(lastCreatedWebSocket!.sentMessages[1]!) as Record<string, unknown>;
        expect(audioEvent).toEqual({
          type: 'input_audio_buffer.append',
          audio: 'dGVzdC1hdWRpby1kYXRh',
        });
        done();
      }, 10);
    });

    it('should silently ignore audio sends when not connected', () => {
      const connection = connectToTheUpgrade(VALID_SESSION_INFO);

      // WebSocket is still CONNECTING (hasn't opened yet), but our
      // mock readyState starts at CONNECTING. sendAudio checks OPEN.
      connection.sendAudio('should-be-dropped');

      // Only the session.update (if any) should have been sent
      // At this point, onopen hasn't fired yet, so no messages at all
      expect(lastCreatedWebSocket!.sentMessages.length).toBe(0);
    });

    it('should gracefully handle unparseable WebSocket messages', (done) => {
      connectToTheUpgrade(VALID_SESSION_INFO);

      setTimeout(() => {
        // Send a non-JSON message. This should not throw.
        if (lastCreatedWebSocket!.onmessage) {
          lastCreatedWebSocket!.onmessage({
            data: 'this is not json',
          } as MessageEvent);
        }

        // If we got here without throwing, the test passes.
        // Graceful degradation at its finest.
        done();
      }, 10);
    });

    it('should report WebSocket errors through the error callback', () => {
      const connection = connectToTheUpgrade(VALID_SESSION_INFO);

      const errors: Error[] = [];
      connection.onError((err) => {
        errors.push(err);
      });

      lastCreatedWebSocket!.simulateError();

      expect(errors.length).toBe(1);
      expect(errors[0]!.message).toContain('WebSocket connection error');
    });
  });
});
