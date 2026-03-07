// Session state types for TimeToRelax.
// The grief stages naming is not a joke. Well, it is. But it's also accurate.

/** The five stages of coding on the bus. */
export const SessionPhase = {
  /** Session starting up. User hasn't accepted what they're about to do. */
  DENIAL: 'denial',
  /** Agent is working. User is negotiating with their conscience. */
  BARGAINING: 'bargaining',
  /** Reviewing diffs. User is coming to terms with the changes. */
  ACCEPTANCE: 'acceptance',
  /** Build failed. Self-explanatory. */
  GRIEF: 'grief',
  /** Build passed. Against all odds. */
  ENLIGHTENMENT: 'enlightenment',
} as const;

export type SessionPhase = (typeof SessionPhase)[keyof typeof SessionPhase];

/** Which model is burning the user's API credits today. */
export const AgentModel = {
  SONNET: 'sonnet',
  OPUS: 'opus',
} as const;

export type AgentModel = (typeof AgentModel)[keyof typeof AgentModel];

/** Configuration for spawning a new session of regret. */
export interface SessionConfig {
  /** The model to use. Sonnet unless the user enjoys large invoices. */
  model: AgentModel;
  /** Safety limit on agent turns. Ask how we found this number. */
  maxTurns: number;
  /** How long before we assume the user found something better to do (ms). */
  timeoutMs: number;
  /** GitHub repo URL, if connecting to an existing project. */
  repoUrl?: string;
  /** Subdirectory within the repo to focus on. */
  subdirectory?: string;
}

/** The current state of a session. Passed around like a hot potato. */
export interface SessionState {
  /** Unique session identifier. */
  id: string;
  /** Where we are in the grief cycle. */
  phase: SessionPhase;
  /** Who is responsible for this. */
  userId: string;
  /** The repo being modified, if any. */
  repoUrl?: string;
  /** E2B sandbox identifier. */
  sandboxId?: string;
  /** When the session was born. */
  createdAt: number;
  /** When the user last showed signs of life. */
  lastActivityAt: number;
  /** How many files have been touched. For the summary card. */
  filesChanged: number;
  /** How many agent turns have been consumed. Approaching this limit means intervention. */
  turnsUsed: number;
}
