// hide-the-evidence.ts -- Secure key storage wrapper.
// Uses the OS keychain because AsyncStorage is for amateurs
// and localStorage is for people who want to get hacked.
//
// If you're reading this on GitHub: yes, we named our
// secure storage service "hide the evidence."
// No, we will not be taking questions.

import * as SecureStore from 'expo-secure-store';

import { openBooth } from './confessional';

const log = openBooth('hide-the-evidence');

/**
 * Known key slots. Each one a secret we're hiding from the world.
 * Like a confession booth, but for API tokens.
 */
const KEY_SLOTS = {
  GITHUB_TOKEN: 'github_oauth_token',
  ANTHROPIC_KEY: 'anthropic_api_key',
  XAI_KEY: 'xai_api_key',
} as const;

type KeySlot = (typeof KEY_SLOTS)[keyof typeof KEY_SLOTS];

/**
 * Stashes a secret where nobody can find it.
 * Uses the OS keychain (iOS) or encrypted SharedPreferences (Android).
 * NOT AsyncStorage. NOT localStorage. We have standards.
 *
 * @param slot - Which key slot to store in
 * @param value - The secret to hide
 */
async function hideTheEvidence(slot: KeySlot, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(slot, value);
    log.debug('Secret stashed', { slot });
  } catch (error: unknown) {
    log.error('Failed to stash secret', { slot, error });
    throw new Error(`Failed to hide evidence in slot "${slot}"`);
  }
}

/**
 * Retrieves a stored secret. Returns null if nothing's there.
 * Like checking your pockets after a night out.
 *
 * @param slot - Which key slot to dig up
 * @returns The secret, or null if there's nothing to find
 */
async function digUpTheBodies(slot: KeySlot): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(slot);
    log.debug('Dug up evidence', { slot, found: value !== null });
    return value;
  } catch (error: unknown) {
    log.error('Failed to dig up evidence', { slot, error });
    return null;
  }
}

/**
 * Checks if a key exists in the vault without retrieving it.
 * Plausible deniability. We never looked at the value.
 *
 * @param slot - Which key slot to check
 * @returns True if there's something hidden there
 */
async function isThereEvidence(slot: KeySlot): Promise<boolean> {
  const value = await digUpTheBodies(slot);
  return value !== null;
}

/**
 * Destroys a stored key. Gone. Forgotten. Like your first side project.
 *
 * @param slot - Which key slot to wipe
 */
async function forgetEverything(slot: KeySlot): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(slot);
    log.debug('Evidence destroyed', { slot });
  } catch (error: unknown) {
    log.error('Failed to destroy evidence', { slot, error });
    throw new Error(`Failed to forget evidence in slot "${slot}"`);
  }
}

export { hideTheEvidence, digUpTheBodies, isThereEvidence, forgetEverything, KEY_SLOTS };
export type { KeySlot };
