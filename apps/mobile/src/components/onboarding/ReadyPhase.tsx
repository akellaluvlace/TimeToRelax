// ReadyPhase.tsx -- The final phase.
// You made it. Keys are in. GitHub is connected.
// Now go build something you'll probably abandon.

import type React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { OnboardingStep } from '@/components/OnboardingStep';

/** Props for the ready phase. */
interface ReadyPhaseProps {
  /** Whether the xAI key was provided. Determines voice provider display. */
  hasXaiKey: boolean;
  /** Called when the user wants to start a new project. */
  onNewProject: () => void;
  /** Called when the user wants to connect an existing repo. */
  onConnectRepo: () => void;
}

/**
 * The final onboarding phase. Summarizes what was configured
 * and offers two paths forward: new project or existing repo.
 * Both lead to the same place: coding on a bus.
 *
 * @param props - Configuration summary and action callbacks
 * @returns The ready phase component
 */
export function ReadyPhase({
  hasXaiKey,
  onNewProject,
  onConnectRepo,
}: ReadyPhaseProps): React.ReactNode {
  const voiceLabel = hasXaiKey ? 'Grok (the upgrade)' : 'Deepgram (sensible default)';

  return (
    <OnboardingStep
      title="You're set."
      description="Start something you'll probably abandon."
    >
      <View className="mb-8 rounded-md border border-terminal-dim p-4">
        <StatusLine label="Anthropic key" value="alive" />
        <StatusLine label="GitHub" value="connected" />
        <StatusLine label="Voice" value={voiceLabel} />
      </View>

      <TouchableOpacity
        className="mb-3 items-center rounded-md border border-toxic-green px-6 py-4"
        onPress={onNewProject}
        accessibilityLabel="Start a new project"
        accessibilityRole="button"
      >
        <Text className="font-mono text-base text-toxic-green">New Project</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="items-center rounded-md border border-terminal-dim px-6 py-4"
        onPress={onConnectRepo}
        accessibilityLabel="Connect an existing repository"
        accessibilityRole="button"
      >
        <Text className="font-mono text-base text-terminal-dim">Connect Repo</Text>
      </TouchableOpacity>
    </OnboardingStep>
  );
}

/** Props for a single status line. */
interface StatusLineProps {
  label: string;
  value: string;
}

/** A key-value status line. Label in dim, value in green. */
function StatusLine({ label, value }: StatusLineProps): React.ReactNode {
  return (
    <View className="mb-1 flex-row justify-between">
      <Text className="font-mono text-sm text-terminal-dim">{label}:</Text>
      <Text className="font-mono text-sm text-toxic-green">{value}</Text>
    </View>
  );
}
