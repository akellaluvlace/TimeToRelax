// Error handler. Every error gets caught here on the way out.
// We dress it up in structured JSON so the mobile app can
// render something useful instead of a stack trace.

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

/** Wire-format error response. Uses string for code since Fastify errors
 * have arbitrary codes, not just our AppErrorCode union. */
interface WireErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

/**
 * Catches errors and returns structured JSON responses.
 * No stack traces in production. No HTML ever.
 * Just cold, structured disappointment.
 *
 * @param error - The error that Fastify caught
 * @param request - The request that caused the mess
 * @param reply - The reply we're about to ruin
 */
export function facePalm(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const statusCode = error.statusCode ?? 500;

  const response: WireErrorResponse = {
    error: statusCode >= 500
      ? 'Something broke on our end. We are aware. Mildly.'
      : error.message,
    code: error.code ?? 'UNKNOWN',
    ...(process.env['NODE_ENV'] !== 'production' && {
      details: {
        stack: error.stack,
        validation: error.validation,
      },
    }),
  };

  request.log.error({ err: error, statusCode }, 'Request failed');

  void reply.status(statusCode).send(response);
}
