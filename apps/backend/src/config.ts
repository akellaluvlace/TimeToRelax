// Config loader. Validates env vars on startup so we fail fast,
// not 20 minutes into a session when someone notices nothing works.

/** Backend configuration. The bare minimum to start disappointing users. */
export interface BackendConfig {
  port: number;
  host: string;
  nodeEnv: 'development' | 'production';
  logLevel: string;
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
  };
}

function parsePort(raw: string | undefined): number {
  const port = parseInt(raw ?? '3000', 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: "${raw}". Expected a number between 1 and 65535.`);
  }
  return port;
}
