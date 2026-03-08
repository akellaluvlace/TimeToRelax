// Session persistence. Because closing the app doesn't mean you're done.
// You're never done. The code is still there. The branch is still open.
// The bus is still moving. And your session state? Saved. In memory.
//
// In-memory Map because we haven't earned a database yet.
// If the server restarts, all saved sessions vanish.
// Which is fine. It's called a fresh start. Look it up.
//
// If you're reading this on GitHub: sleep is not optional.
// But session persistence is. And we chose persistence.

import type { SessionState } from '@timetorelax/shared';

import { openChapter } from './dear-diary.js';

const log = openChapter('sleep-is-optional');

/** A saved session, complete with who saved it and when. */
interface SavedSession {
  /** The session state at time of save. */
  state: SessionState;
  /** The user who owns this session. For listing purposes. */
  userId: string;
  /** When the session was saved. Unix ms. */
  savedAt: number;
}

// The drawer where we shove session states "for later."
// Like that junk drawer in your kitchen, but for code sessions.
const theDrawer = new Map<string, SavedSession>();

/**
 * Saves session state for potential resume.
 * Because closing the app doesn't mean you're done.
 * You're never done.
 *
 * @param sessionId - The session to save
 * @param state - The session state to remember
 */
function rememberForLater(sessionId: string, state: SessionState): void {
  const saved: SavedSession = {
    state: { ...state },
    userId: state.userId,
    savedAt: Date.now(),
  };

  theDrawer.set(sessionId, saved);

  log.info(
    { sessionId, userId: state.userId, phase: state.phase },
    'session saved. it will haunt you later.',
  );
}

/**
 * Attempts to restore a previously saved session.
 * Returns null if the session expired, was destroyed,
 * or was never saved because you had the good sense to close it.
 *
 * @param sessionId - The session to wake up
 * @returns The saved session state, or null if it's gone
 */
function wakeUpCall(sessionId: string): SessionState | null {
  const saved = theDrawer.get(sessionId);
  if (!saved) {
    log.debug({ sessionId }, 'no saved session found. maybe it was a dream.');
    return null;
  }

  log.info(
    { sessionId, userId: saved.userId, savedAt: saved.savedAt },
    'session restored. welcome back.',
  );

  return { ...saved.state };
}

/**
 * Lists all resumable sessions for a user.
 * Like checking your browser history, but for coding sessions
 * you started at inappropriate times.
 *
 * @param userId - The user whose regrets to list
 * @returns Array of session states that can be resumed
 */
function listRegrets(userId: string): SessionState[] {
  const sessions: SessionState[] = [];
  for (const [, saved] of theDrawer) {
    if (saved.userId === userId) {
      sessions.push({ ...saved.state });
    }
  }

  log.debug({ userId, count: sessions.length }, 'regrets listed.');
  return sessions;
}

/**
 * Forgets a saved session. Called on explicit session end,
 * because sometimes you really are done. And that's okay.
 * No, really. It's okay. You can stop. Please stop.
 *
 * @param sessionId - The session to forget
 */
function letItGo(sessionId: string): void {
  const existed = theDrawer.delete(sessionId);
  if (existed) {
    log.info({ sessionId }, 'saved session forgotten. moving on.');
  } else {
    log.debug({ sessionId }, 'tried to forget a session that was never saved. efficient.');
  }
}

/**
 * Returns the total number of saved sessions. For diagnostics
 * and existential contemplation.
 *
 * @returns How many sessions are gathering dust in the drawer
 */
function drawerSize(): number {
  return theDrawer.size;
}

export { rememberForLater, wakeUpCall, listRegrets, letItGo, drawerSize };
export type { SavedSession };
