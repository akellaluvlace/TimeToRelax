# CLAUDE.md -- TimeToRelax

> Voice-first mobile coding agent. Expo/React Native + Claude Agent SDK + E2B + Deepgram.
> Akella inMotion. Dublin, 2026. SendHelpItsTerminal.

---

## Project Identity

TimeToRelax is a mobile app that gives developers a standalone agentic coding session controlled by voice. No laptop required. The agent runs on Railway via the Claude Agent SDK, executes in E2B sandboxes, and pushes to GitHub. The user's phone is a voice interface and review screen.

The app has a cynical co-founder personality. This tone is not just for users. It's in the codebase. Function names, file names, comments, variable names, error messages, commit messages. The entire repo is open source and part of the brand. When a developer clones the repo and reads the source, they should laugh. Then share it. Then star it.

**This is not a toy.** This ships to real developers. Code quality, error handling, and UX polish matter from Day 1. The humor lives in the naming, not in the architecture. The code itself is dead serious. The names are unhinged.

---

## Architecture Overview

```
Mobile (Expo/RN)  -->  Deepgram (STT/TTS)  -->  Railway (Fastify)  -->  E2B (sandbox)
                                                      |
                                                Claude Agent SDK
                                                      |
                                                  GitHub (push)
```

**Monorepo structure:**

```
timetorelax/
  apps/
    mobile/              # Expo/React Native app (Android-first)
      src/
        components/      # UI components
        screens/         # Screen components (expo-router)
        hooks/           # Custom hooks (useVoice, useAgentSession, etc.)
        services/        # API clients, voice, auth
          enabler.ts           # Agent session orchestrator
          last-resort.ts       # Fallback voice (device STT)
          hide-the-evidence.ts # Secure key storage wrapper
        store/           # Zustand stores
        utils/           # Helpers, constants
        personality/     # Voice templates, copy
      app.json
      tsconfig.json
    backend/             # Fastify server on Railway
      src/
        routes/          # API route handlers
        services/
          enabler.ts           # Agent SDK session manager
          grass-toucher.ts     # E2B sandbox lifecycle
          denial-engine.ts     # Personality response system
          the-void.ts          # SSE event streaming
          no-laptop-no-problem.ts  # GitHub push service
          intervention.ts      # Rate limit handler
          therapy-fund.ts      # Usage / cost tracking
        middleware/      # Auth, validation, rate limiting
        types/           # Shared TypeScript types
      Dockerfile
      tsconfig.json
  packages/
    shared/              # Shared types, constants between apps
  CLAUDE.md              # This file
  README.md              # Also cynical. Also part of the brand.
  turbo.json             # Turborepo config
```

---

## Tech Stack Rules

### TypeScript (everywhere)
- Strict mode enabled. No `any` types except when interfacing with untyped third-party libs, and even then wrap with proper types.
- Use `interface` for object shapes, `type` for unions/intersections/mapped types.
- Prefer `const` assertions and `as const` for literal types.
- No enums. Use `const` objects with `as const` and derive types from them.
- Explicit return types on all exported functions.
- Use `unknown` over `any` for truly unknown types, then narrow.

### Expo / React Native (mobile)
- **expo-audio** for voice capture. NOT expo-av (deprecated path).
- **expo-secure-store** for API keys. NEVER AsyncStorage or localStorage for secrets.
- **expo-router** for navigation. File-based routing.
- **NativeWind** for styling. Use Tailwind classes, not StyleSheet.create unless performance-critical.
- **Zustand** for state. No Redux. No Context API for global state.
- Keep components under 150 lines. Extract hooks for logic.
- No inline styles longer than 3 properties -- move to NativeWind classes.
- All screens must handle: loading state, error state, empty state.
- Test on a real Android device, not just emulator. Audio behaves differently.

### Fastify (backend)
- Use Fastify's schema validation for all routes. Define JSON Schema for request/response.
- Use `@fastify/cors`, `@fastify/rate-limit`, `@fastify/sensible`.
- SSE via `fastify-sse-v2` or raw response streaming.
- All route handlers are async. No callbacks.
- Errors use Fastify's built-in error handling with proper HTTP status codes.
- Health check at `GET /health`. Always.

### Claude Agent SDK
- Use V2 session API: `createSession()` / `send()` / `stream()`.
- Default model: `sonnet`. Do NOT use `opus` unless explicitly requested.
- Always set `permissionMode: "acceptEdits"` or `"bypassPermissions"` for automated flows.
- Always configure `allowedTools` explicitly. Never leave it open.
- Set `maxTurns: 50` as a safety limit per instruction.
- Handle the async generator properly -- always iterate to completion or call `session.close()`.
- Store session IDs for potential resume via `resumeSession()`.

