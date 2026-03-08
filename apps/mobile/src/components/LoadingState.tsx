// LoadingState.tsx -- The component you see while the app
// pretends to be doing something important.

import type React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

/** Props for the loading state component. */
interface LoadingStateProps {
  /** The message to show while waiting. Make it cynical. */
  message?: string;
}

/**
 * A reusable loading state component.
 * Displays a spinner and a message while we wait for
 * whatever inevitable disappointment is loading.
 *
 * @param props - The loading state configuration
 * @returns A centered loading indicator with personality
 */
export function LoadingState({
  message = 'Working on it. Unlike you.',
}: LoadingStateProps): React.ReactNode {
  return (
    <View className="flex-1 items-center justify-center bg-abyss px-6">
      <ActivityIndicator size="large" color="#39ff14" />
      <Text className="mt-4 text-center font-mono text-base text-terminal-dim">
        {message}
      </Text>
    </View>
  );
}
