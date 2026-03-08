// Existing project routes. The endpoints that let a phone on a bus
// open someone's existing repo and start "improving" it.
// Because nothing says "responsible software engineering" like
// voice-driven refactoring on public transit.

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { openChapter } from '../services/dear-diary.js';
import { spawnRegret } from '../services/enabler.js';
import { pokeTheSandcastle } from '../services/grass-toucher.js';
import { excavate } from '../services/archaeologist.js';
import { screamIntoTheVoid } from '../services/the-void.js';
import { AgentEventType } from '@timetorelax/shared';

const log = openChapter('existing-project-routes');

// ---------------------------------------------------------------------------
// Route param/body interfaces
// ---------------------------------------------------------------------------

interface ExistingProjectBody {
  anthropicKey: string;
  repoUrl: string;
  subdirectory?: string;
  model?: 'sonnet' | 'opus';
}

// ---------------------------------------------------------------------------
// JSON Schemas for request validation
// ---------------------------------------------------------------------------

const existingProjectSchema = {
  body: {
    type: 'object',
    required: ['anthropicKey', 'repoUrl'],
    properties: {
      anthropicKey: { type: 'string', minLength: 1 },
      repoUrl: { type: 'string', minLength: 1 },
      subdirectory: { type: 'string' },
      model: { type: 'string', enum: ['sonnet', 'opus'] },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
      },
      required: ['sessionId'],
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detects what kind of project this is by sniffing for dependency files.
 * Returns the install command to run, or null if the repo is a lawless wasteland.
 *
 * @param sandboxId - The sandbox to check
 * @param repoRoot - Where the repo lives in the sandbox
 * @returns The install command or null
 */
async function detectAndInstallDeps(
  sandboxId: string,
  repoRoot: string,
): Promise<string | null> {
  // Check for package.json (JS/TS ecosystem)
  const packageJsonResult = await pokeTheSandcastle(
    sandboxId,
    `test -f "${repoRoot}/package.json" && echo "yes" || echo "no"`,
  );

  if (packageJsonResult.stdout.trim() === 'yes') {
    // Check for yarn.lock, pnpm-lock.yaml, or default to npm
    const yarnResult = await pokeTheSandcastle(
      sandboxId,
      `test -f "${repoRoot}/yarn.lock" && echo "yes" || echo "no"`,
    );
    if (yarnResult.stdout.trim() === 'yes') {
      return 'yarn install';
    }

    const pnpmResult = await pokeTheSandcastle(
      sandboxId,
      `test -f "${repoRoot}/pnpm-lock.yaml" && echo "yes" || echo "no"`,
    );
    if (pnpmResult.stdout.trim() === 'yes') {
      return 'pnpm install';
    }

    return 'npm install';
  }

  // Check for requirements.txt (Python)
  const reqsResult = await pokeTheSandcastle(
    sandboxId,
    `test -f "${repoRoot}/requirements.txt" && echo "yes" || echo "no"`,
  );
  if (reqsResult.stdout.trim() === 'yes') {
    return 'pip install -r requirements.txt';
  }

  // Check for go.mod (Go)
  const goResult = await pokeTheSandcastle(
    sandboxId,
    `test -f "${repoRoot}/go.mod" && echo "yes" || echo "no"`,
  );
  if (goResult.stdout.trim() === 'yes') {
    return 'go mod download';
  }

  return null;
}

/**
 * Extracts the repo name from a URL so we know where git cloned it to.
 * Handles the standard GitHub URL format.
 *
 * @param repoUrl - The repo URL
 * @returns The repo directory name
 */
function extractRepoName(repoUrl: string): string {
  const parts = repoUrl.replace(/\.git$/, '').split('/');
  return parts[parts.length - 1] ?? 'repo';
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

/**
 * Registers the existing project route. One endpoint that does too much,
 * just like the developers who use it.
 *
 * - POST /session/existing-project - clone, install, excavate, and regret
 *
 * @param app - The Fastify instance that will carry this route
 */
export default async function existingProjectRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: ExistingProjectBody }>(
    '/session/existing-project',
    { schema: existingProjectSchema },
    async (
      request: FastifyRequest<{ Body: ExistingProjectBody }>,
      reply: FastifyReply,
    ) => {
      const userId = request.headers['x-user-id'];
      if (!userId || typeof userId !== 'string') {
        return reply.status(400).send({
          error: 'Missing x-user-id header. We need to know who to blame.',
          code: 'MISSING_USER_ID',
        });
      }

      const githubToken = request.headers['x-github-token'];
      const tokenStr = typeof githubToken === 'string' ? githubToken : undefined;

      const { anthropicKey, repoUrl, subdirectory, model } = request.body;

      try {
        // Step 1: Spawn a session with a sandbox and clone the repo
        log.info({ userId, repoUrl }, 'setting up existing project session.');

        const state = await spawnRegret(userId, {
          anthropicKey,
          model,
          repoUrl,
          template: 'node', // Default to node template for existing project setup
        });

        const sessionId = state.id;

        // If no sandbox was created, we can't proceed with repo operations
        if (!state.sandboxId) {
          log.warn({ sessionId }, 'no sandbox attached. cannot clone repo.');
          return reply.status(201).send({ sessionId });
        }

        const repoName = extractRepoName(repoUrl);
        const repoRoot = `/home/user/${repoName}`;

        // Step 2: Clone the repo (if spawnRegret didn't already via template + repoUrl)
        // spawnRegret calls bringYourOwnMess which does a shallow clone.
        // The repo should already be cloned. Emit progress.
        screamIntoTheVoid(sessionId, {
          type: AgentEventType.AGENT_READING,
          data: { message: 'Cloning repository...' },
        });

        // Step 3: Detect and install dependencies
        screamIntoTheVoid(sessionId, {
          type: AgentEventType.AGENT_READING,
          data: { message: 'Installing dependencies...' },
        });

        const installCommand = await detectAndInstallDeps(state.sandboxId, repoRoot);

        if (installCommand) {
          log.info({ sessionId, installCommand }, 'installing dependencies.');
          const installResult = await pokeTheSandcastle(
            state.sandboxId,
            `cd "${repoRoot}" && ${installCommand}`,
          );

          if (installResult.exitCode !== 0) {
            log.warn(
              { sessionId, exitCode: installResult.exitCode, stderr: installResult.stderr.slice(0, 200) },
              'dependency install exited non-zero. pressing on regardless.',
            );
          }
        } else {
          log.info({ sessionId }, 'no dependency file found. skipping install.');
        }

        // Step 4: Excavate the repo to build a manifest for agent context
        screamIntoTheVoid(sessionId, {
          type: AgentEventType.AGENT_READING,
          data: { message: 'Reading codebase...' },
        });

        try {
          const manifest = await excavate(state.sandboxId, repoRoot, subdirectory);
          log.info(
            { sessionId, totalFiles: manifest.totalFiles, estimatedTokens: manifest.estimatedTokens },
            'excavation complete. the agent has context.',
          );
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Excavation failed for unknown reasons.';
          log.warn({ sessionId, err: message }, 'excavation failed. session continues without full context.');
        }

        screamIntoTheVoid(sessionId, {
          type: AgentEventType.AGENT_COMPLETE,
          data: { message: 'Ready. Your codebase has been read. No comment.' },
        });

        log.info({ sessionId, userId, repoUrl }, 'existing project session ready.');

        return reply.status(201).send({ sessionId });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Existing project setup failed. The universe said no.';
        log.error({ userId, repoUrl, err }, 'existing project session creation failed');

        return reply.status(400).send({
          error: message,
          code: 'EXISTING_PROJECT_FAILED',
        });
      }
    },
  );
}
