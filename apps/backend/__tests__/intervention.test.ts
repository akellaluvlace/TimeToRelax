import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  enforceBreak,
  isOnTimeout,
  parole,
  headcount,
} from '../src/services/intervention.js';

// Mock the-void so we can verify SSE events without needing real connections
vi.mock('../src/services/the-void.js', () => ({
  screamIntoTheVoid: vi.fn(),
}));

// Import mocked module for assertion -- same pattern as enabler.test.ts
import { screamIntoTheVoid } from '../src/services/the-void.js';

// Typed reference for the mock so TypeScript doesn't complain
const mockScream = vi.mocked(screamIntoTheVoid);

describe('intervention', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockScream.mockClear();
    // Clean up any leftover rate limits from previous tests
    parole('test-session');
    parole('another-session');
    parole('extend-session');
  });

  afterEach(() => {
    // Parole everyone to clear timers
    parole('test-session');
    parole('another-session');
    parole('extend-session');
    vi.useRealTimers();
  });

  describe('enforceBreak', () => {
    it('should store rate limit state for the session, like a timeout for toddlers', async () => {
      await enforceBreak(5_000, 'test-session');

      const state = isOnTimeout('test-session');
      expect(state).not.toBeNull();
      expect(state!.sessionId).toBe('test-session');
      expect(state!.retryAfterMs).toBe(5_000);
      expect(state!.resumeAt).toBeGreaterThan(state!.startedAt);
    });

    it('should emit an initial rate_limited SSE event because the client needs to know', async () => {
      await enforceBreak(3_000, 'test-session');

      expect(mockScream).toHaveBeenCalledWith('test-session', {
        type: 'rate_limited',
        data: { remainingMs: 3_000, retryAfterMs: 3_000 },
      });
    });

    it('should emit countdown events every second like a judgmental clock', async () => {
      await enforceBreak(3_000, 'test-session');

      // Clear the initial call count
      const initialCalls = mockScream.mock.calls.length;

      // Advance 1 second -- should emit a countdown event
      vi.advanceTimersByTime(1_000);
      expect(mockScream.mock.calls.length).toBeGreaterThan(initialCalls);

      // The latest call should be a rate_limited event with reduced remainingMs
      const latestCall = mockScream.mock.calls[mockScream.mock.calls.length - 1];
      expect(latestCall).toBeDefined();
      expect(latestCall![1].type).toBe('rate_limited');
    });

    it('should extend an existing rate limit instead of stacking them', async () => {
      await enforceBreak(5_000, 'test-session');
      await enforceBreak(10_000, 'test-session');

      const state = isOnTimeout('test-session');
      expect(state).not.toBeNull();
      expect(state!.retryAfterMs).toBe(10_000);
      expect(headcount()).toBe(1);
    });
  });

  describe('isOnTimeout', () => {
    it('should return state for a rate-limited session', async () => {
      await enforceBreak(5_000, 'test-session');

      const state = isOnTimeout('test-session');
      expect(state).not.toBeNull();
      expect(state!.sessionId).toBe('test-session');
    });

    it('should return null for a session that is not rate-limited, because they are free', () => {
      expect(isOnTimeout('free-soul')).toBeNull();
    });

    it('should return a copy so callers cannot mutate the internal state', async () => {
      await enforceBreak(5_000, 'test-session');

      const state1 = isOnTimeout('test-session');
      const state2 = isOnTimeout('test-session');
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });
  });

  describe('parole', () => {
    it('should clear rate limit state for a session, sweet freedom', async () => {
      await enforceBreak(5_000, 'test-session');
      expect(isOnTimeout('test-session')).not.toBeNull();

      parole('test-session');
      expect(isOnTimeout('test-session')).toBeNull();
    });

    it('should emit a rate_limit_cleared event so the client can celebrate', async () => {
      await enforceBreak(5_000, 'test-session');
      mockScream.mockClear();

      parole('test-session');

      expect(mockScream).toHaveBeenCalledWith('test-session', expect.objectContaining({
        type: 'rate_limit_cleared',
      }));
    });

    it('should handle paroling a session that was never detained without drama', () => {
      expect(() => parole('never-detained')).not.toThrow();
    });
  });

  describe('auto-parole', () => {
    it('should automatically parole after retryAfterMs expires because time heals all rate limits', async () => {
      await enforceBreak(5_000, 'test-session');
      expect(isOnTimeout('test-session')).not.toBeNull();

      vi.advanceTimersByTime(5_000);

      expect(isOnTimeout('test-session')).toBeNull();
    });

    it('should emit rate_limit_cleared on auto-parole', async () => {
      await enforceBreak(3_000, 'test-session');
      mockScream.mockClear();

      vi.advanceTimersByTime(3_000);

      const clearedCalls = mockScream.mock.calls.filter(
        (call) => call[1].type === 'rate_limit_cleared',
      );
      expect(clearedCalls.length).toBe(1);
    });
  });

  describe('headcount', () => {
    it('should track the number of rate-limited sessions', async () => {
      expect(headcount()).toBe(0);

      await enforceBreak(5_000, 'test-session');
      expect(headcount()).toBe(1);

      await enforceBreak(5_000, 'another-session');
      expect(headcount()).toBe(2);

      parole('test-session');
      expect(headcount()).toBe(1);
    });
  });
});
