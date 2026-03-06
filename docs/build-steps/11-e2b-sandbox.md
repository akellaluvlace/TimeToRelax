# Step 11: E2B Sandbox Lifecycle (grass-toucher.ts)

**Status:** not-started
**Depends on:** Step 10
**Estimated scope:** ~6 files

## Done When

Backend can spin up an E2B sandbox, run commands in it, return a live preview URL, and kill it explicitly on session end. Pre-warmed templates exist for common stacks.

## Tasks

- [ ] Install `e2b` SDK
- [ ] Create `grass-toucher.ts` -- E2B sandbox lifecycle manager
- [ ] Implement `buildSandcastle()` -- creates sandbox from template
- [ ] Implement `destroySandcastle()` -- kills sandbox explicitly
- [ ] Implement `seeWhatYouDid()` -- returns live preview URL
- [ ] Implement `runInSandbox()` -- executes command, returns stdout/stderr/exitCode
- [ ] Pre-build E2B templates: Next.js, Express, FastAPI, bare Node.js
- [ ] Configure sandbox timeout: `timeoutMs: 900_000` (15 minutes)
- [ ] Configure shallow clone for repos: `depth=1`
- [ ] Wire sandbox lifecycle to session lifecycle (session end = sandbox death)
- [ ] Write test: sandbox creation returns sandbox ID and preview URL
- [ ] Write test: command execution returns exit code and output
- [ ] Write test: sandbox destruction is called on session end
- [ ] Write test: timeout is set to 15 minutes

## Files To Create

```
apps/backend/src/services/grass-toucher.ts           # E2B sandbox lifecycle
apps/backend/src/services/sandbox-templates.ts       # Pre-warmed template configs
apps/backend/__tests__/grass-toucher.test.ts         # Sandbox lifecycle tests
```

## Implementation Design

### grass-toucher.ts
```typescript
import { Sandbox } from 'e2b';
import { openChapter } from '@/services/dear-diary';

const log = openChapter('grass-toucher');

const MAX_REGRET_DURATION_MS = 900_000;  // 15 minutes, matches session TTL

/**
 * Spins up a cloud sandbox faster than your motivation dies.
 * Uses E2B Firecracker microVMs for isolated execution.
 * ~150ms cold start. Warm templates are near-instant.
 *
 * @param templateId - Which pre-warmed template to use
 * @param apiKey - E2B API key (ours, not the user's)
 * @returns Sandbox instance with ID and preview URL
 */
async function buildSandcastle(templateId: string): Promise<SandboxInfo>;

/**
 * Executes a command in the sandbox and returns the result.
 * Checks exit codes because unlike the user, we have standards.
 *
 * @param sandboxId - The sandbox to run in
 * @param command - Shell command to execute
 * @returns Command output, stderr, and exit code
 */
async function pokeTheSandcastle(sandboxId: string, command: string): Promise<CommandResult>;

/**
 * Returns the live preview URL for the running app in the sandbox.
 * This is what the user sees in the WebView on their phone.
 * On the bus. While they should be doing literally anything else.
 *
 * @param sandboxId - The sandbox running the app
 * @returns Preview URL or null if nothing is running
 */
async function seeWhatYouDid(sandboxId: string): Promise<string | null>;

/**
 * Destroys the sandbox. Explicitly. Don't rely on TTL alone.
 * Railway charges by the second. The user's API key charges by the token.
 * This function exists because I once left a sandbox running overnight.
 * Cost: $4.20. Lesson: priceless.
 *
 * @param sandboxId - The sandbox to obliterate
 */
async function destroySandcastle(sandboxId: string): Promise<void>;
```

### Template Configs
```typescript
// Pre-warmed templates per spec section 08
const TEMPLATES = {
  nextjs: {
    image: 'node:22',
    preInstalled: ['next', 'react', 'react-dom', 'typescript'],
    startCmd: 'npm run dev',
    waitForPort: 3000,
  },
  express: {
    image: 'node:22',
    preInstalled: ['express', 'typescript', 'tsx'],
    startCmd: 'npx tsx src/index.ts',
    waitForPort: 3000,
  },
  fastapi: {
    image: 'python:3.12',
    preInstalled: ['fastapi', 'uvicorn'],
    startCmd: 'uvicorn main:app --host 0.0.0.0 --port 8000',
    waitForPort: 8000,
  },
  node: {
    image: 'node:22',
    preInstalled: ['typescript', 'tsx'],
    startCmd: 'npx tsx src/index.ts',
    waitForPort: 3000,
  },
} as const;
```

## Acceptance Criteria

- [ ] `buildSandcastle()` creates sandbox in <200ms (with pre-warmed template)
- [ ] `pokeTheSandcastle()` runs commands and returns exit code, stdout, stderr
- [ ] `seeWhatYouDid()` returns a working preview URL
- [ ] `destroySandcastle()` kills sandbox explicitly (not relying on TTL)
- [ ] Timeout set to 15 minutes on every sandbox
- [ ] Session termination triggers sandbox destruction
- [ ] Shallow clone (`depth=1`) used for repo cloning
- [ ] E2B API key is ours (server-side env var), not the user's
- [ ] `tsc --noEmit` passes
- [ ] All tests pass (with mocked E2B SDK)

## Notes

- E2B key is OUR key, stored in Railway env vars. User never provides this.
- Per CLAUDE.md: "Kill sandboxes explicitly when sessions end. Don't rely on TTL alone."
- Per spec: ~150ms cold start for Firecracker microVMs. The real latency is npm install for existing projects.
- New project mode (step 12) uses pre-warmed templates. Existing project mode (step 14) clones into a sandbox.
- Sandbox crash recovery is in step 17 (resilience). For now, just report the error.
