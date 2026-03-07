// Personality types. The system behind the cynicism.

/** Agent states that trigger a personality response. */
export const PersonalityState = {
  SESSION_START: 'session_start',
  SESSION_TIMEOUT: 'session_timeout',
  SESSION_RESUME: 'session_resume',
  AGENT_THINKING: 'agent_thinking',
  AGENT_READING: 'agent_reading',
  AGENT_WRITING: 'agent_writing',
  AGENT_RUNNING: 'agent_running',
  BUILD_SUCCESS: 'build_success',
  BUILD_FAILED: 'build_failed',
  FILES_CHANGED: 'files_changed',
  PUSH_COMPLETE: 'push_complete',
  PUSH_FAILED: 'push_failed',
  KEY_INVALID: 'key_invalid',
  RATE_LIMITED: 'rate_limited',
  SANDBOX_CRASH: 'sandbox_crash',
  NETWORK_LOST: 'network_lost',
} as const;

export type PersonalityState = (typeof PersonalityState)[keyof typeof PersonalityState];

/**
 * A pre-written template for a personality state.
 * Each state should have at least 2 options so the app
 * doesn't sound like a broken record. Although broken records
 * have their charm.
 */
export interface PersonalityTemplate {
  /** Which state this template is for. */
  state: PersonalityState;
  /** The text to speak. Keep under ~200 chars (~15sec audio). */
  text: string;
  /** Optional placeholders in the text (e.g., "{n}" for file count). */
  placeholders?: string[];
}

/**
 * Whether a personality response was generated from a template
 * or dynamically by Haiku. Templates are fast. Haiku is clever.
 * Both are judgmental.
 */
export const PersonalitySource = {
  /** Pre-written template. ~0ms generation, ~200ms TTS. */
  TEMPLATE: 'template',
  /** Claude Haiku dynamic generation. ~300-500ms generation, ~200ms TTS. */
  HAIKU: 'haiku',
} as const;

export type PersonalitySource = (typeof PersonalitySource)[keyof typeof PersonalitySource];

/** A generated personality response, ready for TTS. */
export interface PersonalityResponse {
  /** The text to speak. */
  text: string;
  /** How it was generated. */
  source: PersonalitySource;
  /** Which state triggered it. */
  state: PersonalityState;
}
