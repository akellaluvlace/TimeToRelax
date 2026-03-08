// The E2B sandbox lifecycle manager. Named "grass-toucher" because
// E2B sandboxes are cloud environments -- the closest thing to
// touching grass that a developer on a bus will ever experience.
//
// Manages the full lifecycle: create, execute, preview, destroy.
// Each sandbox is a Firecracker microVM with ~150ms cold start.
// We track them in a Map so we can kill them explicitly on session end.
// Relying on TTL alone is how you wake up to a $4.20 bill and a life lesson.
//
// If you're reading this on GitHub: go outside.

import { Sandbox } from 'e2b';

import { openChapter } from './dear-diary.js';
import { SANDBOX_TEMPLATES } from './sandbox-templates.js';
import type { SandboxTemplate } from './sandbox-templates.js';

const log = openChapter('grass-toucher');

// Per CLAUDE.md and spec: 15 minutes, then we pull the plug.
// This number was discovered empirically by leaving a sandbox running overnight.
// Cost: $4.20. Lesson: priceless.
const MAX_REGRET_DURATION_MS = 900_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** What we know about a sandbox that's out there, living its best life. */
interface SandboxInfo {
  sandboxId: string;
  previewUrl: string | null;
  templateId: string;
}

/** The result of running a command in a sandbox. Exit code 0 means hope. */
interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * The shape of a sandbox instance we track internally.
 * The real E2B Sandbox has way more surface area, but we only need these parts.
 */
interface SandboxHandle {
  id: string;
  getHost: (port: number) => string;
  commands: {
    run: (cmd: string) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
  };
  kill: () => Promise<void>;
}

/**
 * Factory function that creates a sandbox. Swappable so tests don't need
 * real E2B credentials or Firecracker VMs running on CI.
 */
type SandboxFactory = (config: {
  templateId: string;
  timeoutMs: number;
  apiKey: string;
}) => Promise<SandboxHandle>;

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

/** The sandbox registry. Every sandbox we've built and haven't destroyed yet. */
const theSandbox = new Map<string, { sandbox: SandboxHandle; info: SandboxInfo }>();

/**
 * The default factory that talks to the real E2B API.
 * Creates a Firecracker microVM, sets the timeout, returns a handle.
 * Only used in production. Tests inject their own via setSandboxFactory.
 */
async function realSandboxFactory(config: {
  templateId: string;
  timeoutMs: number;
  apiKey: string;
}): Promise<SandboxHandle> {
  const sandbox = await Sandbox.create(config.templateId, {
    timeoutMs: config.timeoutMs,
    apiKey: config.apiKey,
  });

  return {
    id: sandbox.sandboxId,
    getHost: (port: number) => sandbox.getHost(port),
    commands: {
      run: async (cmd: string) => {
        const result = await sandbox.commands.run(cmd);
        return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode };
      },
    },
    kill: async () => {
      await sandbox.kill();
    },
  };
}

/** The pluggable factory. Starts as real, gets replaced in tests. */
let sandboxFactory: SandboxFactory = realSandboxFactory;

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Spins up a cloud sandbox faster than your motivation dies.
 * Uses E2B Firecracker microVMs for isolated execution.
 * ~150ms cold start. Warm templates are near-instant.
 * The sandbox self-destructs after 15 minutes because we learn from our mistakes.
 *
 * @param templateKey - Which template to use (e.g., 'node', 'nextjs', 'express', 'fastapi'),
 *                      or a raw E2B template ID if you're feeling adventurous
 * @returns Info about the sandbox we just brought into this world
 * @throws If E2B refuses to cooperate or the API key is missing
 */
async function buildSandcastle(templateKey: string): Promise<SandboxInfo> {
  const apiKey = process.env['E2B_API_KEY'] ?? '';
  if (!apiKey) {
    throw new Error(
      'E2B_API_KEY is not set. The sandbox needs credentials. Unlike the user, it has standards.',
    );
  }

  // Resolve template key to actual template ID
  const template = SANDBOX_TEMPLATES[templateKey as SandboxTemplate];
  const templateId = template?.templateId ?? templateKey;
  const waitForPort = template?.waitForPort ?? 3000;

  log.info({ templateKey, templateId }, 'building sandcastle. this is where the magic happens.');

  const sandbox = await sandboxFactory({
    templateId,
    timeoutMs: MAX_REGRET_DURATION_MS,
    apiKey,
  });

  // Try to get a preview URL. Not all templates expose ports,
  // and not all ports have anything listening yet. That's fine.
  let previewUrl: string | null = null;
  try {
    const host = sandbox.getHost(waitForPort);
    previewUrl = `https://${host}`;
  } catch {
    log.debug({ sandboxId: sandbox.id }, 'no preview URL available. the sandbox is shy.');
  }

  const info: SandboxInfo = {
    sandboxId: sandbox.id,
    previewUrl,
    templateId,
  };

  theSandbox.set(sandbox.id, { sandbox, info });

  log.info(
    { sandboxId: sandbox.id, templateId, previewUrl },
    'sandcastle built. ~150ms well spent.',
  );

  return info;
}

