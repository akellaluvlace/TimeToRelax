// FileTree.tsx -- A flat list of files the agent has touched.
// Green for created. Yellow for modified. Red for deleted.
// Like a traffic light, but for your codebase's emotional state.

import type React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import type { FileChange } from '@/hooks/useAgentSession';

/** Props for the FileTree component. */
interface FileTreeProps {
  /** The files the agent has created, modified, or deleted. */
  files: FileChange[];
  /** Optional callback when a file is selected. For the curious. */
  onFileSelect?: (path: string) => void;
}

/** Maps file action to a color class. The traffic light of code changes. */
const ACTION_COLORS = {
  created: 'text-toxic-green',
  modified: 'text-warning-yellow',
  deleted: 'text-danger-red',
} as const;

/** Maps file action to a label. Short, clear, judgmental. */
const ACTION_LABELS = {
  created: '+',
  modified: '~',
  deleted: '-',
} as const;

/**
 * Renders a flat list of files the agent has created, modified, or deleted.
 * Color-coded because reading diffs on a bus is hard enough without
 * also having to parse plain text.
 *
 * @param props - The file list and optional selection handler
 * @returns A color-coded file tree, or an empty state if nothing's changed yet
 */
export function FileTree({ files, onFileSelect }: FileTreeProps): React.ReactNode {
  if (files.length === 0) {
    return (
      <View className="rounded-md border border-terminal-dim p-4">
        <Text className="text-center font-mono text-sm text-terminal-dim">
          No files changed yet. The agent is warming up.
        </Text>
      </View>
    );
  }

  return (
    <View className="rounded-md border border-terminal-dim">
      <FlatList
        data={files}
        keyExtractor={(item) => item.path}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const colorClass = ACTION_COLORS[item.action];
          const label = ACTION_LABELS[item.action];

          const content = (
            <View className="flex-row items-center border-b border-terminal-dim/20 px-3 py-2">
              <Text className={`font-mono text-sm ${colorClass} w-6`}>
                {label}
              </Text>
              <Text
                className="flex-1 font-mono text-sm text-terminal-text"
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {item.path}
              </Text>
            </View>
          );

          if (onFileSelect) {
            return (
              <TouchableOpacity
                onPress={() => onFileSelect(item.path)}
                accessibilityLabel={`${item.action} file: ${item.path}`}
                accessibilityRole="button"
              >
                {content}
              </TouchableOpacity>
            );
          }

          return content;
        }}
      />
      <View className="px-3 py-2">
        <Text className="font-mono text-xs text-terminal-dim">
          {files.length} file{files.length === 1 ? '' : 's'} changed
        </Text>
      </View>
    </View>
  );
}
