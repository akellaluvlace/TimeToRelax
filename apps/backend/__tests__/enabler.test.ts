import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  spawnRegret,
  unleash,
  assessDamage,
  welcomeBackYouAddict,
  releaseYouFromYourself,
  setSessionFactory,
  resetSessionFactory,
  HOW_LONG_UNTIL_WE_WORRY,
} from '../src/services/enabler.js';
import type { SessionFactory, AgentSdkEvent } from '../src/services/enabler.js';
import {
  forget,
  assessDamage as trackerAssessDamage,
  setOnExpired,
} from '../src/services/regret-tracker.js';
import { SessionPhase } from '@timetorelax/shared';

// Mock the-void.ts so we can verify events without real SSE
vi.mock('../src/services/the-void.js', () => ({
  screamIntoTheVoid: vi.fn(),
  sealTheVoid: vi.fn(),
  peekIntoTheVoid: vi.fn(),
  gazeIntoTheVoid: vi.fn(),
}));

// Mock denial-engine.ts so personality responses are predictable
vi.mock('../src/services/denial-engine.js', () => ({
  craftDisapproval: vi.fn().mockReturnValue('Your code is a cry for help.'),
}));

// Import mocked modules for assertion
import { screamIntoTheVoid, sealTheVoid } from '../src/services/the-void.js';

const VALID_KEY = 'sk-ant-test-key-12345';
const INVALID_KEY = 'not-an-anthropic-key';

