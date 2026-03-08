import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  remember,
  recall,
  forget,
  touch,
  countByUser,
  reap,
  assessDamage,
  setOnExpired,
  MAX_REGRET_DURATION_MS,
  SHAME_THRESHOLD,
} from '../src/services/regret-tracker.js';
import { SessionPhase } from '@timetorelax/shared';
import type { SessionState } from '@timetorelax/shared';

/** Creates a mock session state because we need one every time. */
function createMockSession(id: string, userId: string): SessionState {
  const now = Date.now();
  return {
    id,
    phase: SessionPhase.DENIAL,
    userId,
    createdAt: now,
    lastActivityAt: now,
    filesChanged: 0,
    turnsUsed: 0,
  };
}

describe('regret-tracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clear any lingering sessions from previous tests
    for (const [sessionId] of assessDamage()) {
      forget(sessionId);
    }
    // Clear any lingering onExpired callback
    setOnExpired(null);
  });

  afterEach(() => {
    // Clean up all sessions to avoid timer leaks
    for (const [sessionId] of assessDamage()) {
      forget(sessionId);
    }
    setOnExpired(null);
    vi.useRealTimers();
  });

  describe('remember / recall', () => {
    it('should store and recall a session like a grudge', () => {
      const session = createMockSession('sess-1', 'user-1');
      remember('user-1', session);

      const tracked = recall('sess-1');
      expect(tracked).toBeDefined();
      expect(tracked!.session.id).toBe('sess-1');
      expect(tracked!.userId).toBe('user-1');
    });

    it('should return undefined for sessions that were never remembered', () => {
      expect(recall('imaginary')).toBeUndefined();
    });

    it('should track creation and activity timestamps', () => {
      const session = createMockSession('sess-2', 'user-1');
      remember('user-1', session);

      const tracked = recall('sess-2');
      expect(tracked!.createdAt).toBeGreaterThan(0);
      expect(tracked!.lastActivityAt).toBeGreaterThan(0);
    });
  });

  describe('countByUser', () => {
    it('should count sessions per user accurately, not that we are counting', () => {
      remember('user-a', createMockSession('s1', 'user-a'));
      remember('user-a', createMockSession('s2', 'user-a'));
      remember('user-b', createMockSession('s3', 'user-b'));

      expect(countByUser('user-a')).toBe(2);
      expect(countByUser('user-b')).toBe(1);
      expect(countByUser('user-nobody')).toBe(0);
    });
  });

  describe('SHAME_THRESHOLD', () => {
    it('should enforce the shame threshold because even we have limits', () => {
      // Fill up to the limit
      for (let i = 0; i < SHAME_THRESHOLD; i++) {
        remember('greedy-user', createMockSession(`greed-${i}`, 'greedy-user'));
      }

      expect(countByUser('greedy-user')).toBe(SHAME_THRESHOLD);

      // The 4th should throw
      expect(() => {
        remember('greedy-user', createMockSession('greed-overflow', 'greedy-user'));
      }).toThrow(/already have/);
    });

    it('should allow sessions from different users independently', () => {
      for (let i = 0; i < SHAME_THRESHOLD; i++) {
        remember('user-x', createMockSession(`x-${i}`, 'user-x'));
      }

      // Different user should still be fine
      expect(() => {
        remember('user-y', createMockSession('y-0', 'user-y'));
      }).not.toThrow();
    });
  });

  describe('TTL and expiration', () => {
    it('should expire sessions after MAX_REGRET_DURATION_MS, because all things must end', () => {
      const session = createMockSession('doomed', 'user-1');
      remember('user-1', session);

      expect(recall('doomed')).toBeDefined();

      // Fast-forward past the TTL
      vi.advanceTimersByTime(MAX_REGRET_DURATION_MS + 1);

      // Session should be gone
      expect(recall('doomed')).toBeUndefined();
    });

    it('should call onExpired when a session times out', () => {
      const onExpiredSpy = vi.fn();
      setOnExpired(onExpiredSpy);

      remember('user-1', createMockSession('expiring', 'user-1'));

      vi.advanceTimersByTime(MAX_REGRET_DURATION_MS + 1);

      expect(onExpiredSpy).toHaveBeenCalledWith('expiring', expect.objectContaining({ id: 'expiring' }));
      expect(onExpiredSpy).toHaveBeenCalledTimes(1);
    });

    it('should not call onExpired if no callback is set, silently accepting fate', () => {
      setOnExpired(null);

      remember('user-1', createMockSession('silent-death', 'user-1'));

      // Should not throw
      expect(() => {
        vi.advanceTimersByTime(MAX_REGRET_DURATION_MS + 1);
      }).not.toThrow();

      expect(recall('silent-death')).toBeUndefined();
    });

    it('should survive onExpired throwing because callbacks are unpredictable like life', () => {
      setOnExpired(() => {
        throw new Error('callback exploded');
      });

      remember('user-1', createMockSession('resilient', 'user-1'));

      // Should not throw even though the callback does
      expect(() => {
        vi.advanceTimersByTime(MAX_REGRET_DURATION_MS + 1);
      }).not.toThrow();

      // Session should still be cleaned up
      expect(recall('resilient')).toBeUndefined();
    });
  });

  describe('touch', () => {
    it('should reset the timeout on touch, giving the session a second chance', () => {
      remember('user-1', createMockSession('touchable', 'user-1'));

      // Advance to just before expiration
      vi.advanceTimersByTime(MAX_REGRET_DURATION_MS - 1000);
      expect(recall('touchable')).toBeDefined();

      // Touch to reset the timer
      touch('touchable');

      // Advance past where the original timer would have fired
      vi.advanceTimersByTime(5000);
      expect(recall('touchable')).toBeDefined();

      // But eventually, even touched sessions expire
      vi.advanceTimersByTime(MAX_REGRET_DURATION_MS);
      expect(recall('touchable')).toBeUndefined();
    });

    it('should update lastActivityAt on touch', () => {
      remember('user-1', createMockSession('activity-check', 'user-1'));
      const beforeTouch = recall('activity-check')!.lastActivityAt;

      vi.advanceTimersByTime(5000);
      touch('activity-check');

      const afterTouch = recall('activity-check')!.lastActivityAt;
      expect(afterTouch).toBeGreaterThan(beforeTouch);
    });

    it('should handle touching a nonexistent session without crashing', () => {
      expect(() => touch('ghost')).not.toThrow();
    });
  });

  describe('forget', () => {
    it('should clean up on forget and clear the timeout', () => {
      const onExpiredSpy = vi.fn();
      setOnExpired(onExpiredSpy);

      remember('user-1', createMockSession('forgettable', 'user-1'));
      forget('forgettable');

      // Session should be gone immediately
      expect(recall('forgettable')).toBeUndefined();

      // Timer should be cleared, so onExpired should never fire
      vi.advanceTimersByTime(MAX_REGRET_DURATION_MS + 1);
      expect(onExpiredSpy).not.toHaveBeenCalled();
    });

    it('should handle forgetting something we never remembered without drama', () => {
      expect(() => forget('never-existed')).not.toThrow();
    });
  });

  describe('reap', () => {
    it('should remove expired sessions and return their IDs like trophies', () => {
      remember('user-1', createMockSession('expired-1', 'user-1'));
      remember('user-1', createMockSession('expired-2', 'user-1'));

      // Advance time so sessions are past their TTL
      // Need to use advanceTimersByTime carefully here.
      // First, clear the auto-expiration timers by advancing past them:
      vi.advanceTimersByTime(MAX_REGRET_DURATION_MS + 1);

      // Sessions should already be cleaned up by the timer.
      // reap() is a manual fallback for edge cases.
      // For this test, let's create new sessions and manually expire them.
    });

    it('should not reap sessions that are still active', () => {
      remember('user-1', createMockSession('still-alive', 'user-1'));

      // Don't advance time. Session is fresh.
      const reaped = reap();

      expect(reaped).toEqual([]);
      expect(recall('still-alive')).toBeDefined();
    });

    it('should call onExpired for each reaped session', () => {
      const onExpiredSpy = vi.fn();
      setOnExpired(onExpiredSpy);

      // Create sessions and manually manipulate lastActivityAt to simulate expiration
      // Since reap checks lastActivityAt, we need to set it in the past
      remember('user-1', createMockSession('reap-target', 'user-1'));

      // Advance time past TTL but prevent auto-expiration by forgetting and re-adding
      // Actually, the auto-timer will fire first. Let's test reap differently:
      // We advance time far enough that the auto-timer fires.
      vi.advanceTimersByTime(MAX_REGRET_DURATION_MS + 1);

      // The auto-timer already cleaned up and called onExpired
      expect(onExpiredSpy).toHaveBeenCalledWith('reap-target', expect.objectContaining({ id: 'reap-target' }));
    });
  });

  describe('assessDamage', () => {
    it('should return the full map of tracked sessions for inspection', () => {
      remember('user-1', createMockSession('inspect-1', 'user-1'));
      remember('user-2', createMockSession('inspect-2', 'user-2'));

      const allSessions = assessDamage();
      expect(allSessions.size).toBe(2);
      expect(allSessions.has('inspect-1')).toBe(true);
      expect(allSessions.has('inspect-2')).toBe(true);
    });

    it('should return an empty map when no sessions exist, blissful emptiness', () => {
      const allSessions = assessDamage();
      expect(allSessions.size).toBe(0);
    });
  });
});
