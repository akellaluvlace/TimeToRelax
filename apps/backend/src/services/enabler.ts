// The agent session orchestrator. It enables your worst habits.
// Manages the full lifecycle: spawn, instruct, stream, resume, terminate.
// The real Claude Agent SDK wiring will happen when the package ships.
// Until then, we have a pluggable factory and a mock that pretends to work.
//
// If you're reading this on GitHub: this is the file that lets you
// code on a bus. You're welcome. And we're sorry.

import { randomUUID } from 'node:crypto';

import { type SessionState, SessionPhase, AgentEventType } from '@timetorelax/shared';

import { openChapter } from './dear-diary.js';
import { screamIntoTheVoid, sealTheVoid } from './the-void.js';
import { craftDisapproval } from './denial-engine.js';
import {
  remember,
  recall,
  forget,
  touch,
  countByUser,
  setOnExpired,
  SHAME_THRESHOLD,
} from './regret-tracker.js';
import { buildSandcastle, destroySandcastle, bringYourOwnMess } from './grass-toucher.js';

const log = openChapter('enabler');

// The agent sometimes decides it needs to rewrite the entire project.
// maxTurns prevents bankruptcy. Ask me how I found this number.
const HOW_LONG_UNTIL_WE_WORRY = 50;

// Anthropic API keys start with this. If yours doesn't, you have problems.
const KEY_PREFIX = 'sk-ant-';

// ---------------------------------------------------------------------------
// Types for the Agent SDK abstraction layer
// ---------------------------------------------------------------------------

/** A single event from the Agent SDK. Shape will evolve with the real SDK. */
interface AgentSdkEvent {
  type: string;
  data?: Record<string, unknown>;
}

/** An Agent SDK session handle. Wraps whatever the real SDK exposes. */
interface AgentSdkSession {
  id: string;
  send: (instruction: string) => AsyncGenerator<AgentSdkEvent>;
  close: () => Promise<void>;
}

/**
 * Factory function that creates an Agent SDK session.
 * Swappable for testing and for when the real SDK ships.
 */
type SessionFactory = (config: {
  anthropicKey: string;
  model: string;
  maxTurns: number;
}) => Promise<AgentSdkSession>;

/** Configuration for spawning a new session of regret. */
interface EnablerConfig {
  anthropicKey: string;
  model?: 'sonnet' | 'opus';
  repoUrl?: string;
  projectName?: string;
  /** E2B sandbox template key (e.g. 'node', 'nextjs') or raw template ID. */
  template?: string;
}

// ---------------------------------------------------------------------------
// SDK session registry (separate from regret-tracker's SessionState tracking)
// ---------------------------------------------------------------------------

// Maps sessionId -> AgentSdkSession so we can send instructions
// and close sessions later. Separate from regret-tracker because
// the SDK session is an implementation detail, not a state concern.
const sdkSessions = new Map<string, AgentSdkSession>();

// ---------------------------------------------------------------------------
// Default mock factory (until the real Agent SDK ships)
// ---------------------------------------------------------------------------

/**
 * A mock session factory that pretends to be the Claude Agent SDK.
 * Returns a session that yields a predictable sequence of events.
 * Good enough for integration testing. Not good enough for production.
 * But then, what is?
 */
async function mockSessionFactory(config: {
  anthropicKey: string;
  model: string;
  maxTurns: number;
}): Promise<AgentSdkSession> {
  const sessionId = randomUUID();

  log.info(
    { sessionId, model: config.model, maxTurns: config.maxTurns },
    'mock SDK session created. the real SDK will be more impressive. probably.',
  );

  return {
    id: sessionId,
    send: async function* (_instruction: string): AsyncGenerator<AgentSdkEvent> {
      // Simulate a realistic sequence: think -> read -> write -> complete
      yield { type: 'agent_thinking', data: { message: 'Processing your request.' } };
      yield { type: 'agent_reading', data: { file: 'src/app.ts' } };
      yield {
        type: 'agent_writing',
        data: { file: 'src/app.ts', changes: 'mock changes' },
      };
      yield { type: 'agent_complete', data: { filesChanged: 1 } };
    },
    close: async () => {
      log.debug({ sessionId }, 'mock SDK session closed.');
    },
  };
}

