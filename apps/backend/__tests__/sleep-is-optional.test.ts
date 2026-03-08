import { describe, it, expect, beforeEach } from 'vitest';

import { SessionPhase } from '@timetorelax/shared';
import type { SessionState } from '@timetorelax/shared';

import {
  rememberForLater,
  wakeUpCall,
  listRegrets,
  letItGo,
  drawerSize,
} from '../src/services/sleep-is-optional.js';

/** Creates a mock session state because every test needs a victim. */
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

describe('sleep-is-optional', () => {
  beforeEach(() => {
    // Clean up saved sessions from previous tests.
    // letItGo on known IDs since we can't clear the internal Map directly.
    letItGo('save-1');
    letItGo('save-2');
    letItGo('save-3');
    letItGo('user-a-sess-1');
    letItGo('user-a-sess-2');
    letItGo('user-b-sess-1');
    letItGo('ghost');
    letItGo('overwrite-me');
    letItGo('copy-check');
  });

  describe('rememberForLater / wakeUpCall', () => {
    it('should store and retrieve a session state like a responsible adult', () => {
      const session = createMockSession('save-1', 'user-1');
      rememberForLater('save-1', session);

      const restored = wakeUpCall('save-1');
      expect(restored).not.toBeNull();
      expect(restored!.id).toBe('save-1');
      expect(restored!.userId).toBe('user-1');
      expect(restored!.phase).toBe(SessionPhase.DENIAL);
    });

    it('should return null for sessions that were never saved, because some things are gone forever', () => {
      expect(wakeUpCall('never-saved')).toBeNull();
    });

    it('should return a copy so callers cannot mutate the saved state', () => {
      const session = createMockSession('copy-check', 'user-1');
      rememberForLater('copy-check', session);

      const copy1 = wakeUpCall('copy-check');
      const copy2 = wakeUpCall('copy-check');
      expect(copy1).toEqual(copy2);
      expect(copy1).not.toBe(copy2);
    });

    it('should overwrite existing save for same sessionId', () => {
      const session1 = createMockSession('overwrite-me', 'user-1');
      session1.filesChanged = 5;
      rememberForLater('overwrite-me', session1);

      const session2 = createMockSession('overwrite-me', 'user-1');
      session2.filesChanged = 42;
      rememberForLater('overwrite-me', session2);

      const restored = wakeUpCall('overwrite-me');
      expect(restored!.filesChanged).toBe(42);
      expect(drawerSize()).toBe(1);
    });
  });

  describe('listRegrets', () => {
    it('should return sessions for the given user only', () => {
      rememberForLater('user-a-sess-1', createMockSession('user-a-sess-1', 'user-a'));
      rememberForLater('user-a-sess-2', createMockSession('user-a-sess-2', 'user-a'));
      rememberForLater('user-b-sess-1', createMockSession('user-b-sess-1', 'user-b'));

      const userARegrets = listRegrets('user-a');
      expect(userARegrets).toHaveLength(2);
      expect(userARegrets.map((s) => s.id).sort()).toEqual(['user-a-sess-1', 'user-a-sess-2']);

      const userBRegrets = listRegrets('user-b');
      expect(userBRegrets).toHaveLength(1);
      expect(userBRegrets[0]!.id).toBe('user-b-sess-1');
    });

    it('should return an empty array for users with no saved sessions', () => {
      expect(listRegrets('nobody')).toEqual([]);
    });

    it('should return copies so callers cannot mutate the saved sessions', () => {
      rememberForLater('save-1', createMockSession('save-1', 'user-1'));

      const regrets = listRegrets('user-1');
      expect(regrets).toHaveLength(1);

      // Mutate the returned copy
      regrets[0]!.filesChanged = 999;

      // Original should be unchanged
      const fresh = wakeUpCall('save-1');
      expect(fresh!.filesChanged).toBe(0);
    });
  });

  describe('letItGo', () => {
    it('should remove a saved session from storage', () => {
      rememberForLater('save-1', createMockSession('save-1', 'user-1'));
      expect(wakeUpCall('save-1')).not.toBeNull();

      letItGo('save-1');
      expect(wakeUpCall('save-1')).toBeNull();
    });

    it('should handle letting go of something that was never saved, gracefully', () => {
      expect(() => letItGo('imaginary')).not.toThrow();
    });

    it('should not affect other saved sessions when removing one', () => {
      rememberForLater('save-1', createMockSession('save-1', 'user-1'));
      rememberForLater('save-2', createMockSession('save-2', 'user-1'));

      letItGo('save-1');

      expect(wakeUpCall('save-1')).toBeNull();
      expect(wakeUpCall('save-2')).not.toBeNull();
    });
  });

  describe('drawerSize', () => {
    it('should return 0 when no sessions are saved', () => {
      expect(drawerSize()).toBe(0);
    });

    it('should track the number of saved sessions accurately', () => {
      rememberForLater('save-1', createMockSession('save-1', 'user-1'));
      rememberForLater('save-2', createMockSession('save-2', 'user-2'));
      expect(drawerSize()).toBe(2);

      letItGo('save-1');
      expect(drawerSize()).toBe(1);
    });
  });
});
