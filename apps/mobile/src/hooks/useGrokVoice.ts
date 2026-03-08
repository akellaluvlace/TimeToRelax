// useGrokVoice.ts -- The hook that connects you to xAI's Realtime API.
// For when Deepgram's HTTP round-trips aren't fast enough
// and you need real-time voice that matches your urgency.
//
// Falls back gracefully. If Grok can't connect, the caller
// decides what to do. We just report the damage.

import { useCallback, useEffect, useRef, useState } from 'react';

import { openBooth } from '@/services/confessional';
import {
  acquireTheUpgrade,
  connectToTheUpgrade,
} from '@/services/grok-voice';
import { digUpTheBodies, KEY_SLOTS } from '@/services/hide-the-evidence';

import type { GrokConnection } from '@/services/grok-voice';

const log = openBooth('useGrokVoice');

/** What this hook gives back to the component. The Grok voice controls. */
interface UseGrokVoiceReturn {
  /** Whether the WebSocket is currently connected to Grok. */
  isConnected: boolean;
  /** Whether we're in the process of connecting. Patience is a virtue you don't have. */
  isConnecting: boolean;
  /** The latest transcript from Grok. Partial or final. */
  transcript: string;
  /** Error message, or null if everything is suspiciously fine. */
  error: string | null;
  /** Connects to the Grok Realtime API. Acquires token, opens WebSocket. */
  connect: () => Promise<void>;
  /** Disconnects from Grok. Walk away. */
  disconnect: () => void;
  /** Sends a base64-encoded audio chunk to Grok. */
  sendAudio: (base64Audio: string) => void;
}

/**
 * React hook for Grok Realtime API voice integration.
 * Manages the WebSocket lifecycle, token acquisition, and
 * the emotional journey of real-time voice processing.
 *
 * Falls back gracefully. If the connection fails, it sets an error
 * and lets the caller decide whether to cry or try Deepgram instead.
 *
 * @param backendUrl - Base URL of the TimeToRelax backend
 * @returns Grok voice controls: connect, disconnect, sendAudio, state
 */
export function useGrokVoice(backendUrl: string): UseGrokVoiceReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to the connection so we can clean up on unmount
  // without triggering re-renders every time a callback fires.
  const connectionRef = useRef<GrokConnection | null>(null);

  // Track mount state to avoid setting state on unmounted component.
  // React warns about this. We listen to React. Sometimes.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Clean up the WebSocket on unmount. Don't leave connections
      // dangling like unfinished side projects.
      if (connectionRef.current) {
        connectionRef.current.disconnect();
        connectionRef.current = null;
      }
    };
  }, []);

  /**
   * Connects to the Grok Realtime API.
   * 1. Retrieves the xAI key from secure storage
   * 2. Acquires a session token from the backend
   * 3. Opens a WebSocket connection
   * 4. Registers event handlers
   *
   * If any step fails, sets error state and gives up.
   * Life is too short for infinite retries.
   */
  const connect = useCallback(async (): Promise<void> => {
    // Already connected or connecting? Don't double up.
    if (connectionRef.current?.isConnected() || isConnecting) {
      log.warn('Already connected or connecting to Grok. Ignoring duplicate request.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Step 1: Get the xAI key from secure storage
      const xaiKey = await digUpTheBodies(KEY_SLOTS.XAI_KEY);
      if (!xaiKey) {
        throw new Error('No xAI key found. Configure it in Settings.');
      }

      // Step 2: Acquire session token from backend
      log.info('Acquiring Grok session token');
      const sessionInfo = await acquireTheUpgrade(backendUrl, xaiKey);

      // Step 3: Connect to the WebSocket
      log.info('Opening Grok WebSocket connection');
      const connection = connectToTheUpgrade(sessionInfo);
      connectionRef.current = connection;

      // Step 4: Register event handlers
      connection.onTranscript((text: string, isFinal: boolean) => {
        if (!mountedRef.current) return;
        if (isFinal) {
          setTranscript(text);
        } else {
          // Partial transcript. Update in real time so the user
          // can see their words being judged as they speak.
          setTranscript((prev) => prev + text);
        }
      });

      connection.onAudio((_base64Audio: string) => {
        // Audio playback is handled by the caller. We just pass it through.
        // This hook manages connection state, not audio output.
        log.debug('Received audio chunk from Grok');
      });

      connection.onError((err: Error) => {
        if (!mountedRef.current) return;
        log.error('Grok connection error', { error: err.message });
        setError(err.message);
        setIsConnected(false);
      });

      if (mountedRef.current) {
        setIsConnected(true);
        setIsConnecting(false);
      }

      log.info('Grok voice connected successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to Grok';
      log.error('Failed to connect to Grok', { error: message });
      if (mountedRef.current) {
        setError(message);
        setIsConnected(false);
        setIsConnecting(false);
      }
    }
  }, [backendUrl, isConnecting]);

  /**
   * Disconnects from the Grok Realtime API.
   * Cleans up the WebSocket and resets state.
   */
  const disconnect = useCallback((): void => {
    if (connectionRef.current) {
      connectionRef.current.disconnect();
      connectionRef.current = null;
    }

    if (mountedRef.current) {
      setIsConnected(false);
      setIsConnecting(false);
      setTranscript('');
      setError(null);
    }

    log.info('Disconnected from Grok');
  }, []);

  /**
   * Sends a base64-encoded audio chunk to Grok via WebSocket.
   * Silently drops the audio if not connected.
   * No error thrown. No drama. Just silence.
   */
  const sendAudio = useCallback((base64Audio: string): void => {
    if (!connectionRef.current?.isConnected()) {
      log.warn('Cannot send audio. Not connected to Grok.');
      return;
    }

    connectionRef.current.sendAudio(base64Audio);
  }, []);

  return {
    isConnected,
    isConnecting,
    transcript,
    error,
    connect,
    disconnect,
    sendAudio,
  };
}
