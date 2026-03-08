// The rate limit handler. When the user's API key begs for mercy,
// we don't panic. We pause. We count down. We wait with dignity.
// Or at least with a countdown timer and some judgmental SSE events.
//
// If you're reading this on GitHub: yes, rate limits happen.
// No, throwing a 429 at the user's face is not "handling" it.
// This file exists because we believe in second chances. And timers.

import { AgentEventType } from '@timetorelax/shared';

import { openChapter } from './dear-diary.js';
import { screamIntoTheVoid } from './the-void.js';

const log = openChapter('intervention');

/** The state of a session serving a rate limit sentence. */
interface RateLimitState {
  /** Which session is in timeout. */
  sessionId: string;
  /** How long the sentence was, in ms. */
  retryAfterMs: number;
  /** When the sentence started. */
  startedAt: number;
  /** When freedom returns. */
  resumeAt: number;
}

/** Internal tracking: the state plus the countdown interval handle. */
interface RateLimitEntry {
  state: RateLimitState;
  countdownInterval: ReturnType<typeof setInterval>;
  paroleTimer: ReturnType<typeof setTimeout>;
}

// The holding cell. One entry per rate-limited session.
// If you end up in here often, maybe reconsider your life choices.
const holdingCell = new Map<string, RateLimitEntry>();

/**
 * Handles rate limits with dignity. Or at least a countdown.
 * When the user's API key begs for mercy, we pause the session
 * and wait instead of dying dramatically. Emits SSE countdown
 * events every second so the client knows we haven't abandoned them.
 *
 * @param retryAfterMs - How long the API said to wait, in ms
 * @param sessionId - The session being put on timeout
 */
async function enforceBreak(retryAfterMs: number, sessionId: string): Promise<void> {
  // If already on timeout, extend it. Don't stack interventions.
  const existing = holdingCell.get(sessionId);
  if (existing) {
    clearInterval(existing.countdownInterval);
    clearTimeout(existing.paroleTimer);
    holdingCell.delete(sessionId);
    log.info({ sessionId, retryAfterMs }, 'extending existing rate limit sentence.');
  }

  const now = Date.now();
  const state: RateLimitState = {
    sessionId,
    retryAfterMs,
    startedAt: now,
    resumeAt: now + retryAfterMs,
  };

  log.info(
    { sessionId, retryAfterMs, resumeAt: state.resumeAt },
    'rate limit enforced. session is in timeout.',
  );

  // Emit the initial rate_limited event
  screamIntoTheVoid(sessionId, {
    type: AgentEventType.RATE_LIMITED,
    data: { remainingMs: retryAfterMs, retryAfterMs },
  });

  // Countdown: emit an update every second so the client can show a timer
  const countdownInterval = setInterval(() => {
    const remaining = state.resumeAt - Date.now();
    if (remaining <= 0) {
      // Timer ran out between ticks. paroleTimer handles the actual cleanup.
      return;
    }
    screamIntoTheVoid(sessionId, {
      type: AgentEventType.RATE_LIMITED,
      data: { remainingMs: remaining, retryAfterMs },
    });
  }, 1_000);

  // Auto-parole after the sentence is served
  const paroleTimer = setTimeout(() => {
    parole(sessionId);
  }, retryAfterMs);

  holdingCell.set(sessionId, { state, countdownInterval, paroleTimer });
}

/**
 * Checks if a session is currently serving a rate limit sentence.
 * Returns the state if yes, null if the session is free.
 *
 * @param sessionId - The session to check
 * @returns The rate limit state, or null if the session is not limited
 */
function isOnTimeout(sessionId: string): RateLimitState | null {
  const entry = holdingCell.get(sessionId);
  if (!entry) return null;
  return { ...entry.state };
}

/**
 * Clears a rate limit hold. Called when retry-after expires,
 * or when you feel generous. Emits a recovery event so the
 * client knows the coast is clear.
 *
 * @param sessionId - The session to set free
 */
function parole(sessionId: string): void {
  const entry = holdingCell.get(sessionId);
  if (!entry) {
    log.debug({ sessionId }, 'tried to parole a session that was never detained. freedom was already theirs.');
    return;
  }

  clearInterval(entry.countdownInterval);
  clearTimeout(entry.paroleTimer);

  const durationMs = Date.now() - entry.state.startedAt;

  holdingCell.delete(sessionId);

  // Announce freedom
  screamIntoTheVoid(sessionId, {
    type: AgentEventType.RATE_LIMIT_CLEARED,
    data: { durationMs },
  });

  log.info(
    { sessionId, durationMs },
    'rate limit cleared. session is free. for now.',
  );
}

/**
 * Returns the size of the holding cell. Mostly for testing.
 * If this number is high, someone is having a bad day.
 *
 * @returns The number of sessions currently rate-limited
 */
function headcount(): number {
  return holdingCell.size;
}

export { enforceBreak, isOnTimeout, parole, headcount };
export type { RateLimitState };
