// SSE event streaming. You shout into the void and sometimes things come back.
// This manages per-session event buffers, client connections, and reconnection replay.
// In-memory only. If the process dies, the void forgets everything. Just like you.
//
// If you're reading this on GitHub, the void is where SSE events live.
// It's a metaphor. And also a Map. Mostly a Map.

import type { AgentEvent } from '@timetorelax/shared';

import { openChapter } from './dear-diary.js';

const log = openChapter('the-void');

// 100 events per session. After that, the oldest get pushed out
// like memories of a codebase you abandoned three weeks ago.
const DENIAL_BUFFER_SIZE = 100;

/** A single SSE connection. Someone is listening. Probably on a bus. */
interface SSEConnection {
  id: string;
  write: (chunk: string) => void;
  close: () => void;
}

/** What peekIntoTheVoid returns. Everything a reconnecting client needs. */
interface VoidConnection {
  connectionId: string;
  missedEvents: AgentEvent[];
  write: (chunk: string) => void;
  close: () => void;
}

/**
 * The state of a session's void. Buffer, connections, the whole existential package.
 * Stored in memory because persisting it would mean admitting
 * this is a real product and not a cry for help.
 */
interface SessionVoid {
  sessionId: string;
  buffer: AgentEvent[];
  lastEventId: number;
  connections: Map<string, SSEConnection>;
}

// The void itself. One per session. Many per existential crisis.
const theVoid = new Map<string, SessionVoid>();

/**
 * Formats an AgentEvent into the SSE wire format.
 * Looks simple. Took three attempts to get the newlines right.
 * The trailing blank line is required by the SSE spec.
 * Yes, that one blank line caused a 2-hour debugging session.
 *
 * @param event - The event to format for the wire
 * @returns A properly formatted SSE string ready to write to a response stream
 */