### E2B
- Use Build System 2.0 template API for pre-warmed environments.
- Always set sandbox timeout: `timeoutMs: 900_000` (15 minutes).
- Use `sandbox.commands.run()` for shell commands, check exit codes.
- Clone repos with `depth=1` (shallow) to minimize transfer time.
- Kill sandboxes explicitly when sessions end. Don't rely on TTL alone.

---

## Coding Standards

### Naming

Standard conventions below. For the personality layer on top (cynical function names, file names, etc.), see the **Cynical Codebase** section.

- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for components. Prefer personality-driven names (see Cynical Codebase).
- Variables/functions: `camelCase`. Cynical names encouraged when clarity is preserved.
- Types/interfaces: `PascalCase`. Types stay professional. The joke is in the implementation, not the contract.
- Constants: `UPPER_SNAKE_CASE` for true constants. Cynical names encouraged (e.g., `MAX_REGRET_DURATION_MS`).
- Event handlers: `onVerbNoun` pattern (e.g., `onPressRecord`, `onSessionComplete`).
- Hooks: `useNoun` or `useVerbNoun` (e.g., `useVoice`, `useAgentSession`).

### Error Handling
- Every `async` function must have error handling. No unhandled promise rejections.
- Use custom error classes that extend `Error` with a `code` property.
- Backend errors return structured JSON: `{ error: string, code: string, details?: unknown }`.
- Mobile catches must show user-facing feedback (toast, inline error, or voice response).
- Never swallow errors silently. At minimum, `console.error` in development.
- For Agent SDK errors: always capture the error type and surface it through SSE to the client.

### Comments
- No comments that restate what code does. Only comments that explain *why*.
- Comments carry the personality. If a comment is boring, rewrite it. See **Cynical Codebase** for examples.
- JSDoc on all exported functions with `@param` and `@returns`. JSDoc descriptions should be funny. See Cynical Codebase for the format.
- `// TODO(nikita):` format for known tasks. Include context AND a quip.
- `// HACK:` for temporary workarounds. Include link to issue, reason, AND mild self-loathing.
- Sprinkle in comments that address the person reading the source code on GitHub. They're part of the audience.

### Imports
- Absolute imports via tsconfig paths: `@/components/`, `@/services/`, etc.
- Group imports: (1) React/RN, (2) third-party, (3) internal, separated by blank lines.
- No barrel exports (`index.ts` re-exporting everything). Import directly from source files.

---

## Voice Personality Guidelines

The cynical co-founder persona applies to EVERYTHING. User-facing AND developer-facing:
- Voice TTS responses
- Error messages in the UI
- Loading states, empty states, onboarding copy
- Settings descriptions, push notifications
- **Function names, file names, variable names**
- **Code comments and JSDoc**
- **Test descriptions**
- **Commit messages and PR descriptions**
- **README and documentation**

If a developer reads the source on GitHub and nothing makes them smirk, we failed.

### Tone Rules
- First person plural or second person. Never third person.
- Short sentences. Punch, don't ramble.
- Sarcasm is the default. Sincerity is the exception (reserved for actual errors that block the user).
- Never use: "Oops!", "Uh oh!", "Something went wrong", "Please try again later".
- Never use corporate language: "We apologize for the inconvenience", "Thank you for your patience".
- No emojis in voice responses. Minimal in UI (one per screen max, if any).
- No exclamation marks in voice responses unless sarcastic.

### Template Bank (expand as needed)

**Session states:**
```
session_start:     "You're on the bus. You could be reading. But no. Here we are."
                   "Another day, another repo you'll abandon in three weeks."
                   "Let's pretend this is productive. What are we building?"

session_timeout:   "You disappeared. Changes saved. Go live your life."
                   "Session expired. Your code is on a branch. You're welcome."

session_resume:    "Back already? I saved your mess."
```

**Agent states:**
```
agent_thinking:    "Thinking. Unlike you before starting this at 11pm."
agent_reading:     "Reading your code. No comment. Yet."
agent_writing:     "Writing files. Try not to interrupt."
agent_running:     "Running it. Fingers crossed. Mine, not yours."

build_success:     "It works. Don't touch it."
                   "Build passed. Miracles happen."
build_failed:      "Build failed. Obviously. Fixing it now."
                   "Build failed. Shocker. Give me a second."

files_changed:     "{n} files changed. You're welcome. Go touch grass."
                   "Changed {n} files. The bus is almost at your stop."
```

