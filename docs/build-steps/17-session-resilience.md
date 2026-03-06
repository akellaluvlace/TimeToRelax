# Step 17: Session Resilience & Reconnection

**Status:** not-started
**Depends on:** Step 05, Step 09, Step 10
**Estimated scope:** ~10 files

## Done When

SSE reconnects with event replay, voice WebSocket auto-reconnects with backoff, sessions timeout gracefully with auto-commit, Agent SDK sessions can resume, and rate limit 429s pause with countdown instead of killing the session.

## Tasks

### SSE Resilience
- [ ] Implement `Last-Event-ID` reconnection on mobile
- [ ] Implement missed event replay from server buffer
- [ ] Create `GET /session/:id/state` full state sync (when buffer overflows)
- [ ] Mobile: auto-reconnect SSE with exponential backoff
- [ ] Write test: reconnection replays missed events correctly

### Voice WebSocket Resilience
- [ ] Implement auto-reconnect with exponential backoff (1s, 2s, 4s, max 10s)
- [ ] Show "Reconnecting voice..." indicator in UI
- [ ] Voice drop doesn't affect agent session (decoupled)
- [ ] Write test: reconnection backoff timing
- [ ] Write test: agent continues during voice drop

### Session Timeout
- [ ] Implement 15-minute inactivity timeout
- [ ] Auto-commit to `ttr/session-{uuid}` branch before session dies
- [ ] Show "Session expired. Your changes were saved to branch..." message
- [ ] Personality response on timeout
- [ ] Write test: timeout triggers auto-commit
- [ ] Write test: expiry message includes branch name

### Agent SDK Resume
- [ ] Implement `welcomeBackYouAddict()` using `resumeSession(sessionId)`
- [ ] Store session IDs for resume capability
- [ ] Mobile: detect backgrounded session and attempt resume on foreground
- [ ] Write test: resume restores session state

### Rate Limit Handling
- [ ] Detect 429 from Anthropic API in agent stream
- [ ] Create `intervention.ts` -- rate limit handler
- [ ] Pause session with countdown timer (don't kill)
- [ ] Display remaining capacity on session start via rate limit headers
- [ ] Auto-resume when rate limit lifts
- [ ] Write test: 429 triggers pause, not termination
- [ ] Write test: countdown displays correctly

## Files To Create

```
apps/backend/src/services/intervention.ts             # Rate limit handler
apps/backend/src/services/sleep-is-optional.ts        # Session persistence/resume
apps/backend/src/routes/session-state-route.ts        # GET /session/:id/state
apps/backend/__tests__/intervention.test.ts           # Rate limit tests
apps/backend/__tests__/sleep-is-optional.test.ts      # Resume tests
apps/mobile/src/hooks/useSSEReconnect.ts             # SSE auto-reconnect hook
apps/mobile/src/hooks/useVoiceReconnect.ts           # Voice WebSocket reconnect hook
apps/mobile/src/components/ConnectionStatus.tsx       # "Reconnecting..." indicator
apps/mobile/src/__tests__/useSSEReconnect.test.ts    # SSE reconnect tests
```

## Implementation Design

### intervention.ts
```typescript
/**
 * Handles rate limits with dignity. Or at least a countdown.
 * When the user's API key begs for mercy, we pause the session
 * and wait instead of dying dramatically.
 *
 * @param retryAfterMs - How long to wait (from 429 headers)
 * @param sessionId - The session to pause
 * @returns Promise that resolves when the rate limit lifts
 */
async function enforceBreak(retryAfterMs: number, sessionId: string): Promise<void>;
```

### sleep-is-optional.ts
```typescript
/**
 * Session persistence and resume. Because closing the app
 * doesn't mean you're done. You're never done.
 *
 * @param sessionId - The session to resume
 * @returns Restored session state or null if expired
 */
async function welcomeBackYouAddict(sessionId: string): Promise<SessionState | null>;
```

### Reconnection Flow (Mobile)
```
1. SSE/WebSocket drops
2. Start backoff: 1s, 2s, 4s, 8s, max 10s
3. Show ConnectionStatus indicator
4. On reconnect: SSE replays from Last-Event-ID
5. If buffer overflow: GET /session/:id/state for full sync
6. Hide indicator, resume normal UI
```

## Acceptance Criteria

- [ ] SSE reconnects automatically and replays missed events
- [ ] Voice WebSocket reconnects with exponential backoff
- [ ] "Reconnecting voice..." shows during voice reconnection
- [ ] Agent session continues during voice drop (decoupled)
- [ ] 15-minute timeout auto-commits and shows branch name
- [ ] Session resume works via Agent SDK `resumeSession()`
- [ ] Rate limit 429 pauses with countdown, auto-resumes
- [ ] Remaining capacity displayed on session start
- [ ] Full state sync available when buffer overflows
- [ ] `tsc --noEmit` passes
- [ ] All tests pass

## Notes

- This is the Week 3 reliability work. Everything before this is "happy path."
- Per spec: "SSE connection maintains a message buffer (last 100 events)"
- Per spec: "Voice WebSocket drops (common on mobile network switches)"
- Session resume depends on Railway process staying alive. If Railway restarts, sessions are gone.
- The ConnectionStatus component should be subtle (small bar, not modal). Don't block the UI.