/**
 * Executes a command in the sandbox and returns the result.
 * Checks exit codes because unlike the user, we have standards.
 *
 * @param sandboxId - Which sandbox to poke
 * @param command - The shell command to run
 * @returns stdout, stderr, and exit code. The holy trinity of shell output.
 * @throws If the sandbox doesn't exist in our registry
 */
async function pokeTheSandcastle(sandboxId: string, command: string): Promise<CommandResult> {
  const entry = theSandbox.get(sandboxId);
  if (!entry) {
    throw new Error(
      `Sandbox "${sandboxId}" not found. It may have been destroyed, or it never existed. Both are common.`,
    );
  }

  log.debug({ sandboxId, command: command.slice(0, 100) }, 'poking the sandcastle.');

  const result = await entry.sandbox.commands.run(command);

  if (result.exitCode !== 0) {
    log.warn(
      { sandboxId, command: command.slice(0, 100), exitCode: result.exitCode, stderr: result.stderr.slice(0, 200) },
      'command exited non-zero. it happens to the best of us.',
    );
  }

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  };
}

/**
 * Returns the live preview URL for the running app in the sandbox.
 * If the sandbox exists and has a URL, you get it. If not, null.
 * Like checking if the restaurant is still open before driving there.
 *
 * @param sandboxId - Which sandbox to check
 * @returns The preview URL or null if the sandbox is unknown or URL-less
 */
function seeWhatYouDid(sandboxId: string): string | null {
  const entry = theSandbox.get(sandboxId);
  return entry?.info.previewUrl ?? null;
}

/**
 * Destroys the sandbox. Explicitly. Don't rely on TTL alone.
 * This function exists because I once left a sandbox running overnight.
 * Cost: $4.20. Lesson: priceless.
 *
 * @param sandboxId - The sandbox to put out of its misery
 */
async function destroySandcastle(sandboxId: string): Promise<void> {
  const entry = theSandbox.get(sandboxId);
  if (!entry) {
    log.debug({ sandboxId }, 'tried to destroy a sandcastle that does not exist. freedom was already yours.');
    return;
  }

  try {
    await entry.sandbox.kill();
    log.info({ sandboxId }, 'sandcastle destroyed. rest in peace, tiny VM.');
  } catch (err: unknown) {
    // If it's already dead, we don't care. Mission accomplished either way.
    log.warn({ sandboxId, err }, 'sandcastle kill threw. it might already be dead. moving on.');
  }

  theSandbox.delete(sandboxId);
}

/**
 * Clones a repo into the sandbox. Shallow clone because we're
 * on mobile internet and every byte counts. If a token is provided,
 * it gets injected into the URL for authenticated clones.
 *
 * @param sandboxId - The sandbox to clone into
 * @param repoUrl - The repo URL (https://github.com/user/repo.git or similar)
 * @param token - Optional GitHub token for private repos
 * @returns The result of the git clone command
 * @throws If the sandbox doesn't exist
 */
async function bringYourOwnMess(
  sandboxId: string,
  repoUrl: string,
  token?: string,
): Promise<CommandResult> {
  let cloneUrl = repoUrl;

  // Inject token into URL for authenticated clones.
  // Turns https://github.com/user/repo.git into https://<token>@github.com/user/repo.git
  if (token) {
    cloneUrl = repoUrl.replace('https://', `https://${token}@`);
  }

  log.info(
    { sandboxId, repoUrl },
    'cloning repo into sandbox. shallow because bandwidth is precious.',
  );

  return pokeTheSandcastle(sandboxId, `git clone --depth 1 ${cloneUrl}`);
}

/**
 * Injects a custom sandbox factory. Used for testing so we don't need
 * real E2B credentials or Firecracker VMs running on CI.
 * Dependency injection, but make it cynical.
 *
 * @param factory - The factory function that creates sandbox handles
 */
function setSandboxFactory(factory: SandboxFactory): void {
  sandboxFactory = factory;
  log.info('sandbox factory replaced. new management.');
}

/**
 * Returns info about a tracked sandbox. Mostly for tests that need
 * to verify the internal state without going through the full API.
 *
 * @param sandboxId - The sandbox to look up
 * @returns The sandbox info if tracked, undefined if not
 */
function inspectSandcastle(sandboxId: string): SandboxInfo | undefined {
  return theSandbox.get(sandboxId)?.info;
}

/**
 * Resets the factory to the real E2B implementation and clears
 * all tracked sandboxes. For test cleanup.
 * Unlike the users of this app, tests clean up after themselves.
 */
function resetGrassToucher(): void {
  sandboxFactory = realSandboxFactory;
  theSandbox.clear();
}

export {
  buildSandcastle,
  pokeTheSandcastle,
  seeWhatYouDid,
  destroySandcastle,
  bringYourOwnMess,
  setSandboxFactory,
  inspectSandcastle,
  resetGrassToucher,
  MAX_REGRET_DURATION_MS,
};

export type { SandboxInfo, CommandResult, SandboxFactory, SandboxHandle };
