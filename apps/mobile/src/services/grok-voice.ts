// grok-voice.ts -- The Grok Realtime API voice client.
// When Deepgram isn't chaotic enough and you need a voice provider
// that matches your energy. xAI's Realtime WebSocket API:
// lower latency, higher commitment, questionable life choices.
//
// If you're reading this on GitHub: yes, we call this "the upgrade."
// No, we don't think you need it. But we respect the impulse.

import { openBooth } from '@/services/confessional';

const log = openBooth('grok-voice');

// ---- Types ----

/** Session info returned from the backend after token acquisition. */
export interface GrokSessionInfo {
  /** Temporary auth token for the WebSocket connection. */
  token: string;
  /** The WebSocket URL to connect to. */
  wsUrl: string;
  /** System prompt to configure the Grok voice model personality. */
  systemPrompt: string;
  /** Which Grok voice model to use (e.g., 'grok-3-fast'). */
  voiceModel: string;
  /** Unix timestamp (ms) when this token expires. Clock's ticking. */
  expiresAt: number;
}

/**
 * The Grok WebSocket connection object. Your direct line to xAI's
 * realtime voice pipeline. Handle with the same care you'd give
 * a live microphone at a company all-hands.
 */
export interface GrokConnection {
  /** Sends a base64-encoded audio chunk through the WebSocket. */
  sendAudio: (base64Audio: string) => void;
  /** Registers a callback for incoming transcripts. */
  onTranscript: (cb: (text: string, isFinal: boolean) => void) => void;
  /** Registers a callback for incoming audio responses. */
  onAudio: (cb: (base64Audio: string) => void) => void;
  /** Registers a callback for errors. Because there will be errors. */
  onError: (cb: (error: Error) => void) => void;
  /** Severs the connection. Walk away. Don't look back. */
  disconnect: () => void;
  /** Whether the WebSocket is currently connected. */
  isConnected: () => boolean;
}

// ---- Outgoing event types for Grok Realtime API ----

/** Session configuration sent on initial connection. */
interface GrokSessionUpdateEvent {
  type: 'session.update';
  session: {
    instructions: string;
    model: string;
    voice: string;
    input_audio_format: string;
    output_audio_format: string;
  };
}

/** Audio input chunk sent to the Grok Realtime API. */
interface GrokAudioAppendEvent {
  type: 'input_audio_buffer.append';
  audio: string;
}

type GrokOutgoingEvent = GrokSessionUpdateEvent | GrokAudioAppendEvent;

// ---- Incoming event types from Grok Realtime API ----

/** Transcript event from the Grok Realtime API. */
interface GrokTranscriptEvent {
  type: 'conversation.item.input_audio_transcription.completed'
    | 'response.audio_transcript.delta'
    | 'response.audio_transcript.done';
  transcript?: string;
  delta?: string;
}

/** Audio response event from the Grok Realtime API. */
interface GrokAudioResponseEvent {
  type: 'response.audio.delta' | 'response.audio.done';
  delta?: string;
}

/** Error event from the Grok Realtime API. */
interface GrokErrorEvent {
  type: 'error';
  error: {
    message: string;
    code?: string;
  };
}

/** Union of all incoming events we care about. */
type GrokIncomingEvent = GrokTranscriptEvent | GrokAudioResponseEvent | GrokErrorEvent;

// ---- Functions ----

/**
 * Acquires a temporary session token from the backend for Grok Realtime API.
 * The backend handles the xAI key exchange so we don't store it
 * anywhere near the user's questionable photo gallery.
 *
 * @param backendUrl - Base URL of the TimeToRelax backend
 * @param xaiKey - The user's xAI API key, sent via header
 * @returns Session info with token, WebSocket URL, and config
 * @throws If the backend rejects us or the network gives up
 */
