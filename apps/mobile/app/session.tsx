// session.tsx -- The session screen.
// Where you watch your code being written by an agent
// while you sit on a bus pretending this is normal.
// Now with tabs, diffs, and a file preview. Like a real IDE.
// Except it's on your phone. On a bus. At 11pm.

import type React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { SessionView } from '@/components/SessionView';
import { openBooth } from '@/services/confessional';
import { useSessionStore } from '@/store/session-store';

const log = openBooth('session-screen');

// TODO(nikita): Make this configurable from settings or env.
// Hardcoded for now because Railway gives us one URL and we're keeping it simple.
const BACKEND_URL = 'https://api.timetorelax.app';

/**
 * Session screen. The main event.
 * Shows the SessionView with tabbed navigation (Diff, Files, Preview),
 * voice controls, and the growing list of files being modified
 * without a laptop in sight. Handles loading, error, and empty states
 * because every screen must earn its keep.
 *
 * @returns The session screen component
 */
export default function SessionScreen(): React.ReactNode {
  const { currentSession, phase, isLoading, lastError } = useSessionStore();

  // Error state. Something broke during the session.
  if (lastError) {
    return (
      <ErrorState
        message={lastError}
        onRetry={() => useSessionStore.getState().recordRegret(null)}
      />
    );
  }

  // Loading state. Session is being created.
  if (isLoading) {
    return <LoadingState message="Spawning regret..." />;
  }

  // Empty state. No session active.
  if (!currentSession || !phase) {
    return (
      <EmptyState message="No active session. Go back and start one. If you dare." />
    );
  }

  // Active session. Show the tabbed view with diffs, files, and preview.
  return (
    <View className="flex-1 bg-abyss">
      {/* Phase indicator -- compact header */}
      <View className="flex-row items-center justify-between border-b border-terminal-dim px-4 py-3">
        <View>
          <Text className="font-mono text-xs uppercase text-terminal-dim">
            Phase
          </Text>
          <Text className="font-mono text-sm text-toxic-green">
            {phase}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-mono text-xs text-terminal-dim">
            {currentSession.turnsUsed} turns | {currentSession.filesChanged} files
          </Text>
          <TouchableOpacity
            onPress={() => {
              log.info('User ended session from header');
              useSessionStore.getState().releaseYouFromYourself();
            }}
            accessibilityLabel="End session"
            accessibilityRole="button"
          >
            <Text className="mt-1 font-mono text-xs text-danger-red">
              End session
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabbed session view with diff, files, preview, and mic */}
      <SessionView
        sessionId={currentSession.id}
        backendUrl={BACKEND_URL}
      />
    </View>
  );
}
