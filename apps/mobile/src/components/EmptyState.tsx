// EmptyState.tsx -- The component you see when there's nothing to show.
// The void stares back.

import type React from 'react';
import { Text, View } from 'react-native';

/** Props for the empty state component. */
interface EmptyStateProps {
  /** The message to show in the void. */
  message?: string;
}

/**
 * A reusable empty state component.
 * For when there's genuinely nothing to display.
 * The digital equivalent of an empty fridge at 2am.
 *
 * @param props - The empty state configuration
 * @returns A centered empty state with personality
 */
export function EmptyState({
  message = 'Nothing here. Yet. Give it time.',
}: EmptyStateProps): React.ReactNode {
  return (
    <View className="flex-1 items-center justify-center bg-abyss px-6">
      <Text className="text-center font-mono text-lg text-terminal-dim">
        {'// _'}
      </Text>
      <Text className="mt-3 text-center font-mono text-base text-terminal-dim">
        {message}
      </Text>
    </View>
  );
}
