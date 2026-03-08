// The list of words that, if found in any template, mean someone
// on this team has gone corporate. The tests will catch it.
// The shame, however, is yours to carry.
//
// If you're reading this file on GitHub: yes, we unit test
// against corporate language. No, we're not joking.
// Well, we are. But also we're not.

/**
 * Words and phrases that should never appear in any user-facing text.
 * If you use any of these, the personality template tests will fail,
 * and you'll have to explain to the team why you thought "we apologize
 * for the inconvenience" was acceptable copy for an app that ships
 * code from a bus.
 *
 * @see CLAUDE.md voice personality guidelines
 */
export const BANNED_WORDS = [
  'apologize',
  'apology',
  'sorry',
  'inconvenience',
  'patience',
  'oops',
  'uh oh',
  'uh-oh',
  'something went wrong',
  'please try again later',
  'we apologize for the inconvenience',
  'thank you for your patience',
] as const;

export type BannedWord = (typeof BANNED_WORDS)[number];
