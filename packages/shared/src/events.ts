// SSE event types. The void stares back, but at least it's typed.

/** Every flavour of event the agent can shout into the void. */
export const AgentEventType = {
  /** Agent is thinking. Unlike you before starting this at 11pm. */
  AGENT_THINKING: 'agent_thinking',
  /** Agent is reading your code. No comment. Yet. */
  AGENT_READING: 'agent_reading',
  /** Agent is writing files. Try not to interrupt. */
  AGENT_WRITING: 'agent_writing',
  /** Agent is running commands. Fingers crossed. */
  AGENT_RUNNING: 'agent_running',
  /** A file was changed. One of many. */
  FILE_CHANGED: 'file_changed',
  /** Diff update for the changed file. */
  DIFF_UPDATE: 'diff_update',
  /** Build passed. Miracles happen. */
  BUILD_SUCCESS: 'build_success',
  /** Build failed. Obviously. */
  BUILD_FAILED: 'build_failed',
  /** Live preview URL is ready from E2B. */
  PREVIEW_READY: 'preview_ready',
  /** Agent finished its work. Somehow. */
  AGENT_COMPLETE: 'agent_complete',
  /** Agent encountered an error. Shocking. */
  AGENT_ERROR: 'agent_error',
  /** Code pushed to GitHub successfully. */
  PUSH_COMPLETE: 'push_complete',
  /** Push failed. Check your token. */
  PUSH_FAILED: 'push_failed',
  /** Session timed out. User ghosted us. */
  SESSION_TIMEOUT: 'session_timeout',
  /** Voice response text for TTS. */
  VOICE_RESPONSE: 'voice_response',
  /** Rate limited. Waiting it out. Use the time to reflect. */
  RATE_LIMITED: 'rate_limited',
  /** Rate limit cleared. Back to business. */
  RATE_LIMIT_CLEARED: 'rate_limit_cleared',
} as const;

export type AgentEventType = (typeof AgentEventType)[keyof typeof AgentEventType];

/** Data payload for FILE_CHANGED events. */
export interface FileChangedData {
  /** Relative path within the project. */
  filePath: string;
  /** What happened to it. */
  action: 'created' | 'modified' | 'deleted';
}

/** Data payload for DIFF_UPDATE events. */
export interface DiffUpdateData {
  /** Relative path within the project. */
  filePath: string;
  /** Unified diff string. */
  diff: string;
}

/** Data payload for BUILD_SUCCESS / BUILD_FAILED events. */
export interface BuildResultData {
  /** The command that was run. */
  command: string;
  /** Exit code. 0 is enlightenment, anything else is grief. */
  exitCode: number;
  /** Stdout/stderr output. */
  output: string;
}

/** Data payload for PREVIEW_READY events. */
export interface PreviewReadyData {
  /** The URL to the running app in E2B. */
  url: string;
}

/** Data payload for AGENT_ERROR events. */
export interface AgentErrorData {
  /** Machine-readable error code. */
  code: string;
  /** What went wrong, in human terms. */
  message: string;
}

/** Data payload for PUSH_COMPLETE events. */
export interface PushCompleteData {
  /** Branch name that was pushed. */
  branch: string;
  /** Full URL to the branch or PR. */
  url: string;
}

/** Data payload for VOICE_RESPONSE events. */
export interface VoiceResponseData {
  /** The text to send to TTS. */
  text: string;
}

/** Data payload for RATE_LIMITED events. */
export interface RateLimitedData {
  /** How many ms remain until the rate limit clears. */
  remainingMs: number;
  /** The original retry-after duration in ms. */
  retryAfterMs: number;
}

/** Data payload for RATE_LIMIT_CLEARED events. */
export interface RateLimitClearedData {
  /** How long the sentence lasted, in ms. */
  durationMs: number;
}

/**
 * A single event from the agent, streamed via SSE.
 * Each one is a dispatch from the front lines of whatever
 * the agent is doing to your codebase.
 */
export interface AgentEvent {
  /** Unique event ID for SSE replay. */
  id: string;
  /** What kind of event this is. */
  type: AgentEventType;
  /** Unix timestamp (ms). */
  timestamp: number;
  /** Event-specific payload. Shape depends on type. */
  data:
    | FileChangedData
    | DiffUpdateData
    | BuildResultData
    | PreviewReadyData
    | AgentErrorData
    | PushCompleteData
    | VoiceResponseData
    | RateLimitedData
    | RateLimitClearedData
    | Record<string, unknown>;
}