**Push states:**
```
push_complete:     "Shipped from a bus. Your manager would be so proud."
                   "Branch pushed. PR ready. You did nothing. Perfect."
push_failed:       "Push failed. Check your GitHub token. I'll wait."
```

**Errors:**
```
key_invalid:       "Your API key is dead. Check Settings. I'm not going anywhere."
rate_limited:      "Rate limited. Waiting {n}s. Use the time to question your choices."
sandbox_crash:     "Sandbox died. Restarting. This is fine."
network_lost:      "Lost connection. Reconnecting. Stay calm. Or don't."
```

---

## Cynical Codebase (The Open Source Brand)

This repo will be open sourced. The source code is part of the marketing. Developers who clone the repo, read the function names, and scroll through comments should want to star it and share it on X. The codebase should read like a cynical developer's diary, not a textbook.

**The rule: the code is rigorous, the names are unhinged.** The architecture, types, error handling, and test coverage are dead serious. The function names, file names, comments, and variable names carry the personality. Never sacrifice code quality for a joke. But never write a boring name when a funny one is equally clear.

### File Names

```
// Good -- funny AND clear about what the file does
denial-engine.ts              // The personality response system
regret-tracker.ts             // Session timeout / TTL manager
bad-decisions.ts              // Analytics / usage tracking
last-resort.ts                // Fallback voice (device STT when no Deepgram)
grass-toucher.ts              // E2B sandbox lifecycle manager (touch grass = go outside = sandbox)
intervention.ts               // Rate limit handler
enabler.ts                    // The main agent session orchestrator (it enables your worst habits)
copium.ts                     // Error recovery and retry logic
the-void.ts                   // SSE event streaming (you shout into it and things come back)
no-laptop-no-problem.ts       // GitHub push service
sleep-is-optional.ts          // Session persistence / resume
what-have-i-done.ts           // Diff generation and formatting
rock-bottom.ts                // Onboarding flow (this is where it starts)
therapy-fund.ts               // Cost tracking / API usage monitoring
i-can-stop-anytime.ts         // App entry point

// Bad -- accurate but soulless
session-manager.ts
error-handler.ts
analytics.ts
```

### Function and Method Names

```typescript
// Good -- personality in the name, intent still crystal clear

// Session management
createSession()        -> spawnRegret()
endSession()           -> releaseYouFromYourself()
resumeSession()        -> welcomeBackYouAddict()
getSessionState()      -> assessDamage()

// Voice
startRecording()       -> openMouth()
stopRecording()        -> mercifully()
playResponse()         -> talkBack()
connectVoice()         -> enableTheVoices()

// Agent
sendInstruction()      -> unleash()
streamEvents()         -> watchInHorror()
handleAgentError()     -> itsNotABugItsAFeature()
retryInstruction()     -> tryAgainDespiteEvidence()

// Git operations
pushBranch()           -> shipFromInappropriateLocation()
createPR()             -> makeItSomeoneElsesProblem()
commitChanges()        -> noTakebacksies()

// E2B sandbox
spinUpSandbox()        -> buildSandcastle()
tearDownSandbox()      -> destroySandcastle()
getPreviewUrl()        -> seeWhatYouDid()

// API keys
validateKey()          -> proofOfLife()
storeKey()             -> hideTheEvidence()
deleteKey()            -> forgetEverything()

// Error handling
handleRateLimit()      -> enforceBreak()
handleNetworkDrop()    -> panicQuietly()
handleSandboxCrash()   -> thisIsFine()
gracefulShutdown()     -> walkAwaySlowly()

// Bad -- technically correct, emotionally void
createNewSession()
endCurrentSession()
handleError()
```

### Variable and Constant Names

