// LivePreview.tsx -- Shows the running app preview from E2B.
// For MVP, we just show a tappable URL that opens in the browser.
// WebView integration comes later, when we trust ourselves more.

import type React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

import { openBooth } from '@/services/confessional';

const log = openBooth('LivePreview');

/** Props for the LivePreview component. */
interface LivePreviewProps {
  /** The preview URL from E2B. null means the preview isn't ready yet. */
  url: string | null;
}

/**
 * Shows the live preview of the running project.
 * For MVP, this is a tappable link that opens in the system browser.
 * Full WebView integration comes when react-native-webview is wired up.
 *
 * @param props - The preview URL (null if not ready)
 * @returns A preview link or a waiting state
 */
export function LivePreview({ url }: LivePreviewProps): React.ReactNode {
  if (!url) {
    return (
      <View className="rounded-md border border-terminal-dim p-4">
        <Text className="text-center font-mono text-sm text-terminal-dim">
          Waiting for preview... The agent is still building.
        </Text>
      </View>
    );
  }

  const onPressPreview = async (): Promise<void> => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        log.warn('Cannot open preview URL', { url });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to open URL';
      log.error('Failed to open preview URL', { url, error: message });
    }
  };

  return (
    <View className="rounded-md border border-toxic-green p-4">
      <Text className="font-mono text-xs uppercase text-terminal-dim">
        Preview Ready
      </Text>
      <TouchableOpacity
        onPress={() => void onPressPreview()}
        accessibilityLabel="Open preview in browser"
        accessibilityRole="link"
        className="mt-2"
      >
        <Text className="font-mono text-sm text-toxic-green underline" numberOfLines={1}>
          {url}
        </Text>
      </TouchableOpacity>
      <Text className="mt-2 font-mono text-xs text-terminal-dim">
        Tap to open in browser. WebView coming soon.
      </Text>
    </View>
  );
}
