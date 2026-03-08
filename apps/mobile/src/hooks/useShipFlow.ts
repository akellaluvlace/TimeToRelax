// useShipFlow.ts -- The hook that ships your code to GitHub.
// Accept -> Push -> PR. Three steps to make it someone else's problem.
// Each step enables the next because order of operations matters.
// Even on a bus. Especially on a bus.

import { useState, useCallback } from 'react';

import { openBooth } from '@/services/confessional';
import { digUpTheBodies, KEY_SLOTS } from '@/services/hide-the-evidence';

const log = openBooth('useShipFlow');

/** The aftermath of committing in the sandbox. */
interface CommitResult {
  branch: string;
  commitHash: string;
  filesChanged: number;
}

/** The aftermath of pushing to GitHub. */
interface PushResult {
  branch: string;
  url: string;
}

/** What this hook gives you. Everything you need to ship from a bus. */
interface UseShipFlowReturn {
  isAccepting: boolean;
  isPushing: boolean;
  isCreatingPR: boolean;
  acceptResult: CommitResult | null;
  pushResult: PushResult | null;
  prUrl: string | null;
  error: string | null;
  acceptChanges: (description: string) => Promise<void>;
  pushToGitHub: (repoUrl: string) => Promise<void>;
  createPR: (repoFullName: string, title: string, description: string) => Promise<void>;
}

/**
 * Hook that orchestrates the ship flow: accept, push, PR.
 * Each step calls the backend, tracks loading states, and stores results.
 * Gets the GitHub token from the secure vault because we have standards.
 *
 * @param sessionId - The session whose changes we're shipping
 * @param backendUrl - Where the backend lives
 * @returns Ship flow state and action functions
 */
export function useShipFlow(sessionId: string, backendUrl: string): UseShipFlowReturn {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [acceptResult, setAcceptResult] = useState<CommitResult | null>(null);
  const [pushResult, setPushResult] = useState<PushResult | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Step 1: Accept changes. Commits them to a branch in the sandbox.
   * After this, there are no take-backsies.
   */
  const acceptChanges = useCallback(async (description: string): Promise<void> => {
    setIsAccepting(true);
    setError(null);

    try {
      log.info('Accepting changes', { sessionId, description });

      const response = await fetch(`${backendUrl}/session/${sessionId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'mobile-user',
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? `Accept failed with status ${response.status}`);
      }

      const result = (await response.json()) as CommitResult;
      setAcceptResult(result);

      log.info('Changes accepted', { branch: result.branch, filesChanged: result.filesChanged });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Accept failed. The universe said no.';
      log.error('Accept failed', { error: message });
      setError(message);
    } finally {
      setIsAccepting(false);
    }
  }, [sessionId, backendUrl]);

  /**
   * Step 2: Push to GitHub. Ships the committed branch.
   * Retrieves the GitHub token from secure storage because
   * we don't keep secrets in state. We have standards.
   */
  const pushToGitHub = useCallback(async (repoUrl: string): Promise<void> => {
    setIsPushing(true);
    setError(null);

    try {
      const githubToken = await digUpTheBodies(KEY_SLOTS.GITHUB_TOKEN);
      if (!githubToken) {
        throw new Error('No GitHub token found. Check Settings. We\'ll wait.');
      }

      log.info('Pushing to GitHub', { sessionId });

      const response = await fetch(`${backendUrl}/session/${sessionId}/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'mobile-user',
          'x-github-token': githubToken,
        },
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? `Push failed with status ${response.status}`);
      }

      const result = (await response.json()) as PushResult;
      setPushResult(result);

      log.info('Pushed to GitHub', { branch: result.branch, url: result.url });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Push failed. Check your token and try again.';
      log.error('Push failed', { error: message });
      setError(message);
    } finally {
      setIsPushing(false);
    }
  }, [sessionId, backendUrl]);

  /**
   * Step 3: Create a PR. Makes it someone else's problem.
   * Retrieves the GitHub token from secure storage.
   */
  const createPR = useCallback(async (
    repoFullName: string,
    title: string,
    description: string,
  ): Promise<void> => {
    setIsCreatingPR(true);
    setError(null);

    try {
      const githubToken = await digUpTheBodies(KEY_SLOTS.GITHUB_TOKEN);
      if (!githubToken) {
        throw new Error('No GitHub token found. Check Settings. We\'ll wait.');
      }

      log.info('Creating PR', { sessionId, repoFullName });

      const response = await fetch(`${backendUrl}/session/${sessionId}/pr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'mobile-user',
          'x-github-token': githubToken,
        },
        body: JSON.stringify({ repoFullName, title, description }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? `PR creation failed with status ${response.status}`);
      }

      const result = (await response.json()) as { prUrl: string; prNumber: number };
      setPrUrl(result.prUrl);

      log.info('PR created', { prUrl: result.prUrl, prNumber: result.prNumber });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'PR creation failed. GitHub said no.';
      log.error('PR creation failed', { error: message });
      setError(message);
    } finally {
      setIsCreatingPR(false);
    }
  }, [sessionId, backendUrl]);

  return {
    isAccepting,
    isPushing,
    isCreatingPR,
    acceptResult,
    pushResult,
    prUrl,
    error,
    acceptChanges,
    pushToGitHub,
    createPR,
  };
}

export type { CommitResult, PushResult, UseShipFlowReturn };
