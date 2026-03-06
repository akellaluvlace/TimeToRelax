# Step 14: Existing Project Mode

**Status:** not-started
**Depends on:** Step 11, Step 13
**Estimated scope:** ~8 files

## Done When

User can connect a GitHub repo, voice a change, and the agent clones the repo into E2B, reads the codebase, makes changes, and streams diffs back to the app. "Setting up your project..." progress state works for first-time connections.

## Tasks

- [ ] Create Existing Project session flow: select repo -> clone -> manifest -> voice changes
- [ ] Implement repo clone into E2B sandbox (shallow, depth=1)
- [ ] Implement "Setting up your project..." progress state with status updates
- [ ] Generate manifest on repo connect: file tree, file sizes, first 20 lines, README, package.json
- [ ] Send manifest as initial context to Agent SDK session
- [ ] Voice a change -> agent reads relevant files -> makes changes -> streams diffs
- [ ] Stream file change events and diff data via SSE
- [ ] Handle repo size limits per spec:
  - <500 files: full support
  - 500-2000: manifest loads top-level + src/ signatures only
  - 2000+: user must specify subdirectory focus
- [ ] Create route: `POST /session/existing-project`
- [ ] Write test: repo clone + manifest generation
- [ ] Write test: agent receives manifest as context
- [ ] Write test: file changes stream as SSE events
- [ ] Write test: large repo size limit enforcement

## Files To Create

```
apps/mobile/app/existing-project.tsx                  # Existing project screen
apps/mobile/src/hooks/useRepoSession.ts              # Hook: repo connect + session
apps/mobile/src/components/SetupProgress.tsx          # "Setting up..." progress UI
apps/backend/src/services/archaeologist.ts            # Repo manifest generator
apps/backend/src/routes/existing-project-routes.ts   # POST /session/existing-project
apps/backend/__tests__/archaeologist.test.ts         # Manifest generation tests
apps/backend/__tests__/existing-project-routes.test.ts
```

## Implementation Design

### archaeologist.ts (Manifest Generator)
```typescript
/**
 * Digs through a repo and builds a lightweight manifest.
 * Like an archaeologist, except the artifacts are someone's
 * questionable architectural decisions from six months ago.
 *
 * @param sandboxId - The sandbox with the cloned repo
 * @param repoRoot - Root path of the cloned repo
 * @returns A manifest with file tree, signatures, and dependency context
 */
async function excavate(sandboxId: string, repoRoot: string): Promise<RepoManifest>;
```

### RepoManifest Structure
```typescript
interface RepoManifest {
  fileTree: FileNode[];           // Full path list with sizes
  signatures: FileSignature[];    // First 20 lines of each file
  readme: string | null;          // Full README content
  dependencies: string | null;    // package.json / requirements.txt / go.mod
  totalFiles: number;
  estimatedTokens: number;        // Rough token estimate for context budgeting
}
```

### Session Flow
```
1. User selects repo from picker (step 13)
2. POST /session/existing-project { repoUrl, anthropicKey }
3. Backend: buildSandcastle() -> clone repo (depth=1) -> npm install
4. SSE: setup_progress events ("Cloning...", "Installing deps...", "Reading...")
5. Backend: excavate() -> generate manifest
6. Backend: spawnRegret() with manifest as initial context
7. User: voices a change
8. Agent: reads relevant files, makes changes, runs tests
9. SSE: file_changed, diff_update events stream to app
10. E2B: preview URL available
```

### Repo Size Handling
```typescript
function assessTheTrauma(totalFiles: number, subdirectory?: string): ManifestStrategy {
  if (totalFiles <= 500) return 'full';
  if (totalFiles <= 2000) return 'signatures_only';
  if (!subdirectory) throw new RepoTooLargeError(
    `${totalFiles} files. Pick a subdirectory. We're not reading all of that.`
  );
  return 'subdirectory_focus';
}
```

## Acceptance Criteria

- [ ] Repo clones into E2B sandbox (shallow, depth=1)
- [ ] "Setting up..." progress updates stream via SSE
- [ ] Manifest generated with file tree, signatures, README, deps
- [ ] Agent receives manifest as initial context
- [ ] Voice a change -> agent makes changes -> diffs stream to app
- [ ] Repo size limits enforced (500/2000/subdirectory)
- [ ] Preview URL available after agent runs the app
- [ ] `tsc --noEmit` passes
- [ ] All tests pass

## Notes

- This is the Week 2 core deliverable: "Connect a real repo, voice a change, see the diff."
- First-time repo connect is slow (clone + npm install). Subsequent commands in same session are instant (warm sandbox).
- Per spec section 09: "We don't reinvent the SDK's context management. The manifest gives awareness; actual file content loaded lazily."
- Token budget per session: 150k tokens (configurable in session config).
- The agent uses its built-in Read/Glob/Grep tools inside the sandbox. We don't manage file loading.
