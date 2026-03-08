// onboarding.tsx -- Rock bottom.
// This is where it starts. Five phases of onboarding
// that walk you through giving us your API keys
// and connecting your GitHub so we can push code
// from your phone. On a bus. At 11pm.
// There is no step four.

import type React from 'react';
import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';

import { WelcomePhase } from '@/components/onboarding/WelcomePhase';
import { KeyInputPhase } from '@/components/onboarding/KeyInputPhase';
import { ReadyPhase } from '@/components/onboarding/ReadyPhase';
import { openBooth } from '@/services/confessional';
import { hideTheEvidence, KEY_SLOTS } from '@/services/hide-the-evidence';
import { useSettingsStore } from '@/store/settings-store';

const log = openBooth('onboarding');

/** The five stages of onboarding. Like grief, but with API keys. */
const PHASE_COUNT = 5;

/**
 * Onboarding screen. Five phases that take the user from
 * "I just installed this" to "I'm coding on public transit."
 *
 * Phase 0: Welcome
 * Phase 1: Anthropic API key (required)
 * Phase 2: GitHub token (required)
 * Phase 3: xAI key (optional)
 * Phase 4: Ready
 *
 * Keys are stored via expo-secure-store. Settings store is
 * updated to reflect what was provided. Once complete,
 * acceptFate() is called and there's no going back.
 *
 * @returns The onboarding screen component
 */
export default function OnboardingScreen(): React.ReactNode {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  const [xaiProvided, setXaiProvided] = useState(false);

  const advance = useCallback((): void => {
    setPhase((prev) => Math.min(prev + 1, PHASE_COUNT - 1));
  }, []);

  const handleAnthropicKey = useCallback(async (key: string): Promise<void> => {
    try {
      await hideTheEvidence(KEY_SLOTS.ANTHROPIC_KEY, key);
      useSettingsStore.getState().acknowledgeAnthropicKey(true);
      log.info('Anthropic key stashed during onboarding');
      advance();
    } catch (err: unknown) {
      log.error('Failed to store Anthropic key', {
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
  }, [advance]);

  const handleGithubToken = useCallback(async (token: string): Promise<void> => {
    try {
      await hideTheEvidence(KEY_SLOTS.GITHUB_TOKEN, token);
      useSettingsStore.getState().acknowledgeGithubToken(true);
      log.info('GitHub token stashed during onboarding');
      advance();
    } catch (err: unknown) {
      log.error('Failed to store GitHub token', {
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
  }, [advance]);

  const handleXaiKey = useCallback(async (key: string): Promise<void> => {
    try {
      await hideTheEvidence(KEY_SLOTS.XAI_KEY, key);
      useSettingsStore.getState().acknowledgeXaiKey(true);
      useSettingsStore.getState().pickYourPoison('grok');
      setXaiProvided(true);
      log.info('xAI key stashed during onboarding, voice upgraded to Grok');
      advance();
    } catch (err: unknown) {
      log.error('Failed to store xAI key', {
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
  }, [advance]);

  const handleSkipXai = useCallback((): void => {
    log.info('xAI key skipped. Deepgram it is.');
    advance();
  }, [advance]);

  const finishOnboarding = useCallback((destination: '/new-project' | '/existing-project'): void => {
    useSettingsStore.getState().acceptFate();
    log.info('Onboarding complete. No going back.', { destination });
    router.replace(destination);
  }, [router]);

  // Phase 0: Welcome
  if (phase === 0) {
    return <WelcomePhase onNext={advance} />;
  }

  // Phase 1: Anthropic API key (required)
  if (phase === 1) {
    return (
      <KeyInputPhase
        title="Enter your Anthropic API key."
        description="You already have one. We know you do."
        placeholder="sk-ant-..."
        onSubmit={(key) => void handleAnthropicKey(key)}
        helpUrl="https://console.anthropic.com/account/keys"
        inputLabel="Anthropic API key"
      />
    );
  }

  // Phase 2: GitHub token (required)
  if (phase === 2) {
    return (
      <KeyInputPhase
        title="Connect GitHub."
        description="We need it to push your regrettable decisions."
        placeholder="ghp_..."
        onSubmit={(token) => void handleGithubToken(token)}
        helpUrl="https://github.com/settings/tokens"
        inputLabel="GitHub personal access token"
      />
    );
  }

  // Phase 3: xAI key (optional)
  if (phase === 3) {
    return (
      <KeyInputPhase
        title="Want the premium voice experience?"
        description={
          "Add your xAI key for Grok Voice.\n" +
          "It's funnier. It's faster. It costs money.\n" +
          "Or skip. Deepgram works fine. We won't judge.\n" +
          '(We will judge a little.)'
        }
        placeholder="xai-..."
        onSubmit={(key) => void handleXaiKey(key)}
        optional
        onSkip={handleSkipXai}
        inputLabel="xAI API key"
      />
    );
  }

  // Phase 4: Ready
  return (
    <ReadyPhase
      hasXaiKey={xaiProvided}
      onNewProject={() => finishOnboarding('/new-project')}
      onConnectRepo={() => finishOnboarding('/existing-project')}
    />
  );
}
