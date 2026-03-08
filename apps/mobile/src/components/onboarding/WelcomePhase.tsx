// WelcomePhase.tsx -- The first thing you see.
// A brief explanation of what you've gotten yourself into.
// There is no step four.

import type React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { OnboardingStep } from '@/components/OnboardingStep';

/** Props for the welcome phase. */
interface WelcomePhaseProps {
  /** Called when the user accepts their fate and moves on. */
  onNext: () => void;
}

/**
 * Welcome phase. Step one of the descent.
 * Explains the three-step process (there is no step four)
 * and gives the user one last chance to reconsider.
 * They won't.
 *
 * @param props - The next callback
 * @returns The welcome phase component
 */
export function WelcomePhase({ onNext }: WelcomePhaseProps): React.ReactNode {
  return (
    <OnboardingStep
      title="You're here. That's step one."
      description={
        'Step two is giving us your keys.\n' +
        'Step three is coding on a bus.\n' +
        'There is no step four.'
      }
    >
      <TouchableOpacity
        className="mt-4 items-center rounded-md border border-toxic-green px-6 py-4"
        onPress={onNext}
        accessibilityLabel="Begin onboarding"
        accessibilityRole="button"
      >
        <Text className="font-mono text-base text-toxic-green">
          {"Let's do this"}
        </Text>
      </TouchableOpacity>
    </OnboardingStep>
  );
}
