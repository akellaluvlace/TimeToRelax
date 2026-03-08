import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  screamIntoTheVoid,
  peekIntoTheVoid,
  sealTheVoid,
  gazeIntoTheVoid,
  disconnectFromTheVoid,
  formatSSE,
  DENIAL_BUFFER_SIZE,
} from '../src/services/the-void.js';
import type { SSEConnection } from '../src/services/the-void.js';
import type { AgentEvent } from '@timetorelax/shared';
import { AgentEventType } from '@timetorelax/shared';

/** Creates a mock SSE connection so we can capture what gets written. */
function createMockConnection(id?: string): SSEConnection & { chunks: string[]; closed: boolean } {
  const chunks: string[] = [];
  return {
    id: id ?? `conn-${Math.random().toString(36).slice(2)}`,
    chunks,
    closed: false,
    write: vi.fn((chunk: string) => {
      chunks.push(chunk);
    }),
    close: vi.fn(function (this: { closed: boolean }) {
      this.closed = true;
    }),
  };
}

describe('the-void', () => {
  // Start each test with a clean void. The universe deserves a fresh start.
  beforeEach(() => {
    // Seal any leftover voids from previous tests
    // We can't know all session IDs, so we scream into known ones and seal them
    sealTheVoid('test-session');
    sealTheVoid('session-a');
    sealTheVoid('session-b');
    sealTheVoid('overflow-session');
    sealTheVoid('disconnect-session');
    sealTheVoid('ghost-session');
    sealTheVoid('seal-session');
    sealTheVoid('multi-conn-session');
    sealTheVoid('replay-session');
    sealTheVoid('format-session');
  });

  describe('screamIntoTheVoid', () => {
    it('should create a void if one does not exist, because the void is always ready', () => {
      expect(gazeIntoTheVoid('test-session')).toBeUndefined();

      screamIntoTheVoid('test-session', {
        type: AgentEventType.AGENT_THINKING,
        data: {},
      });

      const sessionVoid = gazeIntoTheVoid('test-session');
      expect(sessionVoid).toBeDefined();
      expect(sessionVoid!.buffer.length).toBe(1);
    });

    it('should assign incremental IDs per session, unlike your commit history', () => {
      screamIntoTheVoid('test-session', {
        type: AgentEventType.AGENT_THINKING,
        data: {},
      });
      screamIntoTheVoid('test-session', {
        type: AgentEventType.AGENT_WRITING,
        data: {},
      });
      screamIntoTheVoid('test-session', {
        type: AgentEventType.BUILD_SUCCESS,
        data: { command: 'npm test', exitCode: 0, output: 'pass' },
      });

      const sessionVoid = gazeIntoTheVoid('test-session')!;
      expect(sessionVoid.buffer[0]!.id).toBe('1');
      expect(sessionVoid.buffer[1]!.id).toBe('2');
      expect(sessionVoid.buffer[2]!.id).toBe('3');
    });

    it('should assign timestamps that are not from the future, hopefully', () => {
      const before = Date.now();
      screamIntoTheVoid('test-session', {
        type: AgentEventType.AGENT_THINKING,
        data: {},
      });
      const after = Date.now();

      const event = gazeIntoTheVoid('test-session')!.buffer[0]!;
      expect(event.timestamp).toBeGreaterThanOrEqual(before);
      expect(event.timestamp).toBeLessThanOrEqual(after);
    });

    it('should broadcast events to all connected listeners, even if nobody asked', () => {
      const conn1 = createMockConnection('conn-1');
      const conn2 = createMockConnection('conn-2');

      peekIntoTheVoid('multi-conn-session', conn1);
      peekIntoTheVoid('multi-conn-session', conn2);

      screamIntoTheVoid('multi-conn-session', {
        type: AgentEventType.AGENT_WRITING,
        data: {},
      });

      expect(conn1.write).toHaveBeenCalledTimes(1);
      expect(conn2.write).toHaveBeenCalledTimes(1);

      // Both should receive the same SSE payload
      expect(conn1.chunks[0]).toContain('event: agent_writing');
      expect(conn2.chunks[0]).toContain('event: agent_writing');
    });

    it('should buffer events even when nobody is listening, because the void does not care', () => {
      screamIntoTheVoid('test-session', {
        type: AgentEventType.AGENT_THINKING,
        data: {},
      });
      screamIntoTheVoid('test-session', {
        type: AgentEventType.AGENT_READING,
        data: {},
      });

      const sessionVoid = gazeIntoTheVoid('test-session')!;
      expect(sessionVoid.buffer.length).toBe(2);
      expect(sessionVoid.connections.size).toBe(0);
    });

    it('should drop the oldest events when the buffer overflows, like your browser tabs', () => {
      // Fill the buffer to capacity + 10
      for (let i = 0; i < DENIAL_BUFFER_SIZE + 10; i++) {
        screamIntoTheVoid('overflow-session', {
          type: AgentEventType.AGENT_THINKING,
          data: {},
        });
      }

      const sessionVoid = gazeIntoTheVoid('overflow-session')!;
      expect(sessionVoid.buffer.length).toBe(DENIAL_BUFFER_SIZE);

      // The oldest event should be #11 (first 10 were pushed out)
      expect(sessionVoid.buffer[0]!.id).toBe('11');
      // The newest should be #110
      expect(sessionVoid.buffer[DENIAL_BUFFER_SIZE - 1]!.id).toBe('110');
      // Last event ID counter should still be accurate
      expect(sessionVoid.lastEventId).toBe(110);
    });

    it('should remove dead connections that fail to write, because we clean up our messes', () => {
      const goodConn = createMockConnection('good');
      const deadConn: SSEConnection = {
        id: 'dead',
        write: () => { throw new Error('connection is dead'); },
        close: vi.fn(),
      };

      peekIntoTheVoid('test-session', goodConn);
      peekIntoTheVoid('test-session', deadConn);

      screamIntoTheVoid('test-session', {
        type: AgentEventType.AGENT_THINKING,
        data: {},
      });

      const sessionVoid = gazeIntoTheVoid('test-session')!;
      expect(sessionVoid.connections.size).toBe(1);
      expect(sessionVoid.connections.has('good')).toBe(true);
      expect(sessionVoid.connections.has('dead')).toBe(false);
    });
  });

  describe('peekIntoTheVoid', () => {
    it('should register a connection and return it with empty missed events', () => {
      const conn = createMockConnection('peek-conn');
      const result = peekIntoTheVoid('test-session', conn);

      expect(result.connectionId).toBe('peek-conn');
      expect(result.missedEvents).toEqual([]);
      expect(gazeIntoTheVoid('test-session')!.connections.size).toBe(1);
    });

    it('should replay missed events when lastEventId is provided, because second chances exist', () => {
      // Emit 5 events
      for (let i = 0; i < 5; i++) {
        screamIntoTheVoid('replay-session', {
          type: AgentEventType.AGENT_THINKING,
          data: { step: i },
        });
      }

      // Client reconnects having seen event 2
      const conn = createMockConnection('replay-conn');
      const result = peekIntoTheVoid('replay-session', conn, 2);

      // Should get events 3, 4, 5
      expect(result.missedEvents.length).toBe(3);
      expect(result.missedEvents[0]!.id).toBe('3');
      expect(result.missedEvents[1]!.id).toBe('4');
      expect(result.missedEvents[2]!.id).toBe('5');
    });

    it('should return all events when lastEventId is 0, for the truly lost', () => {
      screamIntoTheVoid('replay-session', {
        type: AgentEventType.AGENT_THINKING,
        data: {},
      });
      screamIntoTheVoid('replay-session', {
        type: AgentEventType.AGENT_WRITING,
        data: {},
      });

      const conn = createMockConnection('lost-conn');
      const result = peekIntoTheVoid('replay-session', conn, 0);

      expect(result.missedEvents.length).toBe(2);
    });

    it('should return no missed events when lastEventId matches the latest, you are caught up congratulations', () => {
      screamIntoTheVoid('replay-session', {
        type: AgentEventType.AGENT_THINKING,
        data: {},
      });
      screamIntoTheVoid('replay-session', {
        type: AgentEventType.AGENT_WRITING,
        data: {},
      });

      const conn = createMockConnection('caught-up-conn');
      const result = peekIntoTheVoid('replay-session', conn, 2);

      expect(result.missedEvents.length).toBe(0);
    });

    it('should close properly via the returned close function', () => {
      const conn = createMockConnection('close-test');
      const result = peekIntoTheVoid('test-session', conn);

      expect(gazeIntoTheVoid('test-session')!.connections.size).toBe(1);

      result.close();

      expect(gazeIntoTheVoid('test-session')!.connections.size).toBe(0);
    });
  });

  describe('sealTheVoid', () => {
    it('should close all connections and wipe the session clean, like ctrl+z for the soul', () => {
      const conn1 = createMockConnection('seal-1');
      const conn2 = createMockConnection('seal-2');

      screamIntoTheVoid('seal-session', {
        type: AgentEventType.AGENT_THINKING,
        data: {},
      });

      peekIntoTheVoid('seal-session', conn1);
      peekIntoTheVoid('seal-session', conn2);

      sealTheVoid('seal-session');

      expect(gazeIntoTheVoid('seal-session')).toBeUndefined();
      expect(conn1.close).toHaveBeenCalled();
      expect(conn2.close).toHaveBeenCalled();
    });

    it('should handle sealing a void that does not exist, philosophically', () => {
      // Should not throw
      expect(() => sealTheVoid('imaginary-session')).not.toThrow();
    });
  });

  describe('gazeIntoTheVoid', () => {
    it('should return undefined for sessions that were never opened', () => {
      expect(gazeIntoTheVoid('nope')).toBeUndefined();
    });

    it('should return the session state for active sessions', () => {
      screamIntoTheVoid('test-session', {
        type: AgentEventType.AGENT_THINKING,
        data: {},
      });

      const state = gazeIntoTheVoid('test-session');
      expect(state).toBeDefined();
      expect(state!.sessionId).toBe('test-session');
      expect(state!.buffer.length).toBe(1);
      expect(state!.lastEventId).toBe(1);
    });
  });

  describe('disconnectFromTheVoid', () => {
    it('should remove a specific connection without affecting others', () => {
      const conn1 = createMockConnection('stay');
      const conn2 = createMockConnection('leave');

      peekIntoTheVoid('disconnect-session', conn1);
      peekIntoTheVoid('disconnect-session', conn2);

      disconnectFromTheVoid('disconnect-session', 'leave');

      const state = gazeIntoTheVoid('disconnect-session')!;
      expect(state.connections.size).toBe(1);
      expect(state.connections.has('stay')).toBe(true);
      expect(state.connections.has('leave')).toBe(false);
    });

    it('should handle disconnecting from a void that does not exist, gracefully', () => {
      expect(() => disconnectFromTheVoid('ghost', 'nobody')).not.toThrow();
    });
  });

  describe('multiple sessions are independent', () => {
    it('should keep events separate per session, like your work and personal GitHub accounts', () => {
      screamIntoTheVoid('session-a', {
        type: AgentEventType.AGENT_THINKING,
        data: { source: 'a' },
      });
      screamIntoTheVoid('session-b', {
        type: AgentEventType.AGENT_WRITING,
        data: { source: 'b' },
      });
      screamIntoTheVoid('session-b', {
        type: AgentEventType.BUILD_SUCCESS,
        data: { command: 'test', exitCode: 0, output: 'ok' },
      });

      const stateA = gazeIntoTheVoid('session-a')!;
      const stateB = gazeIntoTheVoid('session-b')!;

      expect(stateA.buffer.length).toBe(1);
      expect(stateB.buffer.length).toBe(2);

      // IDs are per-session, not global
      expect(stateA.lastEventId).toBe(1);
      expect(stateB.lastEventId).toBe(2);
    });

    it('should not leak connections between sessions, because boundaries matter', () => {
      const connA = createMockConnection('conn-a');
      const connB = createMockConnection('conn-b');

      peekIntoTheVoid('session-a', connA);
      peekIntoTheVoid('session-b', connB);

      screamIntoTheVoid('session-a', {
        type: AgentEventType.AGENT_THINKING,
        data: {},
      });

      // Only connA should have received the event
      expect(connA.write).toHaveBeenCalledTimes(1);
      expect(connB.write).not.toHaveBeenCalled();
    });
  });

  describe('formatSSE', () => {
    it('should produce valid SSE wire format with id, event, and data fields', () => {
      const event: AgentEvent = {
        id: '42',
        type: AgentEventType.AGENT_THINKING,
        timestamp: 1234567890,
        data: {},
      };

      const formatted = formatSSE(event);

      expect(formatted).toBe(
        'id: 42\n' +
        'event: agent_thinking\n' +
        `data: ${JSON.stringify(event)}\n` +
        '\n',
      );
    });

    it('should include the full event object in the data field, warts and all', () => {
      const event: AgentEvent = {
        id: '7',
        type: AgentEventType.FILE_CHANGED,
        timestamp: 9999999,
        data: { filePath: 'src/app.ts', action: 'modified' as const },
      };

      const formatted = formatSSE(event);
      const dataLine = formatted.split('\n').find((line) => line.startsWith('data: '));
      expect(dataLine).toBeDefined();

      const parsed: unknown = JSON.parse(dataLine!.replace('data: ', ''));
      expect(parsed).toEqual(event);
    });
  });
});