export async function acquireTheUpgrade(
  backendUrl: string,
  xaiKey: string,
): Promise<GrokSessionInfo> {
  log.debug('Requesting Grok session token from backend', { backendUrl });

  try {
    const response = await fetch(`${backendUrl}/voice/grok/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-xai-key': xaiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error('Failed to acquire Grok session token', {
        status: response.status,
        body: errorText,
      });
      throw new Error(
        `Grok token acquisition failed with status ${response.status}: ${errorText}`,
      );
    }

    const result: unknown = await response.json();

    // Narrow the unknown response. Trust nobody, especially backend services
    // we wrote ourselves at 2am.
    if (!isGrokSessionInfo(result)) {
      log.error('Unexpected Grok session response shape', { result });
      throw new Error('Backend returned an unexpected response shape for Grok session.');
    }

    log.info('Grok session token acquired', {
      voiceModel: result.voiceModel,
      expiresAt: result.expiresAt,
    });

    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Grok token acquisition failed for unknown reasons';
    log.error('acquireTheUpgrade failed', { error: message });
    throw err instanceof Error ? err : new Error(message);
  }
}

/**
 * Creates a WebSocket connection to the Grok Realtime API.
 * Sends a session.update event on connection to configure the
 * voice model with our cynical personality prompt.
 *
 * This is the upgrade path. Deepgram is the responsible choice.
 * This is the other one.
 *
 * @param sessionInfo - Session info from acquireTheUpgrade
 * @returns A GrokConnection object for sending/receiving audio and transcripts
 */
export function connectToTheUpgrade(sessionInfo: GrokSessionInfo): GrokConnection {
  log.info('Connecting to Grok Realtime API', {
    wsUrl: sessionInfo.wsUrl,
    voiceModel: sessionInfo.voiceModel,
  });

  const ws = new WebSocket(sessionInfo.wsUrl, ['realtime', `openai-insecure-api-key.${sessionInfo.token}`]);

  // Callback registries. Because event-driven programming is just
  // agreeing to be surprised later.
  let transcriptCallbacks: Array<(text: string, isFinal: boolean) => void> = [];
  let audioCallbacks: Array<(base64Audio: string) => void> = [];
  let errorCallbacks: Array<(error: Error) => void> = [];

  // Send session config when the connection opens.
  // This tells Grok who it's pretending to be today.
  ws.onopen = (): void => {
    log.info('Grok WebSocket connected. Sending session config.');

    const sessionUpdate: GrokSessionUpdateEvent = {
      type: 'session.update',
      session: {
        instructions: sessionInfo.systemPrompt,
        model: sessionInfo.voiceModel,
        voice: 'sage',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
      },
    };

    ws.send(JSON.stringify(sessionUpdate));
  };

  // Handle incoming messages from Grok.
  // The API sends JSON events, each with a `type` field.
  ws.onmessage = (event: MessageEvent): void => {
    try {
      const data: unknown = JSON.parse(String(event.data));

      if (!isGrokIncomingEvent(data)) {
        // Unknown event type. Grok sends many event types we don't care about.
        // Ignoring gracefully, like adults.
        return;
      }

      switch (data.type) {
        case 'conversation.item.input_audio_transcription.completed': {
          const text = data.transcript ?? '';
          for (const cb of transcriptCallbacks) {
            cb(text, true);
          }
          break;
        }
        case 'response.audio_transcript.delta': {
          const text = data.delta ?? '';
          for (const cb of transcriptCallbacks) {
            cb(text, false);
          }
          break;
        }
        case 'response.audio_transcript.done': {
          const text = data.transcript ?? '';
          for (const cb of transcriptCallbacks) {
            cb(text, true);
          }
          break;
        }
        case 'response.audio.delta': {
          const audio = data.delta ?? '';
          if (audio) {
            for (const cb of audioCallbacks) {
              cb(audio);
            }
          }
          break;
        }
        case 'response.audio.done': {
          // Final audio chunk. Nothing more to do here.
          break;
        }
        case 'error': {
          const errorMsg = data.error.message;
          log.error('Grok API error', { message: errorMsg, code: data.error.code });
          const err = new Error(`Grok error: ${errorMsg}`);
          for (const cb of errorCallbacks) {
            cb(err);
          }
          break;
        }
      }
    } catch (parseErr: unknown) {
      // If we can't parse the message, that's Grok's problem, not ours.
      // But we log it because we're responsible like that.
      log.warn('Failed to parse Grok WebSocket message', {
        error: parseErr instanceof Error ? parseErr.message : String(parseErr),
      });
    }
  };

  ws.onerror = (): void => {
    log.error('Grok WebSocket error');
    const err = new Error('Grok WebSocket connection error');
    for (const cb of errorCallbacks) {
      cb(err);
    }
  };

  ws.onclose = (): void => {
    log.info('Grok WebSocket closed');
  };

  const connection: GrokConnection = {
    sendAudio: (base64Audio: string): void => {
      if (ws.readyState !== WebSocket.OPEN) {
        log.warn('Tried to send audio on closed WebSocket. Ignoring.');
        return;
      }

      const audioEvent: GrokAudioAppendEvent = {
        type: 'input_audio_buffer.append',
        audio: base64Audio,
      };

      ws.send(JSON.stringify(audioEvent));
    },

    onTranscript: (cb: (text: string, isFinal: boolean) => void): void => {
      transcriptCallbacks.push(cb);
    },

    onAudio: (cb: (base64Audio: string) => void): void => {
      audioCallbacks.push(cb);
    },

    onError: (cb: (error: Error) => void): void => {
      errorCallbacks.push(cb);
    },

    disconnect: (): void => {
      log.info('Disconnecting from Grok Realtime API');
      transcriptCallbacks = [];
      audioCallbacks = [];
      errorCallbacks = [];
      ws.close();
    },

    isConnected: (): boolean => {
      return ws.readyState === WebSocket.OPEN;
    },
  };

  return connection;
}

/**
 * Validates that the user's xAI key is alive and has credit remaining.
 * The backend does the actual validation so we don't have to
 * make direct API calls from the phone.
 *
 * @param backendUrl - Base URL of the TimeToRelax backend
 * @param xaiKey - The xAI API key to validate
 * @returns True if the key works, false if the user needs to check their billing
 */
export async function validateTheUpgrade(
  backendUrl: string,
  xaiKey: string,
): Promise<boolean> {
  log.debug('Validating xAI key via backend');

  try {
    const response = await fetch(`${backendUrl}/voice/grok/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-xai-key': xaiKey,
      },
    });

    if (!response.ok) {
      log.warn('xAI key validation failed', { status: response.status });
      return false;
    }

    const result: unknown = await response.json();

    // The backend should return { valid: boolean }
    if (
      typeof result === 'object' &&
      result !== null &&
      'valid' in result &&
      typeof (result as { valid: unknown }).valid === 'boolean'
    ) {
      const valid = (result as { valid: boolean }).valid;
      log.info('xAI key validation result', { valid });
      return valid;
    }

    log.warn('Unexpected validation response shape', { result });
    return false;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'xAI key validation failed';
    log.error('validateTheUpgrade failed', { error: message });
    return false;
  }
}

