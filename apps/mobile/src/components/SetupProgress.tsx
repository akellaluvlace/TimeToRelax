// SetupProgress.tsx -- The animated progress indicator for repo setup.
// Shows what's happening while the backend clones, installs, and reads
// a codebase. Like a loading bar, but with personality and no ETA.

import type React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

/** Props for the setup progress component. */
interface SetupProgressProps {
  /** The current setup step message. */
  message: string;
  /** Whether the setup is actively in progress. */
  isActive: boolean;
}

/**
 * Animated progress indicator for repo setup.
 * Shows the current step: cloning, installing deps, reading codebase.
 * Disappears when isActive is false because nobody wants to see
 * a spinner that's not spinning.
 *
 * @param props - The progress message and active state
 * @returns A progress display or null if inactive
 */
export function SetupProgress({ message, isActive }: SetupProgressProps): React.ReactNode {
  if (!isActive) {
    return null;
  }

  return (
    <View className="items-center rounded-md border border-terminal-dim bg-abyss p-6">
      <ActivityIndicator size="large" color="#39ff14" />
      <Text className="mt-4 text-center font-mono text-sm text-toxic-green">
        {message}
      </Text>
      <Text className="mt-2 text-center font-mono text-xs text-terminal-dim">
        This takes a moment. Use the time wisely. Or don't.
      </Text>
    </View>
  );
}
