// confessional.ts -- The mobile logging system.
// Think of it as a confession booth for your app's sins.
// In production, debug-level confessions are sealed. Only warnings and errors escape.

/** Structured context attached to every log entry from a booth. */
interface ConfessionContext {
  service: string;
  [key: string]: unknown;
}

/** The interface for a confession booth. Each service gets one. */
interface MobileLogger {
  /** Something worth knowing, but not worth panicking about. */
  debug: (message: string, extra?: Record<string, unknown>) => void;
  /** A fact. Neither good nor bad. Just a fact. */
  info: (message: string, extra?: Record<string, unknown>) => void;
  /** A yellow flag. Not red yet. But yellow. */
  warn: (message: string, extra?: Record<string, unknown>) => void;
  /** Something broke. This is the red flag. */
  error: (message: string, extra?: Record<string, unknown>) => void;
}

/**
 * Formats a log entry into structured JSON-ish output.
 * Keeps logs parseable while the file names stay unhinged.
 *
 * @param level - Severity level
 * @param context - Which service is confessing
 * @param message - What they have to say for themselves
 * @param extra - Optional additional context for the curious
 */
function formatConfession(
  level: string,
  context: ConfessionContext,
  message: string,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    level,
    service: context.service,
    message,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

/**
 * Opens a confession booth for a specific service.
 * Each service gets its own booth so you can trace which part
 * of the app is responsible for which disaster.
 *
 * Debug logs are stripped in production because some things
 * are better left unsaid in front of the users.
 *
 * @param service - The name of the service opening the booth (e.g., 'useVoice', 'session-store')
 * @returns A MobileLogger with debug, info, warn, and error methods
 */
export function openBooth(service: string): MobileLogger {
  const context: ConfessionContext = { service };

  return {
    debug: (message: string, extra?: Record<string, unknown>): void => {
      // In production, debug confessions are sealed. What happens in dev stays in dev.
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.debug(JSON.stringify(formatConfession('debug', context, message, extra)));
      }
    },
    info: (message: string, extra?: Record<string, unknown>): void => {
      // eslint-disable-next-line no-console
      console.info(JSON.stringify(formatConfession('info', context, message, extra)));
    },
    warn: (message: string, extra?: Record<string, unknown>): void => {
      // eslint-disable-next-line no-console
      console.warn(JSON.stringify(formatConfession('warn', context, message, extra)));
    },
    error: (message: string, extra?: Record<string, unknown>): void => {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(formatConfession('error', context, message, extra)));
    },
  };
}
