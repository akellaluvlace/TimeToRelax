// DiffView.tsx -- The full diff view.
// Renders all file diffs in a scrollable list with a summary header.
// Because reviewing code changes on the bus is the future apparently.

import type React from 'react';
import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { DiffFile } from '@/components/DiffFile';
import { EmptyState } from '@/components/EmptyState';
import type { FileDiff } from '@/types/diff';

/** Props for the DiffView component. */
interface DiffViewProps {
  /** The parsed diffs for all changed files. */
  diffs: FileDiff[];
  /** Optional callback when a file path is selected. For the curious. */
  onFileSelect?: (path: string) => void;
}

/**
 * Renders a summary + scrollable list of file diffs.
 * Shows total files changed, additions, and deletions at the top.
 * Each file is collapsible because nobody wants to see every
 * line change on a phone screen all at once.
 *
 * @param props - The diffs to render and optional file selection callback
 * @returns A full diff view with summary and collapsible file diffs
 */
export function DiffView({ diffs, onFileSelect }: DiffViewProps): React.ReactNode {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });

    // Fire the onFileSelect callback when expanding a file
    if (onFileSelect && !expandedPaths.has(path)) {
      onFileSelect(path);
    }
  }, [onFileSelect, expandedPaths]);

  if (diffs.length === 0) {
    return <EmptyState message="No diffs yet. The agent hasn't broken anything. Yet." />;
  }

  const totalAdditions = diffs.reduce((sum, d) => sum + d.additions, 0);
  const totalDeletions = diffs.reduce((sum, d) => sum + d.deletions, 0);

  return (
    <View className="flex-1">
      {/* Summary header */}
      <View className="border-b border-terminal-dim px-3 py-2">
        <Text className="font-mono text-xs text-terminal-dim">
          {diffs.length} file{diffs.length === 1 ? '' : 's'} changed,{' '}
          <Text className="text-toxic-green">{totalAdditions} addition{totalAdditions === 1 ? '' : 's'}</Text>
          {', '}
          <Text className="text-danger-red">{totalDeletions} deletion{totalDeletions === 1 ? '' : 's'}</Text>
        </Text>
      </View>

      {/* File diffs */}
      <FlatList
        data={diffs}
        keyExtractor={(item) => item.path}
        renderItem={({ item }) => (
          <DiffFile
            diff={item}
            isExpanded={expandedPaths.has(item.path)}
            onToggle={() => toggleExpanded(item.path)}
          />
        )}
      />
    </View>
  );
}
