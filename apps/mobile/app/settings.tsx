// settings.tsx -- The settings screen.
// Where you configure your preferred flavor of
// late-night mobile coding self-destruction.

import type React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { RadioGroup } from '@/components/RadioGroup';
import { useSettingsStore } from '@/store/settings-store';

/** The voice provider options, for display purposes. */
const VOICE_OPTIONS = [
  { value: 'deepgram' as const, label: 'Deepgram (default)' },
  { value: 'grok' as const, label: 'Grok (for the committed)' },
  { value: 'device' as const, label: 'Device STT (last resort)' },
];

/** The model options. Choose your fighter. */
const MODEL_OPTIONS = [
  { value: 'sonnet' as const, label: 'Sonnet (responsible)' },
  { value: 'opus' as const, label: 'Opus (ambitious)' },
];

/**
 * Settings screen. Where the user configures API keys,
 * voice provider, and default model.
 *
 * @returns The settings screen component
 */
export default function SettingsScreen(): React.ReactNode {
  const {
    voiceProvider,
    defaultModel,
    onboardingComplete,
    hasAnthropicKey,
    hasGithubToken,
    hasXaiKey,
    pickYourPoison,
    chooseYourFighter,
  } = useSettingsStore();

  // Loading state (placeholder for when we check key validity)
  const isLoading = false;
  if (isLoading) {
    return <LoadingState message="Checking your credentials..." />;
  }

  // Error state (placeholder for future key validation errors)
  const hasError = false;
  if (hasError) {
    return <ErrorState message="Failed to validate settings. Naturally." />;
  }

  // Empty state (shouldn't happen, but we handle it per the rules)
  const isEmpty = false;
  if (isEmpty) {
    return <EmptyState message="No settings to configure. How did you get here." />;
  }

  return (
    <View className="flex-1 bg-abyss px-6 pt-6">
      {/* API Keys Section */}
      <Text className="mb-4 font-mono text-lg text-toxic-green">API Keys</Text>
      <KeyCard
        title="Anthropic API Key"
        description={hasAnthropicKey ? 'Configured. Proof of life confirmed.' : 'Not configured. You need this to do anything.'}
        buttonLabel={hasAnthropicKey ? 'Change key' : 'Add key'}
        onPress={() => useSettingsStore.getState().acknowledgeAnthropicKey(!hasAnthropicKey)}
        accessibilityLabel="Configure Anthropic API key"
      />
      <KeyCard
        title="GitHub Token"
        description={hasGithubToken ? 'Configured. Ready to ship from inappropriate locations.' : 'Not configured. Optional until you want to push.'}
        buttonLabel={hasGithubToken ? 'Change token' : 'Add token'}
        onPress={() => useSettingsStore.getState().acknowledgeGithubToken(!hasGithubToken)}
        accessibilityLabel="Configure GitHub token"
      />
      <KeyCard
        title="xAI API Key"
        description={hasXaiKey ? 'Configured. Maximum chaos enabled.' : 'Not configured. Grok Voice needs this to judge you properly.'}
        buttonLabel={hasXaiKey ? 'Change key' : 'Add key'}
        onPress={() => useSettingsStore.getState().acknowledgeXaiKey(!hasXaiKey)}
        accessibilityLabel="Configure xAI API key"
      />

      {/* Voice Provider */}
      <Text className="mb-4 mt-2 font-mono text-lg text-toxic-green">Voice Provider</Text>
      <RadioGroup options={VOICE_OPTIONS} selected={voiceProvider} onSelect={pickYourPoison} />

      {/* Model Selection */}
      <Text className="mb-4 font-mono text-lg text-toxic-green">Default Model</Text>
      <RadioGroup options={MODEL_OPTIONS} selected={defaultModel} onSelect={chooseYourFighter} />

      {/* Status */}
      <Text className="font-mono text-xs text-terminal-dim">
        Onboarding: {onboardingComplete ? 'Complete. No going back.' : 'Pending.'}
      </Text>
    </View>
  );
}

/** Props for the key card sub-component. */
interface KeyCardProps {
  title: string;
  description: string;
  buttonLabel: string;
  onPress: () => void;
  accessibilityLabel: string;
}

/** A card for an API key entry. Extracted to keep the screen under 150 lines. */
function KeyCard({ title, description, buttonLabel, onPress, accessibilityLabel }: KeyCardProps): React.ReactNode {
  return (
    <View className="mb-3 rounded-md border border-terminal-dim p-4">
      <Text className="font-mono text-sm text-terminal-text">{title}</Text>
      <Text className="mt-1 font-mono text-xs text-terminal-dim">{description}</Text>
      <TouchableOpacity
        className="mt-3 rounded-md border border-toxic-green px-4 py-2"
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <Text className="font-mono text-xs text-toxic-green">{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}