```typescript
// Good
const MAX_REGRET_DURATION_MS = 900_000;     // 15min session TTL
const VOICE_OF_REASON_TIMEOUT = 10_000;     // reconnect backoff max
const SHAME_THRESHOLD = 3;                   // max concurrent sessions
const DENIAL_BUFFER_SIZE = 100;              // SSE event buffer
const HOW_LONG_UNTIL_WE_WORRY = 50;         // maxTurns for agent
const MINIMUM_SELF_RESPECT = 0.05;           // min Deepgram confidence score

// State
let isUserStillDoingThis = false;            // session active flag
let numberOfMistakesMade = 0;                // error count
let timeSinceLastBadDecision = Date.now();   // last activity timestamp

// Enums (as const objects, per TypeScript rules)
const SessionPhase = {
  DENIAL: 'denial',                          // session starting
  BARGAINING: 'bargaining',                  // agent working
  ACCEPTANCE: 'acceptance',                  // reviewing diff
  GRIEF: 'grief',                            // build failed
  ENLIGHTENMENT: 'enlightenment',            // build passed, somehow
} as const;

const VoiceProvider = {
  THE_DEFAULT: 'deepgram',                   // sensible choice
  THE_UPGRADE: 'grok',                       // for the committed
  THE_LAST_RESORT: 'device',                 // when all else fails
} as const;
```

### Comments

```typescript
// Good -- useful AND entertaining

// We store this in memory because persisting it would mean
// admitting this is a real product and not a cry for help
const sessionStore = new Map<string, Session>();

// Deepgram's WebSocket drops when the user switches to Instagram
// to check their likes mid-session. Reconnect with backoff.
// Yes this happens. Yes it's the #1 crash reason. Yes I'm tired.
function reconnectVoice(): void { ... }

// The agent sometimes decides it needs to rewrite the entire project.
// maxTurns prevents bankruptcy. Ask me how I found this number.
const MAX_TURNS = 50;

// If you're reading this source code on GitHub, hi.
// Yes, the app works. No, I don't have a healthy relationship with work.
// Star the repo and go outside.

// This function is called when the user has been staring at their phone
// on the bus for so long they missed their stop. We auto-save.
function emergencyCommit(): void { ... }

// Railway charges by the second. The user's API key charges by the token.
// This function exists because I once left a sandbox running overnight.
// Cost: $4.20. Lesson: priceless.
function killSandboxOrPayThePrice(): void { ... }

// TODO(nikita): Add proper retry logic here.
// Current approach: hope. Hope is not a strategy but here we are.

// HACK: Grok sometimes returns empty audio frames between words.
// We filter them out here. xAI says this is "expected behavior."
// I say it's character building.
```

### JSDoc with Personality

```typescript
/**
 * Sends a voice instruction to the agent and streams back the results
 * of what will almost certainly be a questionable architectural decision.
 *
 * @param instruction - What the user mumbled into their phone on the bus
 * @param sessionId - The session we're slowly destroying
 * @returns An async generator of events you'll watch in real-time horror
 * @throws {RateLimitError} When the user's API key begs for mercy
 * @throws {SandboxError} When E2B decides today isn't the day
 */
async function* unleash(
  instruction: string,
  sessionId: string
): AsyncGenerator<AgentEvent> { ... }

/**
 * Validates that the user's API key is alive and has credit remaining.
 * Think of it as checking if the patient has a pulse before surgery.
 *
 * @param key - The Anthropic API key to validate
 * @returns True if the key works, false if the user needs to check their billing
 */
async function proofOfLife(key: string): Promise<boolean> { ... }

/**
 * Generates a cynical voice response for the given agent state.
 * If you're adding a new state, add at least 3 template options.
 * If any of them contain the word "apologize" the tests will fail
 * and you'll have to explain yourself.
 *
 * @param state - The current agent state
 * @param context - Optional context for Haiku-generated dynamic responses
 * @returns Text to send to Deepgram Aura-2 TTS
 */
function craftDisapproval(
  state: AgentState,
  context?: string
): string { ... }
```

### Test Names

```typescript
describe('denial-engine', () => {
  it('should judge the user for starting a session at 11pm', () => { ... });
  it('should save changes when the user ghosts mid-session', () => { ... });
  it('should never apologize for anything', () => { ... });
  it('should roast the user differently each time', () => { ... });
});

describe('enabler', () => {
  it('should spawn a sandbox faster than the user can reconsider', () => { ... });
  it('should handle the agent going rogue gracefully', () => { ... });
  it('should not bankrupt the user via runaway turns', () => { ... });
});

describe('no-laptop-no-problem', () => {
  it('should push to GitHub from literally anywhere', () => { ... });
  it('should create a branch name that explains what happened', () => { ... });
  it('should not push to main because we have standards', () => { ... });
});

describe('therapy-fund', () => {
  it('should track Deepgram credit burn rate accurately', () => { ... });
  it('should alert when credits drop below the panic threshold', () => { ... });
});
```

### README Easter Eggs

The README.md should include:

