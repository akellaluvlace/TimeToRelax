// FilePreview.tsx -- Shows a file's contents with line numbers.
// A read-only code viewer for your phone screen.
// Perfect for reviewing code while pretending to read texts.

import type React from 'react';
import { ScrollView, Text, View } from 'react-native';

/** Props for the FilePreview component. */
interface FilePreviewProps {
  /** The raw file content to display. */
  content: string;
  /** The file path, shown as a header. */
  path: string;
}

/**
 * Read-only file content viewer with line numbers and monospace font.
 * Shows the contents of a file in a scrollable view.
 * Like cat but with a nicer UI and worse performance.
 *
 * @param props - The file content and path to display
 * @returns A scrollable file viewer with line numbers
 */
export function FilePreview({ content, path }: FilePreviewProps): React.ReactNode {
  const lines = content.split('\n');

  if (!content.trim()) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="font-mono text-sm text-terminal-dim">
          Empty file. Nothing to see here.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* File path header */}
      <View className="border-b border-terminal-dim px-3 py-2">
        <Text
          className="font-mono text-xs text-terminal-dim"
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {path}
        </Text>
      </View>

      {/* File content with line numbers */}
      <ScrollView className="flex-1" horizontal={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View className="p-2">
            {lines.map((line, idx) => (
              <View key={`line-${idx}`} className="flex-row">
                <Text className="w-10 pr-2 text-right font-mono text-xs text-terminal-dim">
                  {idx + 1}
                </Text>
                <Text className="font-mono text-xs text-terminal-text">
                  {line || ' '}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}
