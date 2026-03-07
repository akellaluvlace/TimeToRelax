// API request/response contracts.
// The handshake between the phone and the server that enables your worst habits.

import type { SessionConfig, SessionState } from './session.js';
import type { AgentEvent } from './events.js';
import type { VoiceProvider } from './voice.js';

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

/** GET /health -- proof that the server is alive (barely). */
export interface HealthResponse {
  status: 'alive';
  version: string;
}

// ---------------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------------

/** POST /session -- spawn a new session of regret. */
export interface CreateSessionRequest {
  /** The user's Anthropic API key. Sent per-request, never stored server-side. */
  anthropicKey: string;
  /** Session configuration. */
  config: SessionConfig;
}

export interface CreateSessionResponse {
  /** The session ID. Hold onto this like your dignity. */
  sessionId: string;
  /** Initial session state. */
  session: SessionState;
  /** SSE endpoint URL for streaming events. */
  sseUrl: string;
}

/** POST /session/:id/instruct -- send a voice instruction to the agent. */
export interface InstructRequest {
  /** What the user mumbled into their phone on the bus. */
  instruction: string;
}

export interface InstructResponse {
  /** Whether the instruction was accepted. */
  accepted: boolean;
}

/** POST /session/:id/accept -- accept changes and prepare for push. */
export interface AcceptChangesRequest {
  /** GitHub access token for pushing. */
  githubToken: string;
  /** Branch name to push to. Auto-generated if omitted. */
  branch?: string;
  /** Commit message. Generated if omitted. */
  commitMessage?: string;
}

export interface AcceptChangesResponse {
  /** Whether the push was initiated. */
  initiated: boolean;
}

/** GET /session/:id/state -- full state sync when SSE buffer overflows. */
export interface SessionStateResponse {
  /** Current session state. */
  session: SessionState;
  /** Buffered events the client may have missed. */
  events: AgentEvent[];
}

/** DELETE /session/:id -- end a session. Release yourself from yourself. */
export interface EndSessionResponse {
  /** Whether the session was ended. */
  ended: boolean;
  /** Branch where changes were saved, if any. */
  branch?: string;
}

// ---------------------------------------------------------------------------
// API Key Validation
// ---------------------------------------------------------------------------

/** POST /validate-key -- check if the user's API key has a pulse. */
export interface ValidateKeyRequest {
  /** The API key to validate. */
  key: string;
  /** Which provider this key is for. */
  provider: 'anthropic' | 'xai';
}

export interface ValidateKeyResponse {
  /** Whether the key is valid. */
  valid: boolean;
  /** Why it's not valid, if applicable. */
  reason?: string;
}

// ---------------------------------------------------------------------------
// Voice
// ---------------------------------------------------------------------------

/** POST /voice/token -- get an ephemeral token for Grok voice. */
export interface VoiceTokenRequest {
  /** The user's xAI API key. */
  xaiKey: string;
}

export interface VoiceTokenResponse {
  /** Ephemeral WebSocket token for Grok Voice Agent API. */
  token: string;
  /** When the token expires (unix ms). */
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// Settings (informational, not a route -- used by mobile stores)
// ---------------------------------------------------------------------------

/** User settings stored on-device. Never sent to the server in bulk. */
export interface UserSettings {
  /** Preferred voice provider. */
  voiceProvider: VoiceProvider;
  /** Default model for new sessions. */
  defaultModel: 'sonnet' | 'opus';
  /** Whether the user has completed onboarding. */
  onboardingComplete: boolean;
}
