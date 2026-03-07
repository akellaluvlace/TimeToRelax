# Step 03: Backend Fastify Skeleton

**Status:** complete
**Depends on:** Step 01
**Estimated scope:** ~12 files

## Done When

`npm run dev` in `apps/backend` starts a Fastify server, `GET /health` returns `{ status: "alive", version: "0.1.0" }`, and the server shuts down cleanly.

## Tasks

- [ ] Install Fastify and core plugins: `fastify`, `@fastify/cors`, `@fastify/rate-limit`, `@fastify/sensible`
- [ ] Create `i-can-stop-anytime.ts` (app entry point)
- [ ] Create `src/app.ts` (Fastify app factory with plugin registration)
- [ ] Create `src/config.ts` (environment variable loader with validation)
- [ ] Create health check route at `GET /health`
- [ ] Create route registration pattern in `src/routes/`
- [ ] Create error handler middleware with structured JSON responses
- [ ] Create `Dockerfile` for Railway deployment
- [ ] Add `dev`, `build`, `start` scripts to package.json
- [ ] Add basic request logging (will be replaced by dear-diary.ts in step 04)
- [ ] Write test: health check returns correct response
- [ ] Write test: unknown routes return 404
- [ ] Write test: error handler returns structured JSON

## Files To Create

```
apps/backend/package.json                    # Updated with deps and scripts
apps/backend/tsconfig.json                   # Updated with paths, outDir
apps/backend/src/i-can-stop-anytime.ts       # Entry point -- starts the server
apps/backend/src/app.ts                      # Fastify app factory
apps/backend/src/config.ts                   # Env var loader + validation
apps/backend/src/routes/vital-signs.ts       # Health check route (GET /health)
apps/backend/src/middleware/face-palm.ts      # Error handler middleware
apps/backend/src/types/fastify.d.ts          # Fastify type augmentations
apps/backend/Dockerfile                      # Multi-stage Node.js build
apps/backend/__tests__/vital-signs.test.ts   # Health check tests
apps/backend/__tests__/face-palm.test.ts     # Error handler tests
```

## Key Patterns

### App Factory (src/app.ts)
```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(cors);
  await app.register(sensible);
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  // Routes
  await app.register(import('./routes/vital-signs.ts'));

  // Error handler
  app.setErrorHandler(facePalm);

  return app;
}
```

### Config (src/config.ts)
```typescript
// Validates env vars on startup, fails fast with clear messages
interface BackendConfig {
  port: number;
  host: string;
  nodeEnv: 'development' | 'production';
  logLevel: string;
  // API keys validated per-session, not on startup (except Deepgram which is ours)
}
```

### Error Response Shape
```typescript
{
  error: string;       // Human-readable, personality-infused
  code: string;        // Machine-readable AppErrorCode
  details?: unknown;   // Optional debug context (dev only)
}
```

## Acceptance Criteria

- [ ] `npm run dev` starts server on configured port
- [ ] `GET /health` returns `{ status: "alive", version: "0.1.0" }`
- [ ] Unknown routes return 404 with structured error JSON
- [ ] Thrown errors return structured JSON (not Fastify default HTML)
- [ ] CORS enabled
- [ ] Rate limiting active (100 req/min default)
- [ ] `tsc --noEmit` passes
- [ ] All tests pass
- [ ] Server shuts down cleanly on SIGTERM/SIGINT

## Notes

- The entry point is `i-can-stop-anytime.ts` because per CLAUDE.md: "the app entry point"
- Health check route file is `vital-signs.ts`, not `health.ts`
- Error handler is `face-palm.ts`, not `error-handler.ts`
- Logger setup is placeholder here; step 04 replaces it with dear-diary.ts
- Don't install Agent SDK, E2B, or Deepgram deps yet. Those come in their own steps.
- Use Fastify's `inject()` for testing, not actual HTTP requests
