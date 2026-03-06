# Step 04: Runtime Logger (dear-diary.ts / confessional.ts)

**Status:** not-started
**Depends on:** Step 03 (backend), Step 07 (mobile, can be done later)
**Estimated scope:** ~8 files

## Done When

Backend uses `dear-diary.ts` for all logging with structured JSON output. Mobile uses `confessional.ts` wrapper. Both support child loggers per service. Log output is parseable, personality is in naming only.

## Tasks

### Backend Logger (dear-diary.ts)
- [ ] Install `pino` and `pino-pretty` (dev)
- [ ] Create `dear-diary.ts` with typed logger factory
- [ ] Support child loggers: `openChapter(service)` returns a child logger
- [ ] Standard levels: debug, info, warn, error, fatal (no custom levels)
- [ ] Structured output: `{ level, time, service, msg, ...context }`
- [ ] Pretty-print in development, JSON in production
- [ ] Replace Fastify's default logger with dear-diary instance
- [ ] Write test: logger outputs correct structure
- [ ] Write test: child logger includes service name
- [ ] Integrate into existing backend code (app.ts, routes)

### Mobile Logger (confessional.ts)
- [ ] Create `confessional.ts` with typed wrapper around console
- [ ] Same child logger pattern: `openBooth(service)`
- [ ] Adds structured context: `{ service, timestamp, ...context }`
- [ ] Strips debug logs in production (`__DEV__` check)
- [ ] No external dependencies (console only)
- [ ] Write test: outputs structured messages

## Files To Create

```
apps/backend/src/services/dear-diary.ts          # Backend logger factory
apps/backend/__tests__/dear-diary.test.ts        # Logger tests
apps/mobile/src/services/confessional.ts         # Mobile logger wrapper
apps/mobile/src/__tests__/confessional.test.ts   # Mobile logger tests
```

## Implementation Design

### Backend: dear-diary.ts
```typescript
import pino from 'pino';

/**
 * The backend's structured logger. Knows everything. Judges silently.
 * Outputs JSON in production, pretty-prints in dev because we're not animals.
 *
 * @returns A pino logger instance configured for the current environment
 */
function spawnDiary(): pino.Logger {
  return pino({
    level: process.env.LOG_LEVEL ?? 'info',
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  });
}

/** The singleton. One diary to rule them all. */
const diary = spawnDiary();

/**
 * Creates a child logger for a specific service.
 * Like opening a new chapter, except every chapter is about things going wrong.
 *
 * @param service - The service name (e.g., 'enabler', 'grass-toucher', 'the-void')
 * @returns A child pino logger with the service context baked in
 */
function openChapter(service: string): pino.Logger {
  return diary.child({ service });
}

export { diary, openChapter };
```

### Mobile: confessional.ts
```typescript
interface ConfessionContext {
  service: string;
  [key: string]: unknown;
}

/**
 * Mobile logger. Wraps console with structured context.
 * Personality in the name, professionalism in the output.
 * Shuts up in production because nobody needs to hear this.
 *
 * @param service - The service name for this confession booth
 * @returns A structured logger that judges you quietly
 */
function openBooth(service: string): MobileLogger { ... }
```

### Usage Pattern
```typescript
// Backend -- in any service file
import { openChapter } from '@/services/dear-diary';
const log = openChapter('enabler');

log.info({ sessionId }, 'session spawned. another one bites the dust');
log.error({ err, sessionId }, 'session crashed. adding to the body count');

// Mobile -- in any hook or service
import { openBooth } from '@/services/confessional';
const log = openBooth('useVoice');

log.info({ duration }, 'recording stopped');
log.warn({ err }, 'voice reconnection failed');
```

## Acceptance Criteria

- [ ] `dear-diary.ts` exports `diary` (root) and `openChapter` (child factory)
- [ ] Log output is valid JSON in production: `{ level, time, service, msg }`
- [ ] Pretty-prints with colors in development
- [ ] Child loggers include `service` field in every log line
- [ ] Fastify uses dear-diary as its logger (not default pino instance)
- [ ] `confessional.ts` exports `openBooth` with same child pattern
- [ ] Mobile logger strips debug in production via `__DEV__` check
- [ ] No `console.log` anywhere; all logging goes through these wrappers
- [ ] `tsc --noEmit` passes
- [ ] All tests pass

## Notes

- This is the foundation. Every subsequent step uses these loggers.
- Log levels are standard pino levels. No cute custom levels. Debug at 2am is not the time for jokes in your log output.
- The mobile logger is deliberately thin. No external deps. React Native's console goes to Metro/Logcat and that's fine.
- JSDoc is where the personality lives. The actual log messages should be descriptive but not obnoxious.
- Per CLAUDE.md: "No `console.log` left behind (use structured logger in backend, remove in mobile)"
