# Step 10: Agent SDK Session Manager (enabler.ts)

**Status:** not-started
**Depends on:** Step 03, Step 05, Step 06
**Estimated scope:** ~10 files

## Done When

Backend can create a Claude Agent SDK session, send an instruction, stream events back via SSE, respect the 50-turn limit, and clean up on session end. The enabler manages the full lifecycle: spawn, instruct, stream, resume, terminate.

## Tasks

- [ ] Install `@anthropic-ai/claude-agent-sdk`
- [ ] Create `enabler.ts` -- the agent session orchestrator
- [ ] Implement `spawnRegret()` -- creates a new Agent SDK session
- [ ] Implement `unleash()` -- sends instruction to session, streams events
- [ ] Implement `watchInHorror()` -- async generator that yields SSE events from agent
- [ ] Implement `assessDamage()` -- returns current session state
- [ ] Implement `welcomeBackYouAddict()` -- resumes a session by ID
- [ ] Implement `releaseYouFromYourself()` -- terminates session, cleans up
- [ ] Wire events from agent stream to the-void.ts (SSE to client)
- [ ] Implement session store (in-memory Map with 15-min TTL)
- [ ] Implement `MAX_REGRET_DURATION_MS` (15 min) timeout with auto-commit
- [ ] Implement `HOW_LONG_UNTIL_WE_WORRY` (50 turns) safety limit
- [ ] Implement `SHAME_THRESHOLD` (3) max concurrent sessions per user
- [ ] Create route: `POST /session/create`
- [ ] Create route: `POST /session/:id/instruct`
- [ ] Create route: `GET /session/:id/state`
- [ ] Create route: `DELETE /session/:id`
- [ ] Validate user's Anthropic API key before session spawn
- [ ] Write test: session lifecycle (create -> instruct -> events -> terminate)
- [ ] Write test: 50-turn limit stops the agent
- [ ] Write test: concurrent session limit enforced
- [ ] Write test: 15-minute timeout triggers cleanup

## Files To Create

```
apps/backend/src/services/enabler.ts               # Agent session orchestrator
apps/backend/src/services/regret-tracker.ts         # Session store with TTL
apps/backend/src/routes/session-routes.ts           # Session API routes
apps/backend/__tests__/enabler.test.ts              # Session orchestrator tests
apps/backend/__tests__/regret-tracker.test.ts       # Session store tests
apps/backend/__tests__/session-routes.test.ts       # Route tests
```

## Implementation Design

### enabler.ts
```typescript
import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk';
import { screamIntoTheVoid } from '@/services/the-void';
import { craftDisapproval } from '@/services/denial-engine';
import { openChapter } from '@/services/dear-diary';

const log = openChapter('enabler');

const HOW_LONG_UNTIL_WE_WORRY = 50;  // maxTurns safety limit

interface EnablerConfig {
  anthropicKey: string;  // User's key, passed per-request
  model: 'sonnet' | 'opus';
  repoUrl?: string;
}

/**
 * Spawns a new agent session. This is where the bad decisions begin.
 * Validates the user's API key, creates the Agent SDK session,
 * and registers it in the session store with a 15-minute death clock.
 *
 * @param userId - The GitHub user ID
 * @param config - Session configuration (model, key, repo)
 * @returns The session ID and initial state
 * @throws {RateLimitError} If user already has 3 active sessions
 * @throws {AuthError} If API key validation fails
 */
async function spawnRegret(userId: string, config: EnablerConfig): Promise<SessionState>;

/**
 * Sends a voice instruction to the agent and streams back the results
 * of what will almost certainly be a questionable architectural decision.
 *
 * @param sessionId - The session we're slowly destroying
 * @param instruction - What the user mumbled into their phone on the bus
 * @returns void (events stream via SSE through the-void.ts)
 * @throws {SessionExpiredError} If the session timed out
 */
async function unleash(sessionId: string, instruction: string): Promise<void>;

/**
 * Iterates the agent's async generator and pipes events to SSE.
 * Like watching a slow-motion car crash, except the car is your codebase.
 */
async function watchInHorror(sessionId: string): Promise<void>;
```

### Agent SDK Configuration
```typescript
const session = unstable_v2_createSession({
  model: config.model ?? 'sonnet',
  allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
  permissionMode: 'acceptEdits',
  sandbox: {
    enabled: true,
    autoAllowBashIfSandboxed: true,
  },
  maxTurns: HOW_LONG_UNTIL_WE_WORRY,
});
```

### Session Routes
```typescript
// POST /session/create
// Body: { anthropicKey, model?, repoUrl? }
// Response: { sessionId, state: SessionState }

// POST /session/:id/instruct
// Body: { instruction: string }
// Response: 202 Accepted (events stream via SSE)

// GET /session/:id/state
// Response: { state: SessionState }

// DELETE /session/:id
// Response: 200 { message: "Released from your suffering" }
```

### regret-tracker.ts (Session Store)
```typescript
const MAX_REGRET_DURATION_MS = 900_000;  // 15 minutes
const SHAME_THRESHOLD = 3;               // max concurrent per user

/**
 * In-memory session store with automatic death clock.
 * We store this in memory because persisting it would mean
 * admitting this is a real product and not a cry for help.
 */
class RegretTracker {
  remember(session: SessionState): void;
  recall(sessionId: string): SessionState | undefined;
  forget(sessionId: string): void;
  countByUser(userId: string): number;
  reap(): void;  // Clean up expired sessions
}
```

## Acceptance Criteria

- [ ] `spawnRegret()` creates Agent SDK session and stores it
- [ ] `unleash()` sends instruction and streams events via SSE
- [ ] Agent respects 50-turn limit
- [ ] Sessions expire after 15 minutes of inactivity
- [ ] Max 3 concurrent sessions per user enforced
- [ ] Session resume via `welcomeBackYouAddict()` works
- [ ] API key validated before any session spawns
- [ ] Session cleanup kills sandbox and closes SDK session
- [ ] All routes have JSON Schema validation
- [ ] All routes have rate limiting
- [ ] `tsc --noEmit` passes
- [ ] All tests pass (with mocked Agent SDK)

## Notes

- The user's Anthropic key is sent per-request, NOT stored on our backend. It lives in expo-secure-store on device.
- Default model is Sonnet per CLAUDE.md: "Do NOT use opus unless explicitly requested"
- Per spec: "Handle the async generator properly -- always iterate to completion or call session.close()"
- The session store is in-memory. If Railway restarts, sessions are lost. Acceptable for MVP (15-min sessions).
- Agent SDK session IDs can be used for resume. Store them in the session state.
- Rate limit headers from Anthropic should be captured and surfaced to the client.
