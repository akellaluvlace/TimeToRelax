// useAgentSession.ts -- The hook that connects to the SSE stream
// and watches your code being written in real time.
// Like a live stream of someone else doing your job, but from a bus.
//
// React Native doesn't have native EventSource, so we roll our own
// SSE parser using fetch. It's not glamorous, but it works.

import { useState, useCallback, useRef, useEffect } from 'react';

import type {
  AgentEvent,
  AgentEventType,
  FileChangedData,
  PreviewReadyData,
} from '@timetorelax/shared';

import { openBooth } from '@/services/confessional';

const log = openBooth('useAgentSession');

/** Represents a single file that the agent touched. For better or worse. */
interface FileChange {
  path: string;
  action: 'created' | 'modified' | 'deleted';
}

/** The session phases, mapped from SSE event types. The grief cycle, basically. */
type SessionPhase = 'idle' | 'denial' | 'bargaining' | 'acceptance' | 'grief' | 'enlightenment';

/** What this hook gives you. Everything you need to watch the horror unfold. */
interface UseAgentSessionReturn {
  events: AgentEvent[];
  filesChanged: FileChange[];
  previewUrl: string | null;
  phase: SessionPhase;
  isConnected: boolean;
  error: string | null;
  connect: (sessionId: string, baseUrl: string) => void;
  disconnect: () => void;
}

// How long before we try reconnecting. Starts here, doubles each attempt.
// Caps at VOICE_OF_REASON_TIMEOUT because there's stubborn and then there's delusional.
const INITIAL_BACKOFF_MS = 1_000;
const VOICE_OF_REASON_TIMEOUT = 10_000;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Maps an SSE event type string to a session phase.
 * The grief cycle mapped to agent activity. It tracks.
 *
 * @param eventType - The event type from the SSE stream
 * @returns The session phase that event implies
 */
function mapEventToPhase(eventType: string): SessionPhase {
  const phaseMap: Record<string, SessionPhase> = {
    agent_thinking: 'bargaining',
    agent_reading: 'bargaining',
    agent_writing: 'bargaining',
    agent_running: 'bargaining',
    build_success: 'enlightenment',
    build_failed: 'grief',
    preview_ready: 'acceptance',
    agent_complete: 'acceptance',
    agent_error: 'grief',
    session_timeout: 'idle',
    rate_limited: 'grief',
    rate_limit_cleared: 'bargaining',
  };

  return phaseMap[eventType] ?? 'bargaining';
}

/**
 * Parses raw SSE text into an AgentEvent.
 * SSE format: lines starting with "id:", "event:", "data:".
 * Blank lines separate events. Simple. Reliable. Unlike most things.
 *
 * @param lines - The accumulated lines for a single SSE event
 * @returns A parsed AgentEvent, or null if the lines were garbage
 */
function parseSSEEvent(lines: string[]): AgentEvent | null {
  let id = '';
  let type = '';
  let dataStr = '';

  for (const line of lines) {
    if (line.startsWith('id:')) {
      id = line.slice(3).trim();
    } else if (line.startsWith('event:')) {
      type = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataStr += line.slice(5).trim();
    }
  }

  if (!type || !dataStr) return null;

  try {
    const data: Record<string, unknown> = JSON.parse(dataStr);
    return {
      id: id || `evt-${Date.now()}`,
      type: type as AgentEventType,
      timestamp: Date.now(),
      data,
    };
  } catch {
    log.warn('Failed to parse SSE data', { type, dataStr });
    return null;
  }
}

/**
 * Hook that connects to the backend SSE stream for a given session
 * and tracks everything the agent does. Events, file changes, preview URLs,
 * and the inevitable errors.
 *
 * Uses fetch-based SSE parsing because React Native doesn't have EventSource.
 * Includes automatic reconnection with exponential backoff because
 * mobile networks are as reliable as New Year's resolutions.
 *
 * @returns Session state and controls for connecting/disconnecting
 */