// ---- Type guards ----

/**
 * Type guard for GrokSessionInfo. Checks all required fields
 * because we've been burned by loose API contracts before.
 */
function isGrokSessionInfo(value: unknown): value is GrokSessionInfo {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['token'] === 'string' &&
    typeof obj['wsUrl'] === 'string' &&
    typeof obj['systemPrompt'] === 'string' &&
    typeof obj['voiceModel'] === 'string' &&
    typeof obj['expiresAt'] === 'number'
  );
}

/**
 * Type guard for incoming Grok events. Only matches event types
 * we actually handle. The rest are someone else's problem.
 */
function isGrokIncomingEvent(value: unknown): value is GrokIncomingEvent {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  const knownTypes = [
    'conversation.item.input_audio_transcription.completed',
    'response.audio_transcript.delta',
    'response.audio_transcript.done',
    'response.audio.delta',
    'response.audio.done',
    'error',
  ];
  return typeof obj['type'] === 'string' && knownTypes.includes(obj['type']);
}

// Re-export event types for anyone brave enough to use them directly
export type {
  GrokOutgoingEvent,
  GrokIncomingEvent,
  GrokSessionUpdateEvent,
  GrokAudioAppendEvent,
  GrokTranscriptEvent,
  GrokAudioResponseEvent,
  GrokErrorEvent,
};
