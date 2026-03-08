// Config loader. Validates env vars on startup so we fail fast,
// not 20 minutes into a session when someone notices nothing works.

/** Backend configuration. The bare minimum to start disappointing users. */
export interface BackendConfig {
  port: number;
  host: string;
  nodeEnv: 'development' | 'production';
  logLevel: string;
  /** GitHub OAuth App client ID. Optional because dev might not have one. */
  githubClientId?: string;
  /** GitHub OAuth App client secret. Optional because dev might not have one. */
  githubClientSecret?: string;
  /** Deepgram API key. Optional because dev might not have ears. */
  deepgramApiKey?: string;
  /** E2B API key for sandbox lifecycle. Optional because dev may not have one yet. */
  e2bApiKey?: string;
}

/**
 * Loads and validates environment variables.
 * If something critical is missing, this throws immediately.
 * Better to know now than during a demo.
 *
 * @returns Validated backend configuration
 * @throws If required environment variables are missing or invalid
 */
export function loadConfig(): BackendConfig {
  const nodeEnv = process.env['NODE_ENV'] === 'production' ? 'production' : 'development';

  return {
    port: parsePort(process.env['PORT']),
    host: process.env['HOST'] ?? '0.0.0.0',
    nodeEnv,
    logLevel: process.env['LOG_LEVEL'] ?? (nodeEnv === 'production' ? 'info' : 'debug'),
    githubClientId: process.env['GITHUB_CLIENT_ID'],
    githubClientSecret: process.env['GITHUB_CLIENT_SECRET'],
    deepgramApiKey: process.env['DEEPGRAM_API_KEY'],
    e2bApiKey: process.env['E2B_API_KEY'],
  };
}

function parsePort(raw: string | undefined): number {
  const port = parseInt(raw ?? '3000', 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: "${raw}". Expected a number between 1 and 65535.`);
  }
  return port;
}
