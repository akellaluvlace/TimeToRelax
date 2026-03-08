import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  enableMaximumChaos,
  getTheGrokPersonality,
  checkGrokPulse,
} from '../src/services/the-upgrade.js';

// Mock fetch globally. Same pattern as no-laptop-no-problem.
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('the-upgrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('enableMaximumChaos', () => {
    it('should exchange an xAI key for an ephemeral token like a shady back-alley deal', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          client_secret: {
            value: 'eph_token_of_chaos',
            expires_at: 1741500000,
          },
        }),
      });

      const result = await enableMaximumChaos('xai-valid-key');

      expect(result.token).toBe('eph_token_of_chaos');
      expect(result.expiresAt).toBe(1741500000);
      expect(result.voiceModel).toBe('sage');

      // Verify we called the right endpoint with the right auth
      const [url, options] = mockFetch.mock.calls[0]!;
      expect(url).toBe('https://api.x.ai/v1/realtime/sessions');
      expect((options as { headers: Record<string, string> }).headers['Authorization']).toBe(
        'Bearer xai-valid-key',
      );
    });

    it('should throw when xAI says the key is dead', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(enableMaximumChaos('xai-dead-key')).rejects.toThrow(
        'xAI API key is dead',
      );
    });

    it('should throw when xAI rate limits because even chaos has boundaries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      await expect(enableMaximumChaos('xai-overused-key')).rejects.toThrow(
        'xAI rate limited',
      );
    });

    it('should throw on generic API failure because the universe is indifferent', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(enableMaximumChaos('xai-unlucky-key')).rejects.toThrow(
        'xAI API returned 500',
      );
    });

    it('should throw when xAI returns a response shaped like nothing we expected', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ something: 'unexpected' }),
      });

      await expect(enableMaximumChaos('xai-confusing-key')).rejects.toThrow(
        'cannot parse',
      );
    });

    it('should survive network failure without taking the server down with it', async () => {
      mockFetch.mockRejectedValueOnce(new Error('DNS resolution failed'));

      await expect(enableMaximumChaos('xai-offline-key')).rejects.toThrow(
        'Failed to get Grok ephemeral token',
      );
    });
  });

  describe('getTheGrokPersonality', () => {
    it('should return a non-empty system prompt because an unprompted AI is a liability', () => {
      const prompt = getTheGrokPersonality();
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('should contain the core identity because personality is not optional', () => {
      const prompt = getTheGrokPersonality();
      expect(prompt).toContain('TimeToRelax');
      expect(prompt).toContain('reluctant accomplice');
      expect(prompt).toContain('cynical co-founder');
    });

    it('should enforce the "never apologize" rule because we have standards', () => {
      const prompt = getTheGrokPersonality();
      expect(prompt).toContain('never apologize');
    });

    it('should keep responses short because nobody wants a monologue on the bus', () => {
      const prompt = getTheGrokPersonality();
      expect(prompt).toContain('Short sentences');
      expect(prompt).toContain('15 seconds');
    });

    it('should ban corporate chatbot language because we are better than that', () => {
      const prompt = getTheGrokPersonality();
      // The prompt should tell Grok what NOT to say
      expect(prompt).toContain('Oops');
      expect(prompt).toContain('Uh oh');
      expect(prompt).toContain('Something went wrong');
    });

    it('should include the Dublin origin story because authenticity is the brand', () => {
      const prompt = getTheGrokPersonality();
      expect(prompt).toContain('Dublin');
    });
  });

  describe('checkGrokPulse', () => {
    it('should confirm a valid xAI key has a pulse', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await checkGrokPulse('xai-alive-key');
      expect(result).toBe(true);

      // Verify we hit the models endpoint
      const [url] = mockFetch.mock.calls[0]!;
      expect(url).toBe('https://api.x.ai/v1/models');
    });

    it('should declare a dead key dead without ceremony', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await checkGrokPulse('xai-dead-key');
      expect(result).toBe(false);
    });

    it('should return false on network failure because optimism is not a strategy', async () => {
      mockFetch.mockRejectedValueOnce(new Error('connection refused'));

      const result = await checkGrokPulse('xai-offline-key');
      expect(result).toBe(false);
    });
  });
});
