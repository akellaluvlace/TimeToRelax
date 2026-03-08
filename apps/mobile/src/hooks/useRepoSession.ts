// useRepoSession.ts -- The hook that connects to an existing repo session.
// Calls the backend to clone, install, and excavate a repo,
// then hands you a sessionId so you can start voicing changes.
// Like ordering a taxi for your codebase. From a bus.

import { useCallback, useState } from 'react';

import { openBooth } from '@/services/confessional';
import { useSettingsStore } from '@/store/settings-store';

const log = openBooth('useRepoSession');

// Where the backend lives. Hardcoded for now.
// TODO(nikita): Pull from config/env. This is fine for dev. Famous last words.
const API_BASE = 'http://localhost:3000';

/** What this hook gives back to the screen. Enough rope to hang yourself. */
interface UseRepoSessionReturn {
  /** Whether the repo is currently being cloned, installed, and read. */
  isSettingUp: boolean;
  /** Human-readable progress message for the UI. */
  setupProgress: string;
  /** The sessionId once setup is complete. null until then. */
  sessionId: string | null;
  /** Error message if something went sideways. null if all is well (rare). */
  error: string | null;
  /** Kicks off the existing project flow. Buckle up. */
  startSession: (repoUrl: string, anthropicKey: string, subdirectory?: string) => Promise<void>;
}

/**
 * Hook for setting up an existing project session.
 * Calls POST /session/existing-project on the backend,
 * tracks progress, and returns a sessionId when it's ready.
 *
 * @returns Setup state, progress, sessionId, error, and the startSession function
 */
export function useRepoSession(): UseRepoSessionReturn {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupProgress, setSetupProgress] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const defaultModel = useSettingsStore((s) => s.defaultModel);

  const startSession = useCallback(
    async (repoUrl: string, anthropicKey: string, subdirectory?: string): Promise<void> => {
      setIsSettingUp(true);
      setError(null);
      setSessionId(null);
      setSetupProgress('Cloning repository...');

      log.info('Starting existing project session', { repoUrl });

      try {
        const response = await fetch(`${API_BASE}/session/existing-project`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'local-user', // TODO(nikita): Real user ID from auth. One day.
          },
          body: JSON.stringify({
            anthropicKey,
            repoUrl,
            subdirectory,
            model: defaultModel,
          }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          const message = body.error ?? `Server returned ${response.status}. Not great.`;
          throw new Error(message);
        }

        const data = (await response.json()) as { sessionId: string };

        setSetupProgress('Ready. Your codebase has been read. No comment.');
        setSessionId(data.sessionId);

        log.info('Existing project session created', { sessionId: data.sessionId });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to set up project. The universe shrugged.';
        log.error('Failed to start existing project session', { error: message });
        setError(message);
        setSetupProgress('');
      } finally {
        setIsSettingUp(false);
      }
    },
    [defaultModel],
  );

  return {
    isSettingUp,
    setupProgress,
    sessionId,
    error,
    startSession,
  };
}
