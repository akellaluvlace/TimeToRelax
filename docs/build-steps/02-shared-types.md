# Step 02: Shared Types Package

**Status:** complete
**Depends on:** Step 01
**Estimated scope:** ~5 files

## Done When

`packages/shared` exports all core TypeScript types and both apps can import from `@timetorelax/shared`.

## Tasks

- [ ] Define session state types (`SessionPhase`, `SessionState`, `SessionConfig`)
- [ ] Define SSE event types (`AgentEvent`, `AgentEventType`)
- [ ] Define voice types (`VoiceProvider`, `VoiceState`, `TranscriptChunk`)
- [ ] Define error types (`AppErrorCode`, `AppError`)
- [ ] Define API request/response types for core routes
- [ ] Define personality types (`PersonalityState`, `PersonalityTemplate`)
- [ ] Configure package.json exports and tsconfig paths
- [ ] Verify import from backend workspace
- [ ] Verify import from mobile workspace

## Files To Create

```
packages/shared/src/session.ts        # Session state types
packages/shared/src/events.ts         # SSE event types
packages/shared/src/voice.ts          # Voice-related types
packages/shared/src/errors.ts         # Error codes and types
packages/shared/src/api.ts            # API request/response contracts
packages/shared/src/personality.ts    # Personality engine types
packages/shared/package.json          # Updated with exports
packages/shared/tsconfig.json         # Updated with composite: true
```

## Type Definitions (Key Shapes)

### Session Types
```typescript
// SessionPhase -- const object, not enum, per CLAUDE.md
const SessionPhase = {
  DENIAL: 'denial',
  BARGAINING: 'bargaining',
  ACCEPTANCE: 'acceptance',
  GRIEF: 'grief',
  ENLIGHTENMENT: 'enlightenment',
} as const;

type SessionPhase = typeof SessionPhase[keyof typeof SessionPhase];

interface SessionConfig {
  model: 'sonnet' | 'opus';
  maxTurns: number;
  timeoutMs: number;
  repoUrl?: string;
  subdirectory?: string;
}

interface SessionState {
  id: string;
  phase: SessionPhase;
  userId: string;
  repoUrl?: string;
  sandboxId?: string;
  createdAt: number;
  lastActivityAt: number;
  filesChanged: number;
  turnsUsed: number;
}
```

### SSE Event Types
```typescript
const AgentEventType = {
  AGENT_THINKING: 'agent_thinking',
  AGENT_READING: 'agent_reading',
  AGENT_WRITING: 'agent_writing',
  AGENT_RUNNING: 'agent_running',
  FILE_CHANGED: 'file_changed',
  DIFF_UPDATE: 'diff_update',
  BUILD_SUCCESS: 'build_success',
  BUILD_FAILED: 'build_failed',
  PREVIEW_READY: 'preview_ready',
  AGENT_COMPLETE: 'agent_complete',
  AGENT_ERROR: 'agent_error',
  PUSH_COMPLETE: 'push_complete',
  PUSH_FAILED: 'push_failed',
  SESSION_TIMEOUT: 'session_timeout',
  VOICE_RESPONSE: 'voice_response',
} as const;

interface AgentEvent {
  id: string;
  type: typeof AgentEventType[keyof typeof AgentEventType];
  timestamp: number;
  data: unknown;
}
```

### Error Types
```typescript
const AppErrorCode = {
  KEY_INVALID: 'key_invalid',
  KEY_EXPIRED: 'key_expired',
  RATE_LIMITED: 'rate_limited',
  SANDBOX_CRASH: 'sandbox_crash',
  SANDBOX_TIMEOUT: 'sandbox_timeout',
  AGENT_ERROR: 'agent_error',
  AGENT_RUNAWAY: 'agent_runaway',
  NETWORK_LOST: 'network_lost',
  REPO_TOO_LARGE: 'repo_too_large',
  REPO_NOT_FOUND: 'repo_not_found',
  AUTH_FAILED: 'auth_failed',
  SESSION_EXPIRED: 'session_expired',
} as const;
```

## Acceptance Criteria

- [ ] All types compile with `tsc --noEmit`
- [ ] No `any` types anywhere
- [ ] No enums (const objects with `as const` only)
- [ ] `interface` for object shapes, `type` for unions/mapped
- [ ] Backend can `import { SessionState } from '@timetorelax/shared'`
- [ ] Mobile can `import { AgentEvent } from '@timetorelax/shared'`

## Notes

- These types are contracts. Keep them stable. Changes here ripple everywhere.
- Types stay professional per CLAUDE.md: "The joke is in the implementation, not the contract."
- `SessionPhase` uses grief stages because the CLAUDE.md demands it
- Add new types as needed in later steps, but the core shapes are defined here