export function useAgentSession(): UseAgentSessionReturn {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [filesChanged, setFilesChanged] = useState<FileChange[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup and reconnection logic
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const baseUrlRef = useRef<string | null>(null);
  // Track the last event ID we received for SSE replay on reconnect.
  // The server uses this to replay missed events from its buffer.
  const lastEventIdRef = useRef<string | null>(null);

  /**
   * Processes a single parsed event. Updates state, tracks files,
   * extracts preview URLs, and updates the phase.
   */
  const processEvent = useCallback((event: AgentEvent) => {
    // Track the last event ID for SSE replay on reconnect
    lastEventIdRef.current = event.id;

    setEvents((prev) => [...prev, event]);
    setPhase(mapEventToPhase(event.type));

    // Track file changes from FILE_CHANGED events
    if (event.type === 'file_changed') {
      const fileData = event.data as FileChangedData;
      if (fileData.filePath && fileData.action) {
        const change: FileChange = {
          path: fileData.filePath,
          action: fileData.action,
        };
        setFilesChanged((prev) => {
          // Replace if same file path already tracked (e.g., created then modified)
          const existing = prev.findIndex((f) => f.path === change.path);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = change;
            return updated;
          }
          return [...prev, change];
        });
      }
    }

    // Extract preview URL from PREVIEW_READY events
    if (event.type === 'preview_ready') {
      const previewData = event.data as PreviewReadyData;
      if (previewData.url) {
        setPreviewUrl(previewData.url);
      }
    }
  }, []);

  /**
   * Reads the SSE stream line by line using fetch.
   * React Native's fetch supports streaming responses, mostly.
   * When it doesn't, we reconnect and hope for the best.
   */
  const startStreaming = useCallback(async (sessionId: string, baseUrl: string) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // If we have a lastEventId from a previous connection, pass it
    // so the server replays events we missed while disconnected.
    const lastId = lastEventIdRef.current;
    const url = lastId
      ? `${baseUrl}/session/${sessionId}/events?lastEventId=${lastId}`
      : `${baseUrl}/session/${sessionId}/events`;

    try {
      log.info('Connecting to SSE stream', { sessionId, url });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('SSE response has no body. The void is truly empty.');
      }

      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;

      log.info('SSE stream connected', { sessionId });

      // Read the stream using the reader API
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentLines: string[] = [];

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split by newlines and process
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.trim() === '') {
            // Empty line = end of event
            if (currentLines.length > 0) {
              const parsed = parseSSEEvent(currentLines);
              if (parsed) {
                processEvent(parsed);
              }
              currentLines = [];
            }
          } else {
            currentLines.push(line);
          }
        }
      }

      // Stream ended naturally
      setIsConnected(false);
      log.info('SSE stream ended', { sessionId });
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        // We aborted intentionally. No error, no reconnect.
        log.info('SSE stream aborted intentionally', { sessionId });
        return;
      }

      const message = err instanceof Error ? err.message : 'SSE connection lost. The void closed.';
      log.error('SSE stream error', { sessionId, error: message });
      setIsConnected(false);
      setError(message);

      // Attempt reconnection with exponential backoff
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const backoff = Math.min(
          INITIAL_BACKOFF_MS * Math.pow(2, reconnectAttemptsRef.current),
          VOICE_OF_REASON_TIMEOUT,
        );
        reconnectAttemptsRef.current += 1;

        log.info('Scheduling SSE reconnect', {
          attempt: reconnectAttemptsRef.current,
          backoffMs: backoff,
        });

        reconnectTimeoutRef.current = setTimeout(() => {
          void startStreaming(sessionId, baseUrl);
        }, backoff);
      } else {
        setError('Lost connection after multiple attempts. Check your signal and try again.');
        log.error('Max SSE reconnect attempts reached', { sessionId });
      }
    }
  }, [processEvent]);

  /**
   * Connects to the SSE stream for a session.
   * Clears previous state because each session is a fresh start.
   * A clean slate. A new opportunity to regret.
   */
  const connect = useCallback((sessionId: string, baseUrl: string) => {
    // Clear previous session state
    setEvents([]);
    setFilesChanged([]);
    setPreviewUrl(null);
    setPhase('denial');
    setError(null);
    reconnectAttemptsRef.current = 0;
    lastEventIdRef.current = null;
    sessionIdRef.current = sessionId;
    baseUrlRef.current = baseUrl;

    log.info('Initiating SSE connection', { sessionId });
    void startStreaming(sessionId, baseUrl);
  }, [startStreaming]);

  /**
   * Disconnects from the SSE stream.
   * Aborts the fetch, clears reconnect timers, sets connected to false.
   * Freedom. Sweet, terrifying freedom.
   */
  const disconnect = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    sessionIdRef.current = null;
    baseUrlRef.current = null;
    setIsConnected(false);

    log.info('SSE connection disconnected');
  }, []);

  // Cleanup on unmount. Because dangling connections are worse than dangling modifiers.
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    events,
    filesChanged,
    previewUrl,
    phase,
    isConnected,
    error,
    connect,
    disconnect,
  };
}

export type { FileChange, SessionPhase, UseAgentSessionReturn };
