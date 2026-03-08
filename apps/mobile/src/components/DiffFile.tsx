// DiffFile.tsx -- Renders a single file's diff.
// The header. The line numbers. The green and red.
// A traffic light for your code changes, readable on a 6-inch screen.

import type React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import type { FileDiff } from '@/types/diff';

/** Props for the DiffFile component. */
interface DiffFileProps {
  /** The parsed diff for this file. */
  diff: FileDiff;
  /** Whether the diff lines are visible. */
  isExpanded: boolean;
  /** Toggle expanded/collapsed state. Tap to see the damage. */
  onToggle: () => void;
}

/** Maps file action to a badge style. Color-coded for quick scanning. */
const ACTION_BADGE_STYLES = {
  created: 'bg-toxic-green/20 text-toxic-green',
  modified: 'bg-warning-yellow/20 text-warning-yellow',
  deleted: 'bg-danger-red/20 text-danger-red',
} as const;

/** Maps diff line type to background color. The traffic light of diffs. */
const LINE_BG = {
  add: 'bg-toxic-green/10',
  remove: 'bg-danger-red/10',
  context: '',
} as const;

/** Maps diff line type to text color. So you know what's new and what's dead. */
const LINE_TEXT = {
  add: 'text-toxic-green',
  remove: 'text-danger-red',
  context: 'text-terminal-text',
} as const;

/**
 * Renders a single file's diff with a collapsible header.
 * The header shows the file path, action badge, and addition/deletion counts.
 * Tap it to expand and see the actual line-by-line damage.
 *
 * @param props - The file diff, expansion state, and toggle callback
 * @returns A collapsible file diff section
 */
export function DiffFile({ diff, isExpanded, onToggle }: DiffFileProps): React.ReactNode {
  return (
    <View className="border-b border-terminal-dim/30">
      {/* File header -- tappable to expand/collapse */}
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center justify-between px-3 py-2"
        accessibilityLabel={`${diff.action} file: ${diff.path}, ${diff.additions} additions, ${diff.deletions} deletions`}
        accessibilityRole="button"
      >
        <View className="flex-1 flex-row items-center">
          <Text className="mr-2 font-mono text-xs text-terminal-dim">
            {isExpanded ? '\u25BC' : '\u25B6'}
          </Text>
          <View className={`mr-2 rounded px-1.5 py-0.5 ${ACTION_BADGE_STYLES[diff.action]}`}>
            <Text className={`font-mono text-xs ${ACTION_BADGE_STYLES[diff.action]}`}>
              {diff.action}
            </Text>
          </View>
          <Text
            className="flex-1 font-mono text-sm text-terminal-text"
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {diff.path}
          </Text>
        </View>
        <Text className="font-mono text-xs text-terminal-dim">
          <Text className="text-toxic-green">+{diff.additions}</Text>
          {' / '}
          <Text className="text-danger-red">-{diff.deletions}</Text>
        </Text>
      </TouchableOpacity>

      {/* Diff lines -- only shown when expanded */}
      {isExpanded ? (
        <View className="bg-abyss/50">
          {diff.hunks.map((hunk, hunkIdx) => (
            <View key={`hunk-${hunkIdx}`}>
              {hunk.lines.map((line, lineIdx) => (
                <View
                  key={`line-${hunkIdx}-${lineIdx}`}
                  className={`flex-row ${LINE_BG[line.type]}`}
                >
                  <Text className="w-10 px-1 text-right font-mono text-xs text-terminal-dim">
                    {line.lineNumber}
                  </Text>
                  <Text
                    className={`flex-1 px-2 font-mono text-xs ${LINE_TEXT[line.type]}`}
                    numberOfLines={1}
                  >
                    {line.content}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