```markdown
## Requirements

- An Anthropic API key (you already have one, let's not pretend)
- A GitHub account (see above)
- A phone (any phone made after 2020, we're not picky)
- A commute, a park bench, or any location your therapist would disapprove of
- The inability to stop working (you wouldn't be here otherwise)

## Installation

\`\`\`bash
# Step 1: Accept your fate
npm install

# Step 2: Configure your keys (see .env.example)
cp .env.example .env

# Step 3: There is no step 3. You're already coding on the bus.
\`\`\`

## Contributing

PRs welcome. If your function names are boring, we'll ask you to rename them.
If your error messages sound like they were written by a Fortune 500 company, we'll reject the PR.
If your code is clean, well-tested, and makes us laugh, you're in.

## License

MIT. Do whatever you want. We're not your manager.
(Although if you fork this and remove the personality, that's technically legal but morally wrong.)
```

### The Line: Funny vs. Confusing

The cynical naming MUST still be self-documenting. A developer who has never seen this codebase should understand what a function does from its name + JSDoc in under 5 seconds. If the joke obscures the purpose, the joke loses.

**The test:** If you remove the JSDoc, can a senior developer still guess what the function does? `shipFromInappropriateLocation()` clearly pushes code somewhere. `unleash()` clearly starts something. `thisIsFine()` clearly handles something going wrong. These pass. `lol()` does not. `yeet()` does not. `bruh()` does not. Keep it clever, not lazy.

---

## Build Steps

All build steps live in `docs/build-steps/`. **Start every agent session by reading `docs/build-steps/00-overview.md` for current status.**

| Resource | Path |
|---|---|
| Master index & progress log | `docs/build-steps/00-overview.md` |
| Step files (01-20) | `docs/build-steps/01-monorepo-scaffold.md` through `20-polish-launch.md` |
| Design doc | `docs/plans/2026-03-06-build-steps-and-logging-design.md` |

When starting work:
1. Read `docs/build-steps/00-overview.md` -- check status dashboard, dependency graph
2. Pick the next not-started step whose dependencies are complete
3. Update the step's status to `in-progress` and log the session
4. When done, update step status to `complete` and log completion date

### Source Documents

| Document | Purpose |
|---|---|
| `timetorelax-spec-v2.2.md` | Product spec, architecture, 4-week timeline |
| `CLAUDE.md` | Operating manual, coding standards, personality rules |
| `timetorelax-landing.md` | Landing page copy, Grok system prompt, design specs |

### Runtime Logging

- **Backend:** `apps/backend/src/services/dear-diary.ts` -- pino-based structured logger
- **Mobile:** `apps/mobile/src/services/confessional.ts` -- console wrapper with structured context
- Both output structured JSON. Personality lives in file names and JSDoc, not log output.
- Child loggers per service: `openChapter('enabler')` (backend), `openBooth('useVoice')` (mobile)
- No `console.log` anywhere. All logging through these wrappers.

---

## Agentic Coding Protocol

When using Claude Code or the Agent SDK to work on this codebase, follow this protocol:

### Before Writing Code
1. **Read the build steps.** Check `docs/build-steps/00-overview.md` for current status and pick the right step.
2. **Read the spec.** The source of truth is `timetorelax-spec-v2.2.md`. If a decision is documented there, follow it. Don't reinvent.
3. **Read this file.** CLAUDE.md is your operating manual. Every rule here exists because something went wrong without it.
4. **Understand the scope.** Before making changes, identify all files that will be affected. List them. If more than 10 files, break the task into sub-tasks.
5. **Check existing patterns.** Before creating new utilities, components, or abstractions, search for existing ones. Use `Glob` and `Grep` tools. Don't duplicate.

### While Writing Code
6. **One concern per commit.** Each logical change is one commit. Not "updated stuff". Not "WIP". Describe what changed and why.
7. **Type first, implement second.** For new features, define the TypeScript interfaces and types before writing implementation. This catches design issues early.
8. **Handle the sad path.** For every happy path you write, write the error path immediately. Not later. Not in a follow-up. Now.
9. **Test as you go.** Write the test alongside the implementation, not after. If you can't test it easily, the abstraction is wrong.
10. **No dead code.** Don't comment out code "for later". Delete it. Git remembers.

### After Writing Code
11. **Self-review.** Before marking complete, re-read every changed file. Look for: unused imports, `any` types, missing error handling, hardcoded values, TODO comments without context.
12. **Run the checks.** `tsc --noEmit`, `eslint .`, `jest --passWithNoTests`. All must pass.
13. **Update build steps.** Mark the step as complete in `docs/build-steps/00-overview.md`. Log the session.
14. **Update this file.** If you made an architectural decision that affects future work, add it to CLAUDE.md.