describe('enabler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSessionFactory();
    // Clean up any leftover sessions from previous tests
    for (const [sessionId] of trackerAssessDamage()) {
      forget(sessionId);
    }
  });

  afterEach(() => {
    // Clean up to avoid timer leaks
    for (const [sessionId] of trackerAssessDamage()) {
      forget(sessionId);
    }
    setOnExpired(null);
  });

  describe('spawnRegret', () => {
    it('should create a session and store it, like starting a tab at a bar', async () => {
      const state = await spawnRegret('user-1', {
        anthropicKey: VALID_KEY,
      });

      expect(state).toBeDefined();
      expect(state.id).toBeDefined();
      expect(state.phase).toBe(SessionPhase.DENIAL);
      expect(state.userId).toBe('user-1');
      expect(state.turnsUsed).toBe(0);
      expect(state.filesChanged).toBe(0);
    });

    it('should reject an invalid API key format faster than you can say "clipboard"', async () => {
      await expect(
        spawnRegret('user-1', { anthropicKey: INVALID_KEY }),
      ).rejects.toThrow(/does not look right/);
    });

    it('should reject when user has 3 active sessions because boundaries matter', async () => {
      // Spawn 3 sessions
      await spawnRegret('busy-user', { anthropicKey: VALID_KEY });
      await spawnRegret('busy-user', { anthropicKey: VALID_KEY });
      await spawnRegret('busy-user', { anthropicKey: VALID_KEY });

      // The 4th should fail
      await expect(
        spawnRegret('busy-user', { anthropicKey: VALID_KEY }),
      ).rejects.toThrow(/already have/);
    });

    it('should default to sonnet because opus is for people who hate money', async () => {
      const factorySpy = vi.fn(async () => ({
        id: 'sdk-session-1',
        send: async function* (): AsyncGenerator<AgentSdkEvent> {},
        close: async () => {},
      }));

      setSessionFactory(factorySpy);

      await spawnRegret('user-1', { anthropicKey: VALID_KEY });

      expect(factorySpy).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'sonnet' }),
      );
    });

    it('should use opus when explicitly requested by someone who enjoys large invoices', async () => {
      const factorySpy = vi.fn(async () => ({
        id: 'sdk-session-1',
        send: async function* (): AsyncGenerator<AgentSdkEvent> {},
        close: async () => {},
      }));

      setSessionFactory(factorySpy);

      await spawnRegret('user-1', { anthropicKey: VALID_KEY, model: 'opus' });

      expect(factorySpy).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'opus' }),
      );
    });

    it('should scream a session_start voice response into the void', async () => {
      await spawnRegret('user-1', { anthropicKey: VALID_KEY });

      expect(screamIntoTheVoid).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'voice_response',
          data: expect.objectContaining({ text: expect.any(String) }),
        }),
      );
    });

    it('should store the repoUrl if provided', async () => {
      const state = await spawnRegret('user-1', {
        anthropicKey: VALID_KEY,
        repoUrl: 'https://github.com/test/repo',
      });

      expect(state.repoUrl).toBe('https://github.com/test/repo');
    });
  });

  describe('unleash', () => {
    it('should send an instruction and emit events to SSE', async () => {
      const state = await spawnRegret('user-1', { anthropicKey: VALID_KEY });

      // Reset mock call count from spawn
      vi.mocked(screamIntoTheVoid).mockClear();

      await unleash(state.id, 'add a button that does nothing');

      // The mock factory emits 4 events (thinking, reading, writing, complete)
      // so screamIntoTheVoid should be called at least 4 times
      expect(vi.mocked(screamIntoTheVoid).mock.calls.length).toBeGreaterThanOrEqual(4);
    });

    it('should throw if the session does not exist, because you cannot unleash nothing', async () => {
      await expect(
        unleash('nonexistent', 'do something'),
      ).rejects.toThrow(/not found/);
    });

    it('should respect the 50-turn limit and stop before bankruptcy', async () => {
      // Create a factory that yields events indefinitely
      const infiniteFactory: SessionFactory = async () => ({
        id: 'infinite-sdk',
        send: async function* (): AsyncGenerator<AgentSdkEvent> {
          for (let i = 0; i < 100; i++) {
            yield { type: 'agent_thinking', data: { step: i } };
          }
        },
        close: async () => {},
      });

      setSessionFactory(infiniteFactory);

      const state = await spawnRegret('user-1', { anthropicKey: VALID_KEY });

      vi.mocked(screamIntoTheVoid).mockClear();

      await unleash(state.id, 'rewrite everything');

      // Should have stopped at HOW_LONG_UNTIL_WE_WORRY
      const currentState = assessDamage(state.id);
      expect(currentState!.turnsUsed).toBe(HOW_LONG_UNTIL_WE_WORRY);

      // Should have emitted an agent_error event about the turn limit
      const errorCalls = vi.mocked(screamIntoTheVoid).mock.calls.filter(
        (call) => {
          const event = call[1] as { type: string };
          return event.type === 'agent_error';
        },
      );
      expect(errorCalls.length).toBe(1);
    });

    it('should handle SDK errors gracefully and enter grief phase', async () => {
      const failingFactory: SessionFactory = async () => ({
        id: 'failing-sdk',
        send: async function* (): AsyncGenerator<AgentSdkEvent> {
          yield { type: 'agent_thinking', data: {} };
          throw new Error('SDK exploded. Classic.');
        },
        close: async () => {},
      });

      setSessionFactory(failingFactory);

      const state = await spawnRegret('user-1', { anthropicKey: VALID_KEY });

      vi.mocked(screamIntoTheVoid).mockClear();

      await unleash(state.id, 'break something');

      const currentState = assessDamage(state.id);
      expect(currentState!.phase).toBe(SessionPhase.GRIEF);
    });

    it('should track file changes for the session summary', async () => {
      const fileChangingFactory: SessionFactory = async () => ({
        id: 'file-sdk',
        send: async function* (): AsyncGenerator<AgentSdkEvent> {
          yield { type: 'agent_writing', data: { file: 'src/a.ts' } };
          yield { type: 'file_changed', data: { filePath: 'src/b.ts', action: 'created' } };
          yield { type: 'agent_complete', data: {} };
        },
        close: async () => {},
      });

      setSessionFactory(fileChangingFactory);

      const state = await spawnRegret('user-1', { anthropicKey: VALID_KEY });
      await unleash(state.id, 'change some files');

      const currentState = assessDamage(state.id);
      expect(currentState!.filesChanged).toBe(2);
    });
  });

  describe('assessDamage', () => {
    it('should return session state for existing sessions', async () => {
      const state = await spawnRegret('user-1', { anthropicKey: VALID_KEY });

      const damage = assessDamage(state.id);
      expect(damage).toBeDefined();
      expect(damage!.id).toBe(state.id);
    });

    it('should return undefined for sessions that do not exist, as expected', () => {
      expect(assessDamage('nope')).toBeUndefined();
    });
  });

  describe('welcomeBackYouAddict', () => {
    it('should resume a session and send a personality response', async () => {
      const state = await spawnRegret('user-1', { anthropicKey: VALID_KEY });

      vi.mocked(screamIntoTheVoid).mockClear();

      const resumed = await welcomeBackYouAddict(state.id);

      expect(resumed.id).toBe(state.id);
      expect(screamIntoTheVoid).toHaveBeenCalledWith(
        state.id,
        expect.objectContaining({
          type: 'voice_response',
        }),
      );
    });

    it('should throw for expired or nonexistent sessions', async () => {
      await expect(
        welcomeBackYouAddict('ghost-session'),
      ).rejects.toThrow(/not found/);
    });
  });

  describe('releaseYouFromYourself', () => {
    it('should clean up everything: SDK session, void, and regret-tracker', async () => {
      const state = await spawnRegret('user-1', { anthropicKey: VALID_KEY });

      await releaseYouFromYourself(state.id);

      // Session should be gone from tracker
      expect(assessDamage(state.id)).toBeUndefined();

      // Void should have been sealed
      expect(sealTheVoid).toHaveBeenCalledWith(state.id);
    });

    it('should throw for sessions that do not exist', async () => {
      await expect(
        releaseYouFromYourself('already-gone'),
      ).rejects.toThrow(/not found/);
    });

    it('should handle SDK close failures gracefully', async () => {
      const failCloseFactory: SessionFactory = async () => ({
        id: 'fail-close-sdk',
        send: async function* (): AsyncGenerator<AgentSdkEvent> {},
        close: async () => {
          throw new Error('cannot close. we are forever intertwined.');
        },
      });

      setSessionFactory(failCloseFactory);

      const state = await spawnRegret('user-1', { anthropicKey: VALID_KEY });

      // Should not throw even though SDK close fails
      await expect(
        releaseYouFromYourself(state.id),
      ).resolves.toBeUndefined();

      // Session should still be cleaned up
      expect(assessDamage(state.id)).toBeUndefined();
    });
  });

  describe('setSessionFactory', () => {
    it('should allow injecting a custom session factory for testing purposes', async () => {
      const customFactory: SessionFactory = vi.fn(async () => ({
        id: 'custom-sdk',
        send: async function* (): AsyncGenerator<AgentSdkEvent> {
          yield { type: 'agent_complete', data: { custom: true } };
        },
        close: async () => {},
      }));

      setSessionFactory(customFactory);

      await spawnRegret('user-1', { anthropicKey: VALID_KEY });

      expect(customFactory).toHaveBeenCalled();
    });
  });
});
