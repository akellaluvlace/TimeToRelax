// Session store with TTL. Every session gets tracked, timed, and eventually
// forgotten. Like your side projects, but with actual deadlines.
//
// In-memory only. If the server restarts, all sessions vanish.
// We store this in memory because persisting it would mean
// admitting this is a real product and not a cry for help.
//
// If you're reading this on GitHub: yes, we named the session store
// "regret tracker." No, the irony is not lost on us.

import type { SessionState } from '@timetorelax/shared';

import { openChapter } from './dear-diary.js';

const log = openChapter('regret-tracker');

// 15 minutes. Then we cut you off. Like a responsible bartender.
const MAX_REGRET_DURATION_MS = 900_000;

// Max concurrent sessions per user. Because some people
// can't stop themselves, so we do it for them.
const SHAME_THRESHOLD = 3;

/** A session being tracked for timeout, like a child at a playground. */
interface TrackedSession {
  session: SessionState;
  userId: string;
  createdAt: number;
  lastActivityAt: number;
  timeoutId: ReturnType<typeof setTimeout>;
}

// The actual store. One Map to hold all the regret.
const theGrudgeBook = new Map<string, TrackedSession>();

/**
 * Called when a session expires. Set this to handle cleanup
 * (closing SDK sessions, destroying sandboxes, sealing voids, etc.)
 * before we forget() it. Null by default because not everyone wants closure.
 * The second argument provides the session state so callers can clean up
 * associated resources (like sandboxes) without a separate lookup.
 */
let onExpired: ((sessionId: string, session?: SessionState) => void) | null = null;

/**
 * Starts the countdown to oblivion for a session.
 * When the timer fires, we call onExpired (if set), then forget.
 *
 * @param sessionId - The session living on borrowed time
 * @returns The timeout handle, for resetting later
 */
function startDoomClock(sessionId: string): ReturnType<typeof setTimeout> {
  return setTimeout(() => {
    log.info({ sessionId }, 'session expired. time waits for no developer.');
    const tracked = theGrudgeBook.get(sessionId);
    if (onExpired) {
      try {
        onExpired(sessionId, tracked?.session);
      } catch (err: unknown) {
        log.error({ sessionId, err }, 'onExpired callback threw. adding to the list of regrets.');
      }
    }
    forget(sessionId);
  }, MAX_REGRET_DURATION_MS);
}

/**
 * Stores a session and starts its TTL timer. Like starting a relationship,
 * except this one has a guaranteed expiration date.
 *
 * @param userId - The user responsible for this session
 * @param session - The session state to track
 * @throws If the user has reached SHAME_THRESHOLD concurrent sessions
 */
function remember(userId: string, session: SessionState): void {
  const activeCount = countByUser(userId);
  if (activeCount >= SHAME_THRESHOLD) {
    log.warn(
      { userId, activeCount, limit: SHAME_THRESHOLD },
      'user hit the shame threshold. enough is enough.',
    );
    throw new Error(
      `You already have ${activeCount} active sessions. Even we have limits.`,
    );
  }

  const now = Date.now();
  const tracked: TrackedSession = {
    session,
    userId,
    createdAt: now,
    lastActivityAt: now,
    timeoutId: startDoomClock(session.id),
  };

  theGrudgeBook.set(session.id, tracked);

  log.info(
    { sessionId: session.id, userId, totalSessions: theGrudgeBook.size },
    'session remembered. the clock is ticking.',
  );
}

/**
 * Retrieves a tracked session by ID. Like looking up an ex's profile,
 * but for code sessions.
 *
 * @param sessionId - The session to recall
 * @returns The tracked session if found, undefined if forgotten or never existed
 */
function recall(sessionId: string): TrackedSession | undefined {
  return theGrudgeBook.get(sessionId);
}

/**
 * Removes a session from tracking and clears its timeout.
 * The session is gone. The regret lingers.
 *
 * @param sessionId - The session to forget
 */
function forget(sessionId: string): void {
  const tracked = theGrudgeBook.get(sessionId);
  if (!tracked) {
    log.debug({ sessionId }, 'tried to forget something we never remembered. deep.');
    return;
  }

  clearTimeout(tracked.timeoutId);
  theGrudgeBook.delete(sessionId);

  log.info({ sessionId, userId: tracked.userId }, 'session forgotten. moving on.');
}

/**
 * Resets the inactivity timer for a session. Called on each instruction
 * because the user is apparently still doing this.
 *
 * @param sessionId - The session that proved signs of life
 */
function touch(sessionId: string): void {
  const tracked = theGrudgeBook.get(sessionId);
  if (!tracked) {
    log.debug({ sessionId }, 'tried to touch a session that does not exist. awkward.');
    return;
  }

  clearTimeout(tracked.timeoutId);
  tracked.lastActivityAt = Date.now();
  tracked.timeoutId = startDoomClock(sessionId);

  log.debug({ sessionId }, 'session touched. timer reset. they are still at it.');
}

/**
 * Counts how many active sessions a user has.
 * Most people should have 1. Overachievers might have 2.
 * Anyone at 3 needs an intervention.
 *
 * @param userId - The user to count sessions for
 * @returns Number of active sessions
 */
function countByUser(userId: string): number {
  let count = 0;
  for (const [, tracked] of theGrudgeBook) {
    if (tracked.userId === userId) {
      count += 1;
    }
  }
  return count;
}

/**
 * Manually reaps expired sessions. Returns the IDs of those removed.
 * In practice, the setTimeout handles expiration automatically.
 * This exists for manual cleanup and testing, like flossing.
 * You know you should do it, but the timer usually handles things.
 *
 * @returns Array of session IDs that were reaped
 */
function reap(): string[] {
  const now = Date.now();
  const reaped: string[] = [];

  for (const [sessionId, tracked] of theGrudgeBook) {
    if (now - tracked.lastActivityAt >= MAX_REGRET_DURATION_MS) {
      log.info({ sessionId }, 'reaping expired session. rest in peace.');
      if (onExpired) {
        try {
          onExpired(sessionId, tracked.session);
        } catch (err: unknown) {
          log.error({ sessionId, err }, 'onExpired callback threw during reap.');
        }
      }
      clearTimeout(tracked.timeoutId);
      theGrudgeBook.delete(sessionId);
      reaped.push(sessionId);
    }
  }

  if (reaped.length > 0) {
    log.info({ reaped: reaped.length }, 'reaping complete. souls collected.');
  }

  return reaped;
}

/**
 * Returns the full session map. Mostly for testing.
 * In production, staring at this is like opening your browser history:
 * technically possible, emotionally inadvisable.
 *
 * @returns The entire grudge book, laid bare
 */
function assessDamage(): Map<string, TrackedSession> {
  return theGrudgeBook;
}

/**
 * Sets the callback invoked when a session expires.
 * Pass null to remove it. Like unsubscribing from notifications
 * you never asked for.
 *
 * @param callback - The function to call when sessions expire, or null to clear
 */
function setOnExpired(callback: ((sessionId: string, session?: SessionState) => void) | null): void {
  onExpired = callback;
}

export {
  remember,
  recall,
  forget,
  touch,
  countByUser,
  reap,
  assessDamage,
  setOnExpired,
  MAX_REGRET_DURATION_MS,
  SHAME_THRESHOLD,
};

export type { TrackedSession };
