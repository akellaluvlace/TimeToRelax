// New Project routes. The endpoint that turns a vague idea mumbled on the bus
// into a fully scaffolded project running in a sandbox.
// One POST request between "I want a Next.js app" and "what have I done."
//
// If you're reading this on GitHub: yes, stack detection is powered by
// string matching. Yes, it works surprisingly well. Don't overthink it.

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { openChapter } from '../services/dear-diary.js';
import { spawnRegret, unleash } from '../services/enabler.js';

const log = openChapter('new-project-routes');

// ---------------------------------------------------------------------------
// Route body/header interfaces
// ---------------------------------------------------------------------------

interface NewProjectBody {
  anthropicKey: string;
  transcript: string;
  stack?: string;
  model?: 'sonnet' | 'opus';
}

// ---------------------------------------------------------------------------
// Stack detection -- turns a rambling voice transcript into a template key
// ---------------------------------------------------------------------------

/** The stacks we can detect from a transcript. Expand as needed. */
const DETECTABLE_STACKS = {
  nextjs: 'nextjs',
  express: 'express',
  fastapi: 'fastapi',
  node: 'node',
} as const;

type DetectedStack = (typeof DETECTABLE_STACKS)[keyof typeof DETECTABLE_STACKS];

/**
 * Figures out what the user wants from their incoherent bus-mumble.
 * Scans the transcript for technology keywords and makes assumptions.
 * Like a recruiter reading your LinkedIn, but more accurate.
 *
 * @param transcript - What the user said, transcribed from voice
 * @returns The detected stack template key
 */
function sniffOutTheStack(transcript: string): DetectedStack {
  const lower = transcript.toLowerCase();

  // Order matters: check more specific patterns first
  if (lower.includes('next') || lower.includes('react')) {
    return DETECTABLE_STACKS.nextjs;
  }
  if (lower.includes('express')) {
    return DETECTABLE_STACKS.express;
  }
  if (lower.includes('fastapi') || lower.includes('python') || lower.includes('django') || lower.includes('flask')) {
    return DETECTABLE_STACKS.fastapi;
  }

  // Default to node because JavaScript is the cockroach of programming languages.
  // It survives everything.
  return DETECTABLE_STACKS.node;
}

/**
 * Constructs the scaffold instruction for the agent.
 * This is the prompt that turns a vague idea into a project structure.
 * Keep it specific enough to be useful, vague enough to let the agent be creative.
 *
 * @param stack - The detected or explicitly chosen stack
 * @param transcript - The user's original brief
 * @returns An instruction string for the agent
 */
function assembleMarching0rders(stack: DetectedStack, transcript: string): string {
  return `Scaffold a ${stack} project based on this brief: ${transcript}. Set up the project structure, install dependencies, and start the dev server.`;
}

// ---------------------------------------------------------------------------
// JSON Schema for request validation
// ---------------------------------------------------------------------------

const newProjectSchema = {
  body: {
    type: 'object',
    required: ['anthropicKey', 'transcript'],
    properties: {
      anthropicKey: { type: 'string', minLength: 1 },
      transcript: { type: 'string', minLength: 1 },
      stack: { type: 'string' },
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
// Route registration
// ---------------------------------------------------------------------------

/**
 * Registers the new project route. One endpoint that turns a voice brief
 * into a scaffolded project running in a cloud sandbox.
 * The closest thing to magic that runs on a bus.
 *
 * - POST /session/new-project - from vague idea to scaffolded project
 *
 * @param app - The Fastify instance that carries this route
 */
export default async function newProjectRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: NewProjectBody }>(
    '/session/new-project',
    { schema: newProjectSchema },
    async (
      request: FastifyRequest<{ Body: NewProjectBody }>,
      reply: FastifyReply,
    ) => {
      const userId = request.headers['x-user-id'];
      if (!userId || typeof userId !== 'string') {
        return reply.status(400).send({
          error: 'Missing x-user-id header. We need to know who to blame for this project.',
          code: 'MISSING_USER_ID',
        });
      }

      const { anthropicKey, transcript, stack: explicitStack, model } = request.body;

      // Detect the stack from transcript, unless the user was explicit about it.
      // Explicit wins because we respect decisiveness, even on a bus.
      const detectedStack = explicitStack
        ? (explicitStack as DetectedStack)
        : sniffOutTheStack(transcript);

      log.info(
        { userId, detectedStack, explicitStack: explicitStack ?? null, transcriptLength: transcript.length },
        'new project request received. the bus ride begins.',
      );

      try {
        const state = await spawnRegret(userId, {
          anthropicKey,
          model,
          template: detectedStack,
        });

        const scaffoldInstruction = assembleMarching0rders(detectedStack, transcript);

        // Fire and forget. The real events come through SSE.
        // We don't await unleash because it streams events asynchronously.
        void unleash(state.id, scaffoldInstruction);

        log.info(
          { sessionId: state.id, userId, stack: detectedStack },
          'new project session spawned and instruction unleashed.',
        );

        return reply.status(201).send({
          sessionId: state.id,
        });
      } catch (err: unknown) {
        const message = err instanceof Error
          ? err.message
          : 'New project creation failed. The universe vetoed your idea.';

        log.error({ userId, err }, 'new project creation failed');

        return reply.status(400).send({
          error: message,
          code: 'NEW_PROJECT_FAILED',
        });
      }
    },
  );
}

// Exported for testing. The public API is the route registration.
export { sniffOutTheStack, assembleMarching0rders, DETECTABLE_STACKS };
export type { DetectedStack };
