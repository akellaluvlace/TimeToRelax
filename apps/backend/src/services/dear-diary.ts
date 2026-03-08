// The backend's structured logger. Every service gets a chapter.
// We use pino because it's fast, JSON-native, and doesn't judge.
// Unlike us. We judge constantly.
//
// If you're reading this on GitHub: yes, we named our logger "dear diary."
// No, we will not be taking feedback on this.

import pino, { type Logger } from 'pino';

/**
 * Spawns the root diary instance. Called once at startup.
 * Pretty-prints in development because developers deserve nice things.
 * Structured JSON in production because machines deserve nothing.
 *
 * @param level - Log level override. Defaults to LOG_LEVEL env or 'info'.
 * @returns A pino logger that records everything you'll deny later
 */
function spawnDiary(level?: string): Logger {
  const resolvedLevel = level ?? process.env['LOG_LEVEL'] ?? 'info';
  const isDev = process.env['NODE_ENV'] !== 'production';

  return pino({
    level: resolvedLevel,
    // Pretty colours in dev, cold JSON in prod.
    // Just like our emotional range.
    ...(isDev && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    }),
  });
}

/**
 * The root logger. Born at import time. Dies at process exit.
 * Everything flows through this. If this breaks, start praying.
 */
const diary: Logger = spawnDiary();

/**
 * Creates a child logger with a `service` field baked into every line.
 * Use this instead of the root diary so we can tell which service
 * is responsible for the mess in the logs.
 *
 * @param service - The name of the service opening this chapter of regret
 * @returns A child logger that tattles on which service produced the log
 *
 * @example
 * ```ts
 * const log = openChapter('enabler');
 * log.info({ sessionId }, 'session spawned. another one.');
 * // => { level: 30, time: ..., service: "enabler", sessionId: "abc", msg: "session spawned. another one." }
 * ```
 */
function openChapter(service: string): Logger {
  return diary.child({ service });
}

export { diary, openChapter, spawnDiary };
export type { Logger };