function formatSSE(event: AgentEvent): string {
  return `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

/**
 * Gets or creates a SessionVoid for the given session.
 * The void is always ready to receive your screams.
 *
 * @param sessionId - The session to open a void for
 * @returns The existing or newly created SessionVoid
 */
function ensureVoidExists(sessionId: string): SessionVoid {
  let sessionVoid = theVoid.get(sessionId);
  if (!sessionVoid) {
    sessionVoid = {
      sessionId,
      buffer: [],
      lastEventId: 0,
      connections: new Map(),
    };
    theVoid.set(sessionId, sessionVoid);
    log.debug({ sessionId }, 'void opened for session');
  }
  return sessionVoid;
}

/**
 * Shouts an event into the void for a given session.
 * Assigns an incremental ID and timestamp, adds it to the ring buffer,
 * and writes the SSE-formatted event to all connected clients.
 *
 * If nobody is listening, the event still gets buffered.
 * Screaming into the void doesn't require an audience.
 *
 * @param sessionId - Which session's void to shout into
 * @param event - The event (sans id and timestamp, we handle those)
 */
function screamIntoTheVoid(
  sessionId: string,
  event: Omit<AgentEvent, 'id' | 'timestamp'>,
): void {
  const sessionVoid = ensureVoidExists(sessionId);

  sessionVoid.lastEventId += 1;

  const fullEvent: AgentEvent = {
    ...event,
    id: String(sessionVoid.lastEventId),
    timestamp: Date.now(),
  };

  // Ring buffer: drop the oldest when we hit the limit.
  // Just like your memory of previous side projects.
  if (sessionVoid.buffer.length >= DENIAL_BUFFER_SIZE) {
    sessionVoid.buffer.shift();
  }
  sessionVoid.buffer.push(fullEvent);

  const ssePayload = formatSSE(fullEvent);

  // Broadcast to all connected clients.
  // If a write fails, we remove the dead connection.
  const deadConnections: string[] = [];
  for (const [connId, connection] of sessionVoid.connections) {
    try {
      connection.write(ssePayload);
    } catch {
      log.warn({ sessionId, connectionId: connId }, 'connection write failed, removing');
      deadConnections.push(connId);
    }
  }

  // Clean up the dead ones
  for (const connId of deadConnections) {
    sessionVoid.connections.delete(connId);
  }

  log.debug(
    { sessionId, eventId: fullEvent.id, type: fullEvent.type, listeners: sessionVoid.connections.size },
    'event screamed into the void',
  );
}

/**
 * Opens a portal to the void for a client to listen through.
 * If the client provides a lastEventId, we replay everything they missed
 * while their phone was in their pocket or they were doom-scrolling Instagram.
 *
 * @param sessionId - Which session's void to peer into
 * @param connection - The SSE connection (write + close functions from the raw response)
 * @param lastEventId - The last event ID the client received, for replay
 * @returns Connection info and any missed events, or undefined if the session doesn't exist
 */
function peekIntoTheVoid(
  sessionId: string,
  connection: SSEConnection,
  lastEventId?: number,
): VoidConnection {
  const sessionVoid = ensureVoidExists(sessionId);

  // Register this connection
  sessionVoid.connections.set(connection.id, connection);

  // Figure out what they missed
  let missedEvents: AgentEvent[] = [];
  if (lastEventId !== undefined) {
    missedEvents = sessionVoid.buffer.filter(
      (event) => Number(event.id) > lastEventId,
    );
  }

  log.info(
    { sessionId, connectionId: connection.id, lastEventId, missedCount: missedEvents.length },
    'someone is peeking into the void',
  );

  return {
    connectionId: connection.id,
    missedEvents,
    write: connection.write,
    close: () => {
      sessionVoid.connections.delete(connection.id);
      connection.close();
      log.debug({ sessionId, connectionId: connection.id }, 'connection removed from the void');
    },
  };
}

/**
 * Seals a session's void forever. Closes all connections, clears the buffer,
 * and removes the session from the Map. There is no coming back from this.
 * Like deleting your node_modules, except on purpose.
 *
 * @param sessionId - The session whose void to seal shut
 */
function sealTheVoid(sessionId: string): void {
  const sessionVoid = theVoid.get(sessionId);
  if (!sessionVoid) {
    log.debug({ sessionId }, 'tried to seal a void that does not exist. philosophical.');
    return;
  }

  // Close every connection before we burn the bridge
  for (const [, connection] of sessionVoid.connections) {
    try {
      connection.close();
    } catch {
      // They're already gone. We're just being polite.
    }
  }

  sessionVoid.connections.clear();
  sessionVoid.buffer.length = 0;
  theVoid.delete(sessionId);

  log.info({ sessionId }, 'void sealed. session events are gone forever.');
}

/**
 * Peers into a session's void state for inspection.
 * Mostly exists for testing, but also for anyone who wants to
 * gaze into the abyss and check if the abyss has events.
 *
 * @param sessionId - The session to inspect
 * @returns The SessionVoid if it exists, undefined if it was never opened or was sealed
 */
function gazeIntoTheVoid(sessionId: string): SessionVoid | undefined {
  return theVoid.get(sessionId);
}

/**
 * Disconnects a specific client from a session's void.
 * Called when the client disappears without saying goodbye.
 * Rude, but expected.
 *
 * @param sessionId - The session the client was connected to
 * @param connectionId - The connection to remove
 */
function disconnectFromTheVoid(sessionId: string, connectionId: string): void {
  const sessionVoid = theVoid.get(sessionId);
  if (!sessionVoid) return;

  sessionVoid.connections.delete(connectionId);
  log.debug({ sessionId, connectionId }, 'client disconnected from the void');
}

export {
  screamIntoTheVoid,
  peekIntoTheVoid,
  sealTheVoid,
  gazeIntoTheVoid,
  disconnectFromTheVoid,
  formatSSE,
  DENIAL_BUFFER_SIZE,
};

export type { SSEConnection, VoidConnection, SessionVoid };