// The pluggable factory. Starts as mock, gets replaced when the real SDK arrives.
let sessionFactory: SessionFactory = mockSessionFactory;

// ---------------------------------------------------------------------------
// Wire up the regret-tracker expiration callback
// ---------------------------------------------------------------------------

// When a session expires from inactivity, we need to clean up the SDK
// session, destroy the sandbox, and seal the void. This callback handles that.
setOnExpired((sessionId: string, session?: SessionState) => {
  log.info({ sessionId }, 'session expired. cleaning up the wreckage.');

  // Scream the timeout into the void so any connected clients know
  screamIntoTheVoid(sessionId, {
    type: AgentEventType.SESSION_TIMEOUT,
    data: { message: craftDisapproval('session_timeout') },
  });

  // Close the SDK session if it exists
  const sdkSession = sdkSessions.get(sessionId);
  if (sdkSession) {
    sdkSession.close().catch((err: unknown) => {
      log.error({ sessionId, err }, 'failed to close SDK session on expiry. adding to the tab.');
    });
    sdkSessions.delete(sessionId);
  }

  // Destroy the sandbox if the session had one. No orphaned VMs.
  if (session?.sandboxId) {
    destroySandcastle(session.sandboxId).catch((err: unknown) => {
      log.error({ sessionId, sandboxId: session.sandboxId, err }, 'failed to destroy sandbox on expiry. $4.20 lesson incoming.');
    });
  }

  // Seal the void after a brief moment so the timeout event has time to send
  sealTheVoid(sessionId);
});

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Spawns a new agent session. This is where the bad decisions begin.
 * Validates the API key, checks concurrency limits, creates the SDK session,
 * and fires a personality response into the void.
 *
 * @param userId - Who is responsible for this
 * @param config - API key, model choice, and optional repo context
 * @returns The initial session state, fresh and full of potential
 * @throws If the API key format is invalid
 * @throws If the user has too many concurrent sessions
 * @throws If the SDK session creation fails
 */
async function spawnRegret(userId: string, config: EnablerConfig): Promise<SessionState> {
  // Validate the key format before we do anything expensive.
  // The real validation (does it have credits?) happens when the SDK tries to use it.
  if (!config.anthropicKey.startsWith(KEY_PREFIX)) {
    log.warn({ userId }, 'invalid API key format. not even close.');
    throw new Error(
      'That API key does not look right. Anthropic keys start with "sk-ant-". Check your clipboard.',
    );
  }

  // Check concurrency before creating anything
  const activeCount = countByUser(userId);
  if (activeCount >= SHAME_THRESHOLD) {
    log.warn({ userId, activeCount }, 'user hit the session limit. an intervention is needed.');
    throw new Error(
      `You already have ${activeCount} active sessions. We admire the ambition, but no.`,
    );
  }

  const model = config.model ?? 'sonnet';

  // Create the SDK session via the pluggable factory
  const sdkSession = await sessionFactory({
    anthropicKey: config.anthropicKey,
    model,
    maxTurns: HOW_LONG_UNTIL_WE_WORRY,
  });

  // If a template is provided, build a sandbox for the session.
  // If a repoUrl is also provided, clone it into the sandbox.
  // This is where the cloud infrastructure bill starts.
  let sandboxId: string | undefined;
  if (config.template) {
    try {
      const sandboxInfo = await buildSandcastle(config.template);
      sandboxId = sandboxInfo.sandboxId;
      log.info({ sandboxId, template: config.template }, 'sandbox attached to session.');

      if (config.repoUrl) {
        await bringYourOwnMess(sandboxId, config.repoUrl);
        log.info({ sandboxId, repoUrl: config.repoUrl }, 'repo cloned into sandbox.');
      }
    } catch (err: unknown) {
      log.error({ err, template: config.template }, 'sandbox creation failed. session continues without one.');
      // Don't block session creation if sandbox fails.
      // The session can still work without a sandbox (for now).
    }
  }

  const now = Date.now();
  const sessionId = randomUUID();

  const state: SessionState = {
    id: sessionId,
    phase: SessionPhase.DENIAL,
    userId,
    repoUrl: config.repoUrl,
    sandboxId,
    createdAt: now,
    lastActivityAt: now,
    filesChanged: 0,
    turnsUsed: 0,
  };

  // Store the SDK session handle
  sdkSessions.set(sessionId, sdkSession);

  // Store the session state in regret-tracker (starts TTL timer)
  remember(userId, state);

  // Announce the session to any connected SSE clients
  screamIntoTheVoid(sessionId, {
    type: AgentEventType.VOICE_RESPONSE,
    data: { text: craftDisapproval('session_start') },
  });

  log.info(
    { sessionId, userId, model, repoUrl: config.repoUrl },
    'session spawned. another one bites the dust.',
  );

  return state;
}

