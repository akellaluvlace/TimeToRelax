# Step 05: SSE Streaming (the-void.ts)

**Status:** complete
**Depends on:** Step 03, Step 04
**Estimated scope:** ~6 files

## Done When

Backend can open an SSE connection per session, emit typed events, buffer the last 100 events, and replay missed events on reconnection via `Last-Event-ID`.

## Tasks

- [ ] Create `the-void.ts` SSE service with event emitter pattern
- [ ] Implement per-session event buffers (ring buffer, 100 events max)
- [ ] Implement `Last-Event-ID` reconnection with replay
- [ ] Create SSE route: `GET /session/:id/stream`
- [ ] Assign incremental event IDs per session
- [ ] Create typed event emitter using `AgentEvent` from shared types
- [ ] Handle client disconnect cleanup
- [ ] Write test: events stream to connected client
- [ ] Write test: reconnection replays missed events
- [ ] Write test: buffer overflow drops oldest events
- [ ] Write test: disconnect cleans up resources

## Files To Create

```
apps/backend/src/services/the-void.ts            # SSE event manager
apps/backend/src/routes/the-void-route.ts        # GET /session/:id/stream
apps/backend/__tests__/the-void.test.ts          # SSE service tests
apps/backend/__tests__/the-void-route.test.ts    # SSE route tests
```

## Implementation Design

### the-void.ts
```typescript
import { AgentEvent, AgentEventType } from '@timetorelax/shared';
import { openChapter } from '@/services/dear-diary';

const log = openChapter('the-void');

// Per CLAUDE.md: DENIAL_BUFFER_SIZE = 100
const DENIAL_BUFFER_SIZE = 100;

interface SessionVoid {
  sessionId: string;
  buffer: AgentEvent[];
  lastEventId: number;
  connections: Set<SSEConnection>;
}

/**
 * Shouts an event into the void. Sometimes things come back.
 * The void maintains a ring buffer so reconnecting clients can catch up
 * on whatever they missed while their phone was in their pocket.
 *
 * @param sessionId - Which session's void to shout into
 * @param event - The event that probably contains bad news
 */
function screamIntoTheVoid(sessionId: string, event: Omit<AgentEvent, 'id' | 'timestamp'>): void;

/**
 * Opens a portal to the void for a client to listen.
 * Returns missed events if the client provides a Last-Event-ID.
 *
 * @param sessionId - Which session's void to listen to
 * @param lastEventId - The last event the client received (for replay)
 * @returns An SSE stream and any missed events
 */
function peekIntoTheVoid(sessionId: string, lastEventId?: number): VoidConnection;

/**
 * Closes a session's void. No more events. Go home.
 *
 * @param sessionId - The session whose void to seal
 */
function sealTheVoid(sessionId: string): void;
```

### SSE Route
```typescript
// GET /session/:id/stream
// Headers: Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive
// Query: ?lastEventId=N for reconnection
// Response: SSE stream of AgentEvent
```

### Event Format (on the wire)
```
id: 42
event: file_changed
data: {"type":"file_changed","data":{"path":"src/app.ts","action":"modified"}}

id: 43
event: build_success
data: {"type":"build_success","data":{"duration":3200}}
```

## Acceptance Criteria

- [ ] SSE endpoint returns `Content-Type: text/event-stream`
- [ ] Events have incremental `id` fields per session
- [ ] Events use `event:` field matching `AgentEventType` values
- [ ] Buffer holds last 100 events per session
- [ ] Reconnection with `Last-Event-ID` replays missed events
- [ ] Buffer overflow drops oldest (ring buffer behavior)
- [ ] Client disconnect removes connection from session
- [ ] Session cleanup (`sealTheVoid`) clears buffer and connections
- [ ] `tsc --noEmit` passes
- [ ] All tests pass

## Notes

- No external SSE library. Raw Fastify response streaming is sufficient and keeps deps minimal.
- The buffer is in-memory. If the backend process restarts, buffers are lost. This is acceptable for MVP; spec says sessions are 15 minutes max.
- Multiple clients can connect to the same session (e.g., reconnection overlap). `connections` is a Set.
- Per spec: "If buffer overflow (>100 events missed): full state sync via GET /session/{id}/state" -- that's a separate route, added in step 17 (resilience).
