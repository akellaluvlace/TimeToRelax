// ErrorState.tsx -- The component you see when things go wrong.
// Which is often. Welcome to software.

import type React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

/** Props for the error state component. */
interface ErrorStateProps {
  /** What went wrong. Keep it honest. */
  message?: string;
  /** Optional retry handler. Hope springs eternal. */
  onRetry?: () => void;
}

/**
 * A reusable error state component.
 * Displays an error message and an optional retry button
 * for the optimists among us.
 *
 * @param props - The error state configuration
 * @returns A centered error display with optional retry
 */
export function ErrorState({
  message = 'Something broke. Naturally.',
  onRetry,
}: ErrorStateProps): React.ReactNode {
  return (
    <View className="flex-1 items-center justify-center bg-abyss px-6">
      <Text className="text-center font-mono text-lg text-danger-red">
        {'//'}
      </Text>
      <Text className="mt-3 text-center font-mono text-base text-terminal-text">
        {message}
      </Text>
      {onRetry ? (
        <TouchableOpacity
          className="mt-6 rounded-md border border-toxic-green px-6 py-3"
          onPress={onRetry}
          accessibilityLabel="Retry"
          accessibilityRole="button"
        >
          <Text className="font-mono text-sm text-toxic-green">
            Try again despite evidence
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
