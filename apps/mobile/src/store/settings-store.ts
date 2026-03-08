// settings-store.ts -- Zustand store for user settings.
// The configuration panel for your worst habits.

import { create } from 'zustand';

import type { VoiceProvider } from '@timetorelax/shared';

import { openBooth } from '@/services/confessional';

const log = openBooth('settings-store');

/** The shape of the settings store. Preferences for your preferred form of self-destruction. */
interface SettingsStore {
  /** Preferred voice provider. Start with the default until proven otherwise. */
  voiceProvider: VoiceProvider;
  /** Default model for new sessions. Sonnet unless the user enjoys large invoices. */
  defaultModel: 'sonnet' | 'opus';
  /** Whether the user has completed onboarding. aka accepted their fate. */
  onboardingComplete: boolean;
  /** Whether the user has an Anthropic API key configured. */
  hasAnthropicKey: boolean;
  /** Whether the user has a GitHub token configured. */
  hasGithubToken: boolean;

  /**
   * Updates the voice provider preference.
   * Choosing your dealer, essentially.
   */
  pickYourPoison: (provider: VoiceProvider) => void;

  /**
   * Sets the default model.
   * Sonnet is responsible. Opus is ambitious. Choose wisely.
   */
  chooseYourFighter: (model: 'sonnet' | 'opus') => void;

  /**
   * Marks onboarding as complete.
   * There's no going back now. Not that there ever was.
   */
  acceptFate: () => void;

  /**
   * Updates whether we have an Anthropic key stored.
   * The key to the kingdom. Or at least the API.
   */
  acknowledgeAnthropicKey: (hasKey: boolean) => void;

  /**
   * Updates whether we have a GitHub token stored.
   * The ticket to ship from inappropriate locations.
   */
  acknowledgeGithubToken: (hasToken: boolean) => void;
}

/**
 * The settings store. Where the user configures their
 * preferred flavor of late-night mobile coding.
 */
export const useSettingsStore = create<SettingsStore>((set) => ({
  voiceProvider: 'deepgram',
  defaultModel: 'sonnet',
  onboardingComplete: false,
  hasAnthropicKey: false,
  hasGithubToken: false,

  pickYourPoison: (provider: VoiceProvider): void => {
    log.info('Voice provider changed', { provider });
    set({ voiceProvider: provider });
  },

  chooseYourFighter: (model: 'sonnet' | 'opus'): void => {
    log.info('Default model changed', { model });
    set({ defaultModel: model });
  },

  acceptFate: (): void => {
    log.info('Onboarding complete. There is no going back.');
    set({ onboardingComplete: true });
  },

  acknowledgeAnthropicKey: (hasKey: boolean): void => {
    log.debug('Anthropic key status', { hasKey });
    set({ hasAnthropicKey: hasKey });
  },

  acknowledgeGithubToken: (hasToken: boolean): void => {
    log.debug('GitHub token status', { hasToken });
    set({ hasGithubToken: hasToken });
  },
}));