/**
 * Sends a voice instruction to the agent and streams back the results
 * of what will almost certainly be a questionable architectural decision.
 * Events are screamed into the void (SSE) as they arrive.
 *
 * @param sessionId - The session we are slowly destroying
 * @param instruction - What the user mumbled into their phone on the bus
 * @throws If the session is not found
 * @throws If the SDK session is missing (should never happen, but here we are)
 */
async function unleash(sessionId: string, instruction: string): Promise<void> {
  const tracked = recall(sessionId);
  if (!tracked) {
    log.warn({ sessionId }, 'tried to unleash on a session that does not exist.');
    throw new Error('Session not found. It may have expired, or it never existed. Both are common.');
  }

  const sdkSession = sdkSessions.get(sessionId);
  if (!sdkSession) {
    log.error({ sessionId }, 'session exists in regret-tracker but not in SDK sessions. this is a bug.');
    throw new Error('SDK session is missing. This should not happen. File a bug. Or do not. We know.');
  }

  // Reset the inactivity timer. The user is apparently still at it.
  touch(sessionId);

  // Update phase to working
  tracked.session.phase = SessionPhase.BARGAINING;
  tracked.session.lastActivityAt = Date.now();

  log.info({ sessionId, instruction: instruction.slice(0, 100) }, 'unleashing instruction.');

  let turnsThisRound = 0;

  try {
    const events = sdkSession.send(instruction);

    for await (const sdkEvent of events) {
      turnsThisRound += 1;
      tracked.session.turnsUsed += 1;

      // Safety valve: stop before we bankrupt the user
      if (tracked.session.turnsUsed >= HOW_LONG_UNTIL_WE_WORRY) {
        log.warn(
          { sessionId, turnsUsed: tracked.session.turnsUsed },
          'turn limit reached. cutting off the agent before it rewrites the universe.',
        );

        screamIntoTheVoid(sessionId, {
          type: AgentEventType.AGENT_ERROR,
          data: {
            code: 'agent_runaway',
            message: `Hit ${HOW_LONG_UNTIL_WE_WORRY} turns. Stopping before your API bill does.`,
          },
        });

        break;
      }

      // Map SDK events to our event types and scream them into the void
      const mappedType = mapSdkEventType(sdkEvent.type);
      screamIntoTheVoid(sessionId, {
        type: mappedType,
        data: sdkEvent.data ?? {},
      });

      // Track file changes for the summary
      if (sdkEvent.type === 'file_changed' || sdkEvent.type === 'agent_writing') {
        tracked.session.filesChanged += 1;
      }
    }

    // Instruction complete. Back to idle (denial, because we are at peace).
    tracked.session.phase = SessionPhase.DENIAL;
    tracked.session.lastActivityAt = Date.now();

    log.info(
      { sessionId, turnsThisRound, totalTurns: tracked.session.turnsUsed },
      'instruction complete. somehow.',
    );
  } catch (err: unknown) {
    tracked.session.phase = SessionPhase.GRIEF;
    tracked.session.lastActivityAt = Date.now();

    const message = err instanceof Error ? err.message : 'Unknown error. The universe is vague.';

    log.error({ sessionId, err }, 'agent threw during unleash. grief phase activated.');

    screamIntoTheVoid(sessionId, {
      type: AgentEventType.AGENT_ERROR,
      data: {
        code: 'agent_error',
        message,
      },
    });
  }
}

/**
 * Returns the current state of a session. Like checking the damage
 * after letting a toddler loose in a kitchen.
 *
 * @param sessionId - The session to inspect
 * @returns The session state if found, undefined if the session is gone
 */
function assessDamage(sessionId: string): SessionState | undefined {
  const tracked = recall(sessionId);
  return tracked?.session;
}

/**
 * Resumes a session that still exists. Back for more punishment.
 * The session must still be in the regret-tracker (not expired).
 *
 * @param sessionId - The session to resume
 * @returns The current session state
 * @throws If the session is not found (expired or never existed)
 */
