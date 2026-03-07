// Error types. A taxonomy of everything that can go wrong.
// Spoiler: everything.

/** Every way this can blow up, catalogued for your convenience. */
export const AppErrorCode = {
  /** API key is dead. Check Settings. */
  KEY_INVALID: 'key_invalid',
  /** API key expired. Time to rotate. */
  KEY_EXPIRED: 'key_expired',
  /** Rate limited. Use the time to question your choices. */
  RATE_LIMITED: 'rate_limited',
  /** E2B sandbox crashed. Restarting. This is fine. */
  SANDBOX_CRASH: 'sandbox_crash',
  /** Sandbox timed out. 15 minutes of neglect. */
  SANDBOX_TIMEOUT: 'sandbox_timeout',
  /** Agent SDK threw an error. */
  AGENT_ERROR: 'agent_error',
  /** Agent hit maxTurns. Bankruptcy averted. */
  AGENT_RUNAWAY: 'agent_runaway',
  /** Network connection lost. */
  NETWORK_LOST: 'network_lost',
  /** Repo is too large to clone in a reasonable time. */
  REPO_TOO_LARGE: 'repo_too_large',
  /** Repo not found. Check the URL. */
  REPO_NOT_FOUND: 'repo_not_found',
  /** Authentication failed. */
  AUTH_FAILED: 'auth_failed',
  /** Session expired. Changes were saved to a branch. */
  SESSION_EXPIRED: 'session_expired',
} as const;

export type AppErrorCode = (typeof AppErrorCode)[keyof typeof AppErrorCode];

/**
 * Structured error used internally.
 * Extends Error so it plays nice with try/catch,
 * but carries a machine-readable code for the frontend.
 */
export interface AppError {
  /** Human-readable message. Personality-infused on the backend. */
  message: string;
  /** Machine-readable error code for programmatic handling. */
  code: AppErrorCode;
  /** Optional debug context. Included in dev, stripped in prod. */
  details?: unknown;
}

/**
 * The shape of every error response from the API.
 * Consistent. Predictable. Unlike the rest of software development.
 */
export interface ErrorResponse {
  /** Human-readable error description. */
  error: string;
  /** Machine-readable error code. */
  code: AppErrorCode;
  /** Debug info. Present in development, absent in production. */
  details?: unknown;
}
