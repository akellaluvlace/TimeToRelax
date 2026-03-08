// session-store.ts -- Zustand store for session state.
// Tracks which stage of grief the user is currently in.

import { create } from 'zustand';

import type { SessionPhase, SessionConfig, SessionState } from '@timetorelax/shared';

import { openBooth } from '@/services/confessional';

const log = openBooth('session-store');

/** The shape of the session store. Grief management, basically. */
interface SessionStore {
  /** The current session, if one exists. null means blissful ignorance. */
  currentSession: SessionState | null;
  /** Which stage of grief we're in. null means the user hasn't started yet. */
  phase: SessionPhase | null;
  /** Whether we're in the process of doing something we'll regret. */
  isLoading: boolean;
  /** The last error, if something went sideways. */
  lastError: string | null;

  /**
   * Creates a new session. The first step is always denial.
   * @param config - Session configuration. The terms of your regret.
   */
  spawnRegret: (config: SessionConfig) => void;

  /**
   * Returns the current session state.
   * Like checking the damage after a night out.
   */
  assessDamage: () => SessionState | null;

  /**
   * Updates the current session phase.
   * Moving through the stages of grief, one phase at a time.
   */
  progressGrief: (phase: SessionPhase) => void;

  /**
   * Updates the session state with new data from the server.
   * Reality check, delivered via SSE.
   */
  syncReality: (session: SessionState) => void;

  /**
   * Ends the current session and cleans up.
   * Freedom. Sweet, terrifying freedom.
   */
  releaseYouFromYourself: () => void;

  /**
   * Sets the loading state.
   * The suspense is killing us. Or at least the UX.
   */
  setLoading: (isLoading: boolean) => void;

  /**
   * Records an error. Because of course something went wrong.
   */
  recordRegret: (error: string | null) => void;
}

/**
 * The session store. Manages the lifecycle of a coding session,
 * which is really just the five stages of grief with extra steps.
 */
export const useSessionStore = create<SessionStore>((set, get) => ({
  currentSession: null,
  phase: null,
  isLoading: false,
  lastError: null,

  spawnRegret: (config: SessionConfig): void => {
    log.info('Spawning regret', { model: config.model, maxTurns: config.maxTurns });

    // Create a placeholder session state while we wait for the server
    // to confirm our terrible life choices
    const placeholder: SessionState = {
      id: `pending-${Date.now()}`,
      phase: 'denial',
      userId: 'local',
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      filesChanged: 0,
      turnsUsed: 0,
    };

    set({
      currentSession: placeholder,
      phase: 'denial',
      isLoading: true,
      lastError: null,
    });
  },

  assessDamage: (): SessionState | null => {
    return get().currentSession;
  },

  progressGrief: (phase: SessionPhase): void => {
    log.debug('Grief progressed', { phase });
    set((state) => ({
      phase,
      currentSession: state.currentSession
        ? { ...state.currentSession, phase, lastActivityAt: Date.now() }
        : null,
    }));
  },

  syncReality: (session: SessionState): void => {
    log.debug('Reality synced', { sessionId: session.id, phase: session.phase });
    set({
      currentSession: session,
      phase: session.phase,
      isLoading: false,
    });
  },

  releaseYouFromYourself: (): void => {
    log.info('Session ended. Freedom achieved.');
    set({
      currentSession: null,
      phase: null,
      isLoading: false,
      lastError: null,
    });
  },

  setLoading: (isLoading: boolean): void => {
    set({ isLoading });
  },

  recordRegret: (error: string | null): void => {
    if (error) {
      log.error('Regret recorded', { error });
    }
    set({ lastError: error, isLoading: false });
  },
}));
