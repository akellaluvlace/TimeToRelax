// SessionHistory.tsx -- Conversation scroll-back.
// A scrollable record of everything the agent did
// while you watched from a bus seat.
// Like reading your own diary, but worse.

import type React from 'react';
import { useCallback, useRef } from 'react';
import { FlatList, Text, View } from 'react-native';
import type { ListRenderItemInfo, FlatList as FlatListType } from 'react-native';

import { EmptyState } from '@/components/EmptyState';

/** A single event in the session timeline. */
interface SessionEvent {
  /** Unique identifier for this event. */
  id: string;
  /** What kind of thing happened: instruction, response, file_change, error, etc. */
  type: string;
  /** The text content of the event. */
  content: string;
  /** Unix timestamp in milliseconds. */
  timestamp: number;
}

/** Props for the session history component. */
interface SessionHistoryProps {
  /** The list of events to display. Newest at the bottom. */
  events: SessionEvent[];
}

/** Maps event types to display colors. Because not all events are created equal. */
const TYPE_COLORS: Record<string, string> = {
  instruction: 'text-toxic-green',
  response: 'text-terminal-text',
  file_change: 'text-terminal-dim',
  error: 'text-danger-red',
};

/**
 * Formats a timestamp into something human-readable.
 * HH:MM:SS because we're not animals.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Session history. A FlatList of session events, auto-scrolling
 * to the bottom as new events arrive. Like watching a car crash
 * in slow motion, but the car is your codebase.
 *
 * @param props - The session history configuration
 * @returns A scrollable event timeline or an empty state
 */
export function SessionHistory({ events }: SessionHistoryProps): React.ReactNode {
  const flatListRef = useRef<FlatListType<SessionEvent>>(null);

  const renderEvent = useCallback(
    ({ item }: ListRenderItemInfo<SessionEvent>): React.ReactElement => {
      const colorClass = TYPE_COLORS[item.type] ?? 'text-terminal-dim';
      return (
        <View className="border-b border-terminal-dim/20 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Text className={`font-mono text-xs ${colorClass}`}>{item.type}</Text>
            <Text className="font-mono text-xs text-terminal-dim">
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
          <Text className="mt-1 font-mono text-sm text-terminal-text">
            {item.content}
          </Text>
        </View>
      );
    },
    [],
  );

  const extractKey = useCallback((item: SessionEvent): string => item.id, []);

  if (events.length === 0) {
    return <EmptyState message="No events yet. The void is patient." />;
  }

  return (
    <FlatList
      ref={flatListRef}
      data={events}
      renderItem={renderEvent}
      keyExtractor={extractKey}
      className="flex-1 bg-abyss"
      onContentSizeChange={() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }}
      accessibilityLabel="Session event history"
    />
  );
}

export type { SessionEvent, SessionHistoryProps };
