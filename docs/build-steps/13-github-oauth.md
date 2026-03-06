# Step 13: GitHub OAuth & Repo Connect

**Status:** not-started
**Depends on:** Step 03, Step 07
**Estimated scope:** ~10 files

## Done When

User can log in with GitHub, browse their repos, and select one to connect. GitHub OAuth token is stored securely in expo-secure-store. Backend can use the token to clone repos and push branches.

## Tasks

### Mobile (OAuth + Repo Picker)
- [ ] Install `expo-auth-session`, `expo-secure-store`
- [ ] Create `hide-the-evidence.ts` -- secure key storage wrapper
- [ ] Implement `hideTheEvidence()` -- store key securely
- [ ] Implement `proofOfLife()` -- validate stored key
- [ ] Implement `forgetEverything()` -- delete stored key
- [ ] Create GitHub OAuth flow using expo-auth-session
- [ ] Create repo picker UI: list user's repos, search, select
- [ ] Store GitHub OAuth token via `hide-the-evidence.ts`
- [ ] Store Anthropic API key via `hide-the-evidence.ts`
- [ ] Create Settings screen for key management
- [ ] Write test: OAuth flow (mocked)
- [ ] Write test: secure storage wrapper

### Backend (GitHub Token Usage)
- [ ] Create `no-laptop-no-problem.ts` -- GitHub operations service
- [ ] Implement token validation endpoint
- [ ] Implement repo list endpoint (proxy to GitHub API)
- [ ] Implement repo clone into E2B sandbox
- [ ] Create route: `GET /github/repos` (list user repos)
- [ ] Create route: `POST /github/validate` (validate token)
- [ ] Write test: repo list returns formatted repos
- [ ] Write test: token validation

## Files To Create

```
apps/mobile/src/services/hide-the-evidence.ts       # Secure key storage wrapper
apps/mobile/src/hooks/useGitHubAuth.ts              # GitHub OAuth hook
apps/mobile/src/components/RepoPicker.tsx            # Repo list + search
apps/mobile/app/settings.tsx                         # Updated settings screen
apps/mobile/src/__tests__/hide-the-evidence.test.ts # Storage tests
apps/backend/src/services/no-laptop-no-problem.ts   # GitHub operations
apps/backend/src/routes/github-routes.ts            # GitHub API routes
apps/backend/__tests__/no-laptop-no-problem.test.ts # GitHub service tests
apps/backend/__tests__/github-routes.test.ts        # Route tests
```

## Implementation Design

### hide-the-evidence.ts (Mobile)
```typescript
import * as SecureStore from 'expo-secure-store';

const KEY_SLOTS = {
  GITHUB_TOKEN: 'github_oauth_token',
  ANTHROPIC_KEY: 'anthropic_api_key',
  XAI_KEY: 'xai_api_key',
} as const;

/**
 * Stashes a secret where nobody can find it.
 * Uses the OS keychain (iOS) or encrypted SharedPreferences (Android).
 * NOT AsyncStorage. NOT localStorage. We have standards.
 *
 * @param slot - Which key slot to store in
 * @param value - The secret to hide
 */
async function hideTheEvidence(slot: KeySlot, value: string): Promise<void>;

/**
 * Checks if a stored key is still alive and breathing.
 * Pings the relevant API to confirm. Think of it as checking
 * if the patient has a pulse before surgery.
 *
 * @param slot - Which key slot to validate
 * @returns True if the key works, false if it's dead
 */
async function proofOfLife(slot: KeySlot): Promise<boolean>;

/**
 * Destroys a stored key. Gone. Forgotten. Like your first side project.
 *
 * @param slot - Which key slot to wipe
 */
async function forgetEverything(slot: KeySlot): Promise<void>;
```

### GitHub OAuth Flow
```typescript
// Using expo-auth-session with GitHub's OAuth
// Scopes: repo (for push), read:user
// Token stored in expo-secure-store via hide-the-evidence.ts
// Token sent per-request to backend (never stored server-side)
```

### Settings Screen
```
[GitHub] Connected as @username [Disconnect]
[Anthropic API Key] ••••••••sk-ant-xxx [Change] [Validate]
[xAI API Key] Not configured [Add] -- unlocks Grok Voice
```

## Acceptance Criteria

- [ ] GitHub OAuth flow completes and returns valid token
- [ ] Token stored in expo-secure-store (NOT AsyncStorage)
- [ ] Repo picker lists user's repos with search
- [ ] Anthropic key stored securely with validation
- [ ] Settings screen shows key status (connected/invalid/missing)
- [ ] Backend validates tokens before use
- [ ] Backend lists repos using user's token (not ours)
- [ ] Key validation calls succeed/fail as expected
- [ ] `tsc --noEmit` passes
- [ ] All tests pass

## Notes

- **expo-secure-store for ALL secrets.** CLAUDE.md is extremely clear about this. AsyncStorage = immediate rejection.
- GitHub token and Anthropic key are sent per-request. They're never stored on our backend.
- xAI key is optional (Grok upgrade). The slot exists but isn't required until step 18.
- Per spec: "Two keys to start. Both of which Claude Code users already have."
- Onboarding flow (step 20) guides users through this. For now, Settings screen is the entry point.
- Per CLAUDE.md: validate keys with a lightweight ping before spawning any session.