---

## PR Review Protocol

Every PR goes through a structured review. This applies whether the PR was written by a human or generated by an agent.

### Automated Checks (must all pass before review)

```bash
# TypeScript compilation
npx tsc --noEmit

# Linting
npx eslint . --ext .ts,.tsx --max-warnings 0

# Unit tests
npx jest --passWithNoTests --coverage

# Type coverage (target: >90%)
npx type-coverage --at-least 90

# Dependency audit
npm audit --production

# Bundle size check (mobile only)
npx expo export --platform android --dry-run
```

### Review Checklist

**Architecture & Design**
- [ ] Changes align with the spec (`timetorelax-spec-v2.2.md`)
- [ ] No new dependencies without justification in PR description
- [ ] No circular dependencies introduced (check with `madge --circular`)
- [ ] Shared types are in `packages/shared/`, not duplicated
- [ ] New API routes have request/response schema validation

**Code Quality**
- [ ] No `any` types (search: `grep -r ": any" --include="*.ts" --include="*.tsx"`)
- [ ] No `console.log` left behind (use structured logger in backend, remove in mobile)
- [ ] All exported functions have JSDoc (with personality, not boilerplate)
- [ ] Error handling on every async path
- [ ] No hardcoded strings that should be constants or config
- [ ] No secrets, API keys, or tokens in code (search: `grep -rn "sk-\|api_key\|secret" --include="*.ts"`)
- [ ] New function/file names follow the cynical naming convention (no generic names like `utils.ts` or `handleError`)
- [ ] Comments explain *why*, not *what*, and carry the personality

**Mobile Specific**
- [ ] New screens handle loading, error, and empty states
- [ ] Keyboard dismissal handled on forms
- [ ] No inline styles longer than 3 properties
- [ ] WebSocket connections have reconnection logic
- [ ] expo-secure-store used for any sensitive storage
- [ ] Accessibility: all touchable elements have accessible labels

**Backend Specific**
- [ ] All routes have rate limiting configured
- [ ] SSE events follow the established event type naming
- [ ] Agent SDK sessions are properly closed/cleaned up on all exit paths
- [ ] E2B sandboxes are killed on session end (not just TTL)
- [ ] Error responses use correct HTTP status codes

**Voice & Personality**
- [ ] New user-facing text matches the cynical persona
- [ ] No corporate language in error messages or loading states
- [ ] Voice templates added to the personality template bank
- [ ] TTS responses are under 15 seconds of estimated audio

**Testing**
- [ ] New business logic has unit tests
- [ ] Edge cases tested: empty input, null, undefined, network failure
- [ ] Integration tests for new API routes (request/response cycle)
- [ ] Manual test on real Android device for any audio/voice changes

### Review Process

1. **Agent self-review**: Before pushing, the agent runs all automated checks and fixes issues.
2. **Diff summary**: PR description includes a plain-English summary of what changed and why, written in the voice persona. Example: *"The agent was going bankrupt via runaway turns. Now it stops at 50 like a responsible adult. Three files changed. You're welcome."*
3. **Automated CI**: GitHub Actions runs lint, typecheck, test, audit. All must pass.
4. **Human review**: Nikita reviews for architecture alignment, UX decisions, and personality consistency.
5. **Merge**: Squash merge to main. Branch deleted.

---

## Testing Strategy

### Unit Tests
- Framework: Jest + React Native Testing Library
- Location: `__tests__/` directory adjacent to source, or `*.test.ts` co-located
- Coverage target: >80% on business logic, >60% overall
- Mock external services (Deepgram, Agent SDK, E2B) at the service boundary
- Test personality templates: ensure all agent states have at least 2 template options

```typescript
// Example: personality engine test
describe("PersonalityEngine", () => {
  it("returns a template for every known agent state", () => {
    const states = ["session_start", "build_success", "build_failed", "push_complete"];
    states.forEach(state => {
      const response = getPersonalityResponse(state);
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
      expect(response.length).toBeLessThan(200); // ~15sec audio limit
    });
  });

  it("never returns corporate language", () => {
    const banned = ["apologize", "inconvenience", "patience", "oops", "uh oh"];
    const allTemplates = getAllTemplates();
    allTemplates.forEach(t => {
      banned.forEach(word => {
        expect(t.toLowerCase()).not.toContain(word);
      });
    });
  });
});
```

