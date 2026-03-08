// The personality engine. The beating, sarcastic heart of TimeToRelax.
// Every voice response, every loading message, every error quip
// flows through here. If the app sounds like a cynical co-founder
// who's disappointed in your life choices, this file is why.
//
// Two modes:
//   1. craftDisapproval() -- picks a template, interpolates variables, done.
//      Fast. Predictable. Covers 80% of situations.
//   2. consultTheOracle() -- asks Claude Haiku for a contextual quip.
//      Slower (~300-500ms). Reserved for moments where canned text
//      would feel hollow. Like when the user's build fails for the
//      fifth time in one session.
//
// If you're reading this on GitHub: yes, the personality engine has
// a name. Yes, it's "denial engine." We're all in denial about something.

import type { PersonalityState } from '@timetorelax/shared';

import { openChapter } from './dear-diary.js';
import { templates } from '../personality/templates.js';

// Every personality crisis gets documented
const log = openChapter('denial-engine');

/**
 * Generates a cynical voice response for the given agent state.
 * Picks a random template from the bank, interpolates any `{key}`
 * placeholders with the provided context, and returns the result.
 *
 * If you're adding a new state, add at least 3 template options.
 * If any of them contain the word "apologize" the tests will fail
 * and you'll have to explain yourself.
 *
 * @param state - The current agent state that needs a personality response
 * @param context - Optional key-value pairs for template interpolation (e.g., `{ n: 5 }`)
 * @returns Text ready for Deepgram Aura-2 TTS, dripping with judgment
 */
export function craftDisapproval(
  state: PersonalityState,
  context?: Record<string, string | number>,
): string {
  const stateTemplates = templates[state];

  // TypeScript's noUncheckedIndexedAccess doesn't trust anyone
  // and neither do we. Guard early, judge later.
  if (!stateTemplates || stateTemplates.length === 0) {
    log.error({ state }, 'no templates found for state. the jukebox is empty.');
    return 'Something unexpected happened. We refuse to elaborate.';
  }

  // Pick a random template. Math.random is fine here.
  // We're selecting quips, not generating cryptographic keys.
  const index = Math.floor(Math.random() * stateTemplates.length);
  const selected = stateTemplates[index];

  // This should never happen after the length check above,
  // but TypeScript doesn't trust anyone and neither do we
  if (selected === undefined) {
    log.error({ state, index, templateCount: stateTemplates.length }, 'template selection failed');
    return 'Something unexpected happened. We refuse to elaborate.';
  }

  // Interpolate {key} placeholders with context values.
  // Missing keys stay as-is because crashing over a missing
  // placeholder is beneath us.
  let result = selected;
  if (context) {
    for (const [key, value] of Object.entries(context)) {
      result = result.replaceAll(`{${key}}`, String(value));
    }
  }

  log.debug({ state, template: result }, 'disapproval crafted');

  return result;
}

/**
 * For moments when a canned response would feel hollow.
 * Calls Claude Haiku to generate a contextual quip that's aware
 * of what specifically just happened, not just which state we're in.
 *
 * Reserved for dynamic moments only. Templates handle the 80% case.
 * This handles the "the user's build failed for the fifth time and
 * we should probably say something specific about their suffering" case.
 *
 * @param agentState - What the agent is currently doing or just did
 * @param specifics - Context like error messages, file names, or the user's hubris
 * @returns A cynical observation about the situation, generated fresh
 */
export async function consultTheOracle(
  agentState: string,
  specifics: string,
): Promise<string> {
  // TODO(nikita): Wire up the actual Anthropic Haiku API call here.
  // The Agent SDK dependency arrives in step 10. Until then, we return
  // a hardcoded fallback that's at least in-character.
  // The real implementation will use a system prompt that enforces
  // the cynical persona and keeps responses under 200 chars.

  log.info(
    { agentState, specifics },
    'oracle consulted (stubbed, real Haiku call comes in step 10)',
  );

  // Hardcoded fallback. Still cynical. Still on-brand.
  // Better than nothing, worse than a real Haiku response.
  return "I'd say something clever about this, but the oracle is still being wired up. Stay tuned.";
}
