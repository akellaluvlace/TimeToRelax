// useVoiceReconnect.ts -- Wraps voice connections with auto-reconnect.
// Because mobile networks are as reliable as New Year's resolutions.
// Deepgram WebSockets drop when the user switches apps to check Instagram,
// walks through a tunnel, or exists on public transport.
// This hook catches the drop and tries again with exponential backoff.

import { useState, useCallback, useRef, useEffect } from 'react';

import { openBooth } from '@/services/confessional';

const log = openBooth('useVoiceReconnect');

/** Backoff delays in ms. Escalates like your anxiety on a deadline. */
const RECONNECT_DELAYS = [1_000, 2_000, 4_000, 8_000, 10_000] as const;

/** Maximum reconnect attempts before we admit defeat. */
const MAX_RECONNECT_ATTEMPTS = RECONNECT_DELAYS.length;

/** What this hook exposes. The connection status and attempt tracking. */
interface UseVoiceReconnectReturn {
  /** Whether the voice connection is currently active. */
  isConnected: boolean;
  /** Whether we are currently trying to reconnect. */
  isReconnecting: boolean;
  /** Which attempt we are on (0 = not reconnecting). */
  reconnectAttempt: number;
  /** How many attempts we will try before giving up. */
  maxAttempts: number;
  /** Call this when the connection drops. Starts the reconnect loop. */
  onDisconnect: () => void;
  /** Call this when the connection is established. Resets attempt counter. */
  onConnect: () => void;
  /** Manually reset the reconnect state. For cleanup or giving up. */
  reset: () => void;
}

/**
 * Hook that wraps voice connection with auto-reconnect logic.
 * Exponential backoff: 1s, 2s, 4s, 8s, 10s max.
 * Tracks attempt count so the UI can show progress (or lack thereof).
 *
 * Does NOT manage the actual voice connection -- that's useVoice's job.
 * This just orchestrates the retry timing and state.
 *
 * @param reconnectFn - The function to call when attempting a reconnect
 * @returns Connection state, attempt tracking, and manual controls
 */
export function useVoiceReconnect(
  reconnectFn: () => Promise<void>,
): UseVoiceReconnectReturn {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);

  /**
   * Called when the connection drops.
   * Starts the exponential backoff reconnect loop.
   */
  const onDisconnect = useCallback(() => {
    setIsConnected(false);

    if (attemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      log.error('Max reconnect attempts reached. Voice connection lost.', {
        attempts: attemptRef.current,
      });
      setIsReconnecting(false);
      return;
    }

    setIsReconnecting(true);
    const delay = RECONNECT_DELAYS[attemptRef.current] ?? RECONNECT_DELAYS[RECONNECT_DELAYS.length - 1];

    log.info('Scheduling voice reconnect', {
      attempt: attemptRef.current + 1,
      delayMs: delay,
    });

    reconnectTimeoutRef.current = setTimeout(() => {
      attemptRef.current += 1;
      setReconnectAttempt(attemptRef.current);

      reconnectFn().catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        log.error('Voice reconnect attempt failed', {
          attempt: attemptRef.current,
          error: message,
        });
        // Trigger next attempt
        onDisconnect();
      });
    }, delay);
  }, [reconnectFn]);

  /**
   * Called when the connection is successfully established.
   * Resets all retry state.
   */
  const onConnect = useCallback(() => {
    setIsConnected(true);
    setIsReconnecting(false);
    setReconnectAttempt(0);
    attemptRef.current = 0;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    log.info('Voice connection established.');
  }, []);

  /**
   * Manually reset the reconnect state. For cleanup or giving up gracefully.
   */
  const reset = useCallback(() => {
    setIsConnected(true);
    setIsReconnecting(false);
    setReconnectAttempt(0);
    attemptRef.current = 0;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount. No dangling timers. We have standards.
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    isReconnecting,
    reconnectAttempt,
    maxAttempts: MAX_RECONNECT_ATTEMPTS,
    onDisconnect,
    onConnect,
    reset,
  };
}

export { RECONNECT_DELAYS, MAX_RECONNECT_ATTEMPTS };
export type { UseVoiceReconnectReturn };
