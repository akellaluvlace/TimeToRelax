// OnboardingStep.tsx -- A single step in the descent.
// Reusable layout for each phase of onboarding.
// Title in green. Description in dim. Dark background.
// Like a terminal that's slowly recruiting you.

import type React from 'react';
import { ScrollView, Text, View } from 'react-native';

/** Props for one step in the onboarding gauntlet. */
interface OnboardingStepProps {
  /** The step title. Short. Punchy. Slightly threatening. */
  title: string;
  /** Elaboration on what this step demands of the user. */
  description: string;
  /** The action area: buttons, inputs, whatever this step requires. */
  children: React.ReactNode;
}

/**
 * A single onboarding step. Centered layout, generous spacing,
 * monospace throughout because we're building a terminal app
 * and we commit to the bit.
 *
 * @param props - The step configuration
 * @returns A styled onboarding step layout
 */
export function OnboardingStep({
  title,
  description,
  children,
}: OnboardingStepProps): React.ReactNode {
  return (
    <ScrollView
      className="flex-1 bg-abyss"
      contentContainerClassName="flex-grow justify-center px-8 py-12"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="font-mono text-2xl text-toxic-green">{title}</Text>
      <Text className="mt-4 font-mono text-sm leading-6 text-terminal-dim">
        {description}
      </Text>
      <View className="mt-8">{children}</View>
    </ScrollView>
  );
}