### Integration Tests
- Test the full request cycle: API route -> service -> mock external -> response
- Use Fastify's `inject()` for HTTP testing without starting a server
- Test SSE streaming by collecting events into an array and asserting sequence
- Test Agent SDK integration with a mock that simulates the async generator pattern

### E2E Tests (post-MVP)
- Detox for mobile E2E (Android)
- Test the core loop: launch -> enter API key -> voice mock -> see diff -> accept
- Run against a staging Railway backend with real Agent SDK (sandbox mode)

### Manual Testing Protocol
- **Voice**: Test on real Android device with ambient noise (bus, walking)
- **Network**: Test with network throttling (3G profile in Chrome DevTools via adb)
- **Background**: Test app backgrounding during active session, verify reconnection
- **Orientation**: Lock to portrait. Don't support landscape for MVP.

---

## Tool & Plugin Configuration

### MCP Servers (for Claude Code development)

When developing this project with Claude Code, these MCP servers are useful:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-filesystem", "/path/to/timetorelax"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
```

### ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": ["warn", { "allowExpressions": true }],
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "react/react-in-jsx-scope": "off",
    "react-hooks/exhaustive-deps": "error"
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### TypeScript Configuration (base)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": false,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022"],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Iteration Protocol

### Feature Development Flow

```
1. SCOPE    -->  Define what "done" looks like in one sentence
2. TYPES    -->  Write interfaces and types first
3. STUB     -->  Create files with function signatures, no implementation
4. TEST     -->  Write failing tests for the core logic
5. BUILD    -->  Implement until tests pass
6. WIRE     -->  Connect to UI/API/services
7. POLISH   -->  Error states, loading states, personality copy
8. REVIEW   -->  Run PR review checklist
9. SHIP     -->  Merge, deploy, verify in staging
```

### Bug Fix Flow

```
1. REPRODUCE  -->  Confirm the bug exists. Write a failing test.
2. DIAGNOSE   -->  Trace the root cause. Don't fix symptoms.
3. FIX        -->  Minimal change that fixes the root cause.
4. VERIFY     -->  Test passes. Manual verification on device.
5. REVIEW     -->  Check for regressions in adjacent functionality.
```

### Refactor Flow

```
1. JUSTIFY    -->  Why refactor? Performance? Readability? New requirement?
2. BASELINE   -->  Ensure all existing tests pass before touching anything.
3. REFACTOR   -->  Change structure. Keep behavior identical.
4. VERIFY     -->  All existing tests still pass. No behavior change.
5. IMPROVE    -->  Now add new tests, new capabilities on clean foundation.
```

---

## Environment Variables

### Backend (.env)

```
# Required
ANTHROPIC_API_KEY=sk-ant-...          # For Haiku personality calls (our key)
DEEPGRAM_API_KEY=...                  # Our Deepgram key (server-side only)
E2B_API_KEY=...                       # E2B sandbox provisioning
GITHUB_CLIENT_ID=...                  # GitHub OAuth app
GITHUB_CLIENT_SECRET=...              # GitHub OAuth app

# Optional
GROK_API_KEY=...                      # For testing Grok integration
NODE_ENV=development|production
PORT=3000
LOG_LEVEL=info|debug

# Rate limiting
MAX_CONCURRENT_SESSIONS_PER_USER=3
SESSION_TTL_MS=900000                 # 15 minutes
SSE_BUFFER_SIZE=100
```

### Mobile (.env)

```
# Required
API_BASE_URL=https://api.timetorelax.app
GITHUB_OAUTH_CLIENT_ID=...

# Optional (for development)
API_BASE_URL_DEV=http://localhost:3000
```

**Never store user API keys in environment variables.** They live in expo-secure-store on device and are sent per-request to the backend.

---

## Deployment

### Backend (Railway)
- Auto-deploy from `main` branch
- Dockerfile-based deployment
- Health check: `GET /health` returns `{ status: "alive", version: "x.x.x" }`
- Environment variables set in Railway dashboard, not in repo
- Minimum: 1 instance, 512MB RAM, 1 vCPU
- No sleep/scale-to-zero -- sessions are long-lived

### Mobile (EAS Build)
- Android APK: `eas build --platform android --profile preview`
- Android Play Store: `eas build --platform android --profile production`
- iOS TestFlight: `eas build --platform ios --profile preview` (requires Mac + Apple Developer)
- OTA updates via `eas update` for JS-only changes (no native module changes)

### Landing Page (timetorelax.app)
- Next.js 16 app in `apps/landing/`, deployed to Vercel
- Vercel config: Root Directory = `apps/landing`, Framework = Next.js
- Tailwind CSS v4 with `@tailwindcss/postcss` plugin
- JetBrains Mono font (weights 300, 400, 500, 700)
- Dark terminal aesthetic: `#06060a` bg, `#39ff14` green accent, `#dddde5` text
- All custom CSS MUST be inside `@layer base {}` -- unlayered CSS overrides Tailwind v4 utilities
- Components: `Section.tsx` (scroll-reveal via IntersectionObserver), `Terminal.tsx` (window chrome), `Cursor.tsx` (blinking)
- 14 sections, clean text-only layout (no card boxes except Terminal chrome)
- Full page copy also saved at `landing-content.md` (project root)
- metadataBase: `https://timetorelax.app`

