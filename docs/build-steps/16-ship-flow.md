# Step 16: Ship Flow (Commit, Push, PR)

**Status:** not-started
**Depends on:** Step 13, Step 14
**Estimated scope:** ~8 files

## Done When

User can accept changes with one tap (commits to `ttr/{description}` branch), push to GitHub with one tap, and optionally create a PR. All from the phone. On the bus.

## Tasks

- [ ] Install `simple-git` on backend
- [ ] Extend `no-laptop-no-problem.ts` with git operations:
  - `noTakebacksies()` -- commit changes to branch
  - `shipFromInappropriateLocation()` -- push branch to GitHub
  - `makeItSomeoneElsesProblem()` -- create PR via GitHub API
- [ ] Generate branch names: `ttr/{brief-description}` from session context
- [ ] Generate commit messages with personality (per CLAUDE.md git conventions)
- [ ] Create mobile Accept flow: review diff -> tap Accept -> commit -> push -> PR
- [ ] Create `ShipBar` component: [Accept] [Push] [Create PR] buttons
- [ ] Personality voice responses for push states
- [ ] Create routes: `POST /session/:id/accept`, `POST /session/:id/push`, `POST /session/:id/pr`
- [ ] Write test: commit creates correct branch name
- [ ] Write test: push uses user's GitHub token
- [ ] Write test: PR creation returns PR URL
- [ ] Write test: personality response plays on push complete

## Files To Create

```
apps/backend/src/services/no-laptop-no-problem.ts   # Updated with push/PR
apps/backend/src/routes/ship-routes.ts              # Accept, push, PR routes
apps/backend/__tests__/no-laptop-no-problem.test.ts # Updated tests
apps/backend/__tests__/ship-routes.test.ts          # Route tests
apps/mobile/src/components/ShipBar.tsx              # Accept/Push/PR buttons
apps/mobile/src/hooks/useShipFlow.ts                # Ship actions hook
apps/mobile/src/__tests__/ShipBar.test.tsx          # Component tests
```

## Implementation Design

### no-laptop-no-problem.ts
```typescript
import simpleGit from 'simple-git';
import { openChapter } from '@/services/dear-diary';

const log = openChapter('no-laptop-no-problem');

/**
 * Commits changes to a branch. No take-backsies.
 * Branch naming: ttr/{brief-description-from-session}
 *
 * @param sandboxId - The sandbox with the changes
 * @param description - Brief description for branch name
 * @returns Branch name and commit hash
 */
async function noTakebacksies(sandboxId: string, description: string): Promise<CommitResult>;

/**
 * Pushes the branch to GitHub. From literally anywhere.
 * Uses the user's OAuth token. We never see their commits
 * except in the SSE event that says "pushed."
 *
 * @param sandboxId - The sandbox with the branch
 * @param githubToken - The user's OAuth token
 * @param repoUrl - The GitHub repo URL
 * @returns Push result with branch URL
 */
async function shipFromInappropriateLocation(
  sandboxId: string,
  githubToken: string,
  repoUrl: string,
): Promise<PushResult>;

/**
 * Creates a PR on GitHub. Makes it someone else's problem.
 * PR description written in the voice persona because of course it is.
 *
 * @param githubToken - The user's OAuth token
 * @param repoUrl - The GitHub repo URL
 * @param branch - The branch to PR from
 * @param description - What changed (used for PR body)
 * @returns PR URL
 */
async function makeItSomeoneElsesProblem(
  githubToken: string,
  repoUrl: string,
  branch: string,
  description: string,
): Promise<string>;
```

### Branch Naming
```typescript
// ttr/add-dark-mode-settings
// ttr/fix-cors-webhook
// ttr/scaffold-nextjs-auth
function generateBranchName(description: string): string {
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
  return `ttr/${slug}`;
}
```

### Ship Flow UI
```
┌──────────────────────────────┐
│  3 files changed             │
│  +47 additions  -12 deletions│
├──────────────────────────────┤
│ [Accept Changes]             │  <- commits to ttr/ branch
│ [Push to GitHub]             │  <- pushes branch
│ [Create PR]                  │  <- creates PR (optional)
└──────────────────────────────┘
```

## Acceptance Criteria

- [ ] One-tap accept commits changes to `ttr/{description}` branch
- [ ] One-tap push sends branch to GitHub using user's token
- [ ] Optional PR creation returns PR URL
- [ ] Commit messages follow CLAUDE.md format: `feat(scope): description`
- [ ] Branch names are clean, URL-safe, and descriptive
- [ ] User's GitHub token used for push (not ours)
- [ ] Personality voice response plays on push complete/failure
- [ ] Push failure shows clear error with "Check your GitHub token" message
- [ ] Cannot push to main (per CLAUDE.md: "we have standards")
- [ ] `tsc --noEmit` passes
- [ ] All tests pass

## Notes

- Per CLAUDE.md: "it('should not push to main because we have standards')"
- Per spec: "Branch pushed. PR ready. You did nothing. Perfect."
- simple-git runs inside the E2B sandbox, not on Railway. All git operations happen in the sandbox.
- The user's GitHub token is proxied through the backend but never stored.
- PR body should be personality-infused per CLAUDE.md review protocol.
