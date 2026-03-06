# Step 06: Personality Engine (denial-engine.ts)

**Status:** not-started
**Depends on:** Step 02, Step 04
**Estimated scope:** ~8 files

## Done When

The personality engine returns cynical response text for all known agent states (template bank from CLAUDE.md), with at least 2 options per state, and a Haiku fallback for dynamic contextual quips. All templates pass the banned-word check.

## Tasks

- [ ] Create `denial-engine.ts` with template bank per CLAUDE.md voice personality section
- [ ] Implement template selection: random pick from state-matched templates
- [ ] Implement `craftDisapproval()` -- main function, returns text for a given agent state
- [ ] Implement `consultTheOracle()` -- Claude Haiku call for dynamic/contextual responses
- [ ] Create personality types in shared package if not already defined
- [ ] Populate template bank: minimum 3 templates per state from CLAUDE.md + landing page
- [ ] Add `{n}` interpolation support for templates with variables (e.g., `{n} files changed`)
- [ ] Write test: every known state has at least 2 templates
- [ ] Write test: no template contains banned corporate words
- [ ] Write test: template interpolation works
- [ ] Write test: Haiku fallback returns text (mock the API call)
- [ ] Write test: all templates are under 200 chars (~15sec audio limit)

## Files To Create

```
apps/backend/src/services/denial-engine.ts           # Personality response system
apps/backend/src/personality/templates.ts             # Template bank (all states)
apps/backend/src/personality/banned-words.ts          # Words that trigger test failures
apps/backend/__tests__/denial-engine.test.ts          # Personality engine tests
apps/backend/__tests__/personality-templates.test.ts  # Template coverage + banned word tests
```

## Implementation Design

### denial-engine.ts
```typescript
import { PersonalityState } from '@timetorelax/shared';
import { templates } from '@/personality/templates';
import { openChapter } from '@/services/dear-diary';

const log = openChapter('denial-engine');

/**
 * Generates a cynical voice response for the given agent state.
 * If you're adding a new state, add at least 3 template options.
 * If any of them contain the word "apologize" the tests will fail
 * and you'll have to explain yourself.
 *
 * @param state - The current agent state
 * @param context - Optional variables for template interpolation
 * @returns Text to send to Deepgram Aura-2 TTS
 */
function craftDisapproval(state: PersonalityState, context?: Record<string, string | number>): string;

/**
 * For moments when a canned response would feel hollow.
 * Calls Claude Haiku to generate a contextual quip.
 * Reserved for dynamic moments only (~300-500ms latency).
 *
 * @param agentState - What the agent is doing
 * @param specifics - Context like error messages, file names, unusual requests
 * @returns A cynical observation about the situation
 */
async function consultTheOracle(agentState: string, specifics: string): Promise<string>;
```

### Template Bank Structure
```typescript
const templates: Record<PersonalityState, string[]> = {
  session_start: [
    "You're on the bus. You could be reading. But no. Here we are.",
    "Another day, another repo you'll abandon in three weeks.",
    "Let's pretend this is productive. What are we building?",
  ],
  session_timeout: [
    "You disappeared. Changes saved. Go live your life.",
    "Session expired. Your code is on a branch. You're welcome.",
  ],
  // ... all states from CLAUDE.md voice personality section
};
```

### Banned Words
```typescript
// Per CLAUDE.md: never use these in any user-facing text
const BANNED_WORDS = [
  'apologize', 'apology', 'sorry',
  'inconvenience',
  'patience',
  'oops', 'uh oh', 'uh-oh',
  'something went wrong',
  'please try again later',
  'we apologize for the inconvenience',
  'thank you for your patience',
];
```

## Personality States (from CLAUDE.md + spec)

Must have templates for ALL of these:
- `session_start`, `session_timeout`, `session_resume`
- `agent_thinking`, `agent_reading`, `agent_writing`, `agent_running`
- `build_success`, `build_failed`
- `files_changed` (with `{n}` interpolation)
- `push_complete`, `push_failed`
- `key_invalid`, `rate_limited`, `sandbox_crash`, `network_lost`
- `error_recovery`

## Acceptance Criteria

- [ ] `craftDisapproval()` returns a string for every `PersonalityState`
- [ ] At least 2 templates per state (3+ preferred)
- [ ] Zero templates contain any banned word (case-insensitive)
- [ ] All templates under 200 characters
- [ ] `{n}` interpolation works for parameterized templates
- [ ] `consultTheOracle()` calls Anthropic Haiku API (mocked in tests)
- [ ] Haiku system prompt enforces the cynical persona
- [ ] `tsc --noEmit` passes
- [ ] All tests pass

## Notes

- This is a core differentiator. The personality engine is what makes TimeToRelax shareable.
- Templates come from CLAUDE.md "Template Bank" section AND `timetorelax-landing.md` examples
- Haiku is cheap (~$0.001 per quip) but adds 300-500ms latency. Use templates for 80% case, Haiku for dynamic.
- The Grok path (step 18) bypasses this entirely; personality lives in the Grok system prompt instead.
- Don't hardcode the Anthropic API key. It comes from backend env config.
