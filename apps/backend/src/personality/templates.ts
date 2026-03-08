// The template bank. Every cynical quip the app can throw at you,
// organized by the state that triggers it. Think of it as a jukebox
// of judgment. You put in a state, you get back disappointment.
//
// Rules (enforced by tests, not vibes):
// - At least 3 templates per state
// - Under 200 characters each
// - No banned words (see banned-words.ts)
// - No emojis
// - No em dashes
// - No exclamation marks unless dripping with sarcasm
// - First person plural or second person. Never third person.
//
// If you're adding a template, write it like you're texting a friend
// who just told you they're refactoring at midnight. On a bus.

import type { PersonalityState } from '@timetorelax/shared';

/**
 * The personality template bank. Keyed by agent state, valued by
 * an array of things we'd say to a developer who made the choice
 * to code on public transit. Each state needs at least 3 options
 * so we don't sound like a broken record. Although broken records
 * have their charm.
 *
 * Templates support `{key}` interpolation for dynamic values.
 * For example, `{n}` gets replaced with the actual file count.
 *
 * @see CLAUDE.md voice personality section for the source material
 */
export const templates: Record<PersonalityState, string[]> = {
  session_start: [
    "You're on the bus. You could be reading. But no. Here we are.",
    "Another day, another repo you'll abandon in three weeks.",
    "Let's pretend this is productive. What are we building?",
    'Back at it. Your commit history is going to look interesting.',
  ],

  session_timeout: [
    'You disappeared. Changes saved. Go live your life.',
    "Session expired. Your code is on a branch. You're welcome.",
    'Timed out. Your changes are safe. Your decisions are not.',
  ],

  session_resume: [
    'Back already? I saved your mess.',
    'You returned. The code is where you left it. The regret is fresh.',
    "Welcome back. Nothing broke while you were gone. Probably.",
  ],

  agent_thinking: [
    'Thinking. Unlike you before starting this at 11pm.',
    'Processing. Give me a second. Or several.',
    "Working on it. This is what passes for productivity now.",
  ],

  agent_reading: [
    'Reading your code. No comment. Yet.',
    "Going through your files. It's... certainly code.",
    'Reading the codebase. Reserving judgment. For now.',
  ],

  agent_writing: [
    'Writing files. Try not to interrupt.',
    'Making changes. You can review them later. Or never.',
    "Editing files. This is the part where you pretend you'd have done it differently.",
  ],

  agent_running: [
    'Running it. Fingers crossed. Mine, not yours.',
    'Executing. Hold your breath. Or just breathe normally.',
    'Running your code. Whatever happens, we both knew the risks.',
  ],

  build_success: [
    "It works. Don't touch it.",
    'Build passed. Miracles happen.',
    'Green across the board. Screenshot this. It may not last.',
  ],

  build_failed: [
    'Build failed. Obviously. Fixing it now.',
    'Build failed. Shocker. Give me a second.',
    "Build broke. On it. This is why we don't ship on Fridays.",
  ],

  files_changed: [
    '{n} files changed. Go touch grass.',
    'Changed {n} files. The bus is almost at your stop.',
    '{n} files touched. You did nothing. Perfectly delegated.',
  ],

  push_complete: [
    'Shipped from a bus. Your manager would be so proud.',
    'Branch pushed. PR ready. You did nothing. Perfect.',
    "Pushed. It's out there now. No take-backs.",
  ],

  push_failed: [
    "Push failed. Check your GitHub token. I'll wait.",
    'Push rejected. Either your token expired or the universe is telling you to stop.',
    'Could not push. Check your credentials and your life choices.',
  ],

  key_invalid: [
    "Your API key is dead. Check Settings. I'm not going anywhere.",
    'That key does not work. Double-check it. Take your time.',
    'Invalid key. Either it expired or you pasted the wrong thing. Classic.',
  ],

  rate_limited: [
    'Rate limited. Waiting {n}s. Use the time to question your choices.',
    'Too many requests. Cooling off for {n}s. Breathe.',
    'Rate limit hit. {n}s pause. Reflect on what led you here.',
  ],

  sandbox_crash: [
    'Sandbox died. Restarting. This is fine.',
    'The sandbox crashed. Spinning up a new one. Standard Tuesday.',
    'Sandbox went down. Recovering. Nothing to see here.',
  ],

  network_lost: [
    "Lost connection. Reconnecting. Stay calm. Or don't.",
    "Network dropped. Retrying. This is why we save often.",
    "Connection gone. Working on it. Welcome to mobile development.",
  ],

  error_recovery: [
    'Hit a wall. Finding another way around.',
    'That failed. Trying a different approach. Persistence is a personality trait.',
    'Recovering from that. Automatically. Unlike your sleep schedule.',
  ],
};
