// ConnectionStatus.tsx -- The tiny bar that tells you
// whether the app can still hear the server.
// Small. Unobtrusive. Slightly judgmental.

import type React from 'react';
import { Text, View } from 'react-native';

/** Props for the connection status indicator. */
interface ConnectionStatusProps {
  /** Whether we have an active connection to the server. */
  isConnected: boolean;
  /** Whether we are currently trying to reconnect. */
  isReconnecting: boolean;
  /** Custom message to display. We have defaults, but you do you. */
  message?: string;
}

/**
 * A small status bar that appears at the top of the screen
 * when the connection drops. Auto-hides when reconnected.
 * Because nobody needs a permanent reminder that things are fine.
 *
 * @param props - Connection state and optional custom message
 * @returns A status bar or nothing, depending on connection state
 */
export function ConnectionStatus({
  isConnected,
  isReconnecting,
  message,
}: ConnectionStatusProps): React.ReactNode {
  if (isConnected) return null;

  const displayMessage = message
    ?? (isReconnecting
      ? 'Reconnecting. Hold on.'
      : 'Lost connection. Reconnecting shortly.');

  return (
    <View className="bg-danger-red px-4 py-2">
      <Text className="text-center font-mono text-xs text-terminal-dim">
        {displayMessage}
      </Text>
    </View>
  );
}

export type { ConnectionStatusProps };