async function welcomeBackYouAddict(sessionId: string): Promise<SessionState> {
  const tracked = recall(sessionId);
  if (!tracked) {
    throw new Error('Session not found. It expired while you were away. We saved nothing. Just kidding, we tried.');
  }

  // Reset the inactivity timer
  touch(sessionId);
  tracked.session.lastActivityAt = Date.now();

  // Send a personality response for the reconnection
  screamIntoTheVoid(sessionId, {
    type: AgentEventType.VOICE_RESPONSE,
    data: { text: craftDisapproval('session_resume') },
  });

  log.info({ sessionId, userId: tracked.userId }, 'user returned. the addiction continues.');

  return tracked.session;
}

/**
 * Terminates a session. Cleans up the SDK session, seals the SSE void,
 * and removes the session from the regret-tracker. The session is over.
 * The code is on a branch somewhere. Probably.
 *
 * @param sessionId - The session to terminate
 * @throws If the session is not found
 */
async function releaseYouFromYourself(sessionId: string): Promise<void> {
  const tracked = recall(sessionId);
  if (!tracked) {
    log.debug({ sessionId }, 'tried to release a session that does not exist. freedom was already yours.');
    throw new Error('Session not found. Already gone. Like your motivation at 2am.');
  }

  log.info({ sessionId, userId: tracked.userId }, 'releasing session. goodbye cruel code.');

  // Close the SDK session
  const sdkSession = sdkSessions.get(sessionId);
  if (sdkSession) {
    try {
      await sdkSession.close();
    } catch (err: unknown) {
      log.error({ sessionId, err }, 'SDK session close failed. we tried.');
    }
    sdkSessions.delete(sessionId);
  }

  // Destroy the sandbox if one was attached. Don't rely on TTL.
  // This is how we avoid $4.20 lessons.
  if (tracked.session.sandboxId) {
    await destroySandcastle(tracked.session.sandboxId);
  }

  // Seal the void (closes all SSE connections, clears buffer)
  sealTheVoid(sessionId);

  // Remove from the regret-tracker (clears TTL timer)
  forget(sessionId);

  log.info({ sessionId }, 'session fully released. it is done.');
}

/**
 * Injects a custom session factory. Used for testing and for swapping
 * in the real Claude Agent SDK when it ships. Dependency injection,
 * but make it cynical.
 *
 * @param factory - The factory function that creates Agent SDK sessions
 */
function setSessionFactory(factory: SessionFactory): void {
  sessionFactory = factory;
  log.info('session factory replaced. new management.');
}

/**
 * Resets the session factory to the default mock.
 * Mostly for tests that need to clean up after themselves.
 * Unlike the users of this app.
 */
function resetSessionFactory(): void {
  sessionFactory = mockSessionFactory;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Maps an Agent SDK event type string to our AgentEventType.
 * Unknown types get mapped to AGENT_THINKING because
 * when in doubt, the agent is thinking. Allegedly.
 */
function mapSdkEventType(sdkType: string): AgentEventType {
  const typeMap: Record<string, AgentEventType> = {
    agent_thinking: AgentEventType.AGENT_THINKING,
    agent_reading: AgentEventType.AGENT_READING,
    agent_writing: AgentEventType.AGENT_WRITING,
    agent_running: AgentEventType.AGENT_RUNNING,
    agent_complete: AgentEventType.AGENT_COMPLETE,
    agent_error: AgentEventType.AGENT_ERROR,
    file_changed: AgentEventType.FILE_CHANGED,
    diff_update: AgentEventType.DIFF_UPDATE,
    build_success: AgentEventType.BUILD_SUCCESS,
    build_failed: AgentEventType.BUILD_FAILED,
    preview_ready: AgentEventType.PREVIEW_READY,
  };

  return typeMap[sdkType] ?? AgentEventType.AGENT_THINKING;
}

export {
  spawnRegret,
  unleash,
  assessDamage,
  welcomeBackYouAddict,
  releaseYouFromYourself,
  setSessionFactory,
  resetSessionFactory,
  HOW_LONG_UNTIL_WE_WORRY,
};

export type { EnablerConfig, AgentSdkSession, AgentSdkEvent, SessionFactory };