---

## Git Conventions

### Branch Naming
```
feat/voice-pipeline         # New feature
fix/sse-reconnection        # Bug fix
refactor/agent-session      # Refactoring
chore/eslint-config         # Tooling/config
docs/claude-md              # Documentation
```

### Commit Messages
```
feat(voice): teach the app to hear your terrible ideas
fix(backend): stop the agent from bankrupting users via runaway turns
refactor(mobile): extract useAgentSession because that screen was 400 lines of sin
chore(ci): add type-coverage check because we have standards now apparently
docs: update CLAUDE.md, add more ways to judge the user
feat(sandbox): sandcastles now self-destruct after 15min of neglect
fix(voice): stop Deepgram from transcribing bus announcements as code instructions
```

Format: `type(scope): lowercase description`
- No period at the end
- Imperative mood ("add" not "added", "fix" not "fixed")
- Under 72 characters
- Personality encouraged but clarity comes first

### Commit Rules
- **Never** add `Co-Authored-By` or `Co-authored-by` lines to commits. No co-signing. Ever.
- **Never** use `--no-verify` or skip hooks.
- **Never** force push to main.

### Branch Strategy
- `main` is production. Always deployable.
- Feature branches off `main`. Short-lived (1-3 days max).
- Squash merge. No merge commits.
- Delete branch after merge.
- No `develop` branch. No `staging` branch. Keep it simple.

---

## Quick Reference

| Need to... | Do this |
|---|---|
| Add a new API route | Create handler in `backend/src/routes/`, add schema validation, add rate limit, add test |
| Add a new screen | Create in `mobile/src/screens/`, add to expo-router, handle all 3 states (loading/error/empty) |
| Add a voice template | Add to `personality/templates.ts`, add test that it exists and passes banned-word check |
| Add a new dependency | Justify in PR description. Check bundle size impact. Prefer packages with >1k weekly downloads. |
| Change Agent SDK config | Update both the code and this CLAUDE.md file |
| Deploy backend | Push to `main`. Railway auto-deploys. Verify `/health`. |
| Deploy mobile update | `eas update` for JS changes. `eas build` for native changes. |
| Debug voice issues | Test on real device. Check Deepgram WebSocket logs. Check audio format (PCM 16-bit, 16kHz). |
| Debug agent issues | Check Railway logs. Look for Agent SDK error types. Check E2B sandbox status. |

---

## What Not To Do

- Don't use `expo-av`. Use `expo-audio`.
- Don't use `localStorage` or `AsyncStorage` for API keys. Use `expo-secure-store`.
- Don't use Opus model by default. Use Sonnet.
- Don't use the CLI `-p` flag for Agent SDK. Use the TypeScript V2 session API.
- Don't leave E2B sandboxes running after sessions end. Kill them explicitly.
- Don't write user-facing copy that sounds like a corporate chatbot.
- Don't write function names that sound like a corporate chatbot either.
- Don't write boring comments. If the comment is just "// handle error", delete it or make it funny and specific.
- Don't sacrifice clarity for a joke. `shipFromInappropriateLocation()` is clear. `lmao()` is not.
- Don't use em dashes in copy. Nikita's editorial rule.
- Don't add dependencies without checking if the functionality already exists in the codebase.
- Don't write tests after the feature is "done". Write them alongside.
- Don't merge without all automated checks passing.
- Don't name files `utils.ts` or `helpers.ts` or `misc.ts`. Name them for what they actually do, with personality.
- Don't use Playwright or browser automation tools unless explicitly asked by the user.
- Don't add Co-Authored-By or co-signing lines to commits. Ever.

---

*Last updated: March 2026*
*Maintained by: Nikita (founder) + Claude (agentic co-pilot)*
*SendHelpItsTerminal*