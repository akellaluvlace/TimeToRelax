// index.tsx -- The home screen.
// The first thing you see when you open the app.
// The last chance to close it and go outside.

import type React from 'react';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useSessionStore } from '@/store/session-store';
import { useSettingsStore } from '@/store/settings-store';

/**
 * Home screen. The launchpad for your coding-on-the-bus adventures.
 * Shows current session status or an invitation to start one.
 *
 * @returns The home screen component
 */
export default function HomeScreen(): React.ReactNode {
  const router = useRouter();
  const { currentSession, phase, isLoading, lastError } = useSessionStore();
  const { hasAnthropicKey } = useSettingsStore();

  // Something went wrong. Show it.
  if (lastError) {
    return (
      <ErrorState
        message={lastError}
        onRetry={() => useSessionStore.getState().recordRegret(null)}
      />
    );
  }

  // We're loading something. Patience.
  if (isLoading) {
    return <LoadingState message="Spawning regret..." />;
  }

  // Active session exists. Show status and option to resume.
  if (currentSession && phase) {
    return (
      <View className="flex-1 bg-abyss px-6 pt-12">
        <Text className="font-mono text-lg text-toxic-green">
          Active Session
        </Text>
        <Text className="mt-2 font-mono text-sm text-terminal-dim">
          Phase: {phase}
        </Text>
        <Text className="mt-1 font-mono text-sm text-terminal-dim">
          Files changed: {currentSession.filesChanged}
        </Text>
        <Text className="mt-1 font-mono text-sm text-terminal-dim">
          Turns used: {currentSession.turnsUsed}
        </Text>

        <TouchableOpacity
          className="mt-8 items-center rounded-md border border-toxic-green px-6 py-4"
          onPress={() => router.push('/session')}
          accessibilityLabel="Resume session"
          accessibilityRole="button"
        >
          <Text className="font-mono text-base text-toxic-green">
            Resume the damage
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-4 items-center rounded-md border border-danger-red px-6 py-3"
          onPress={() => useSessionStore.getState().releaseYouFromYourself()}
          accessibilityLabel="End session"
          accessibilityRole="button"
        >
          <Text className="font-mono text-sm text-danger-red">
            End session
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No session. The void awaits.
  if (!hasAnthropicKey) {
    return (
      <View className="flex-1 bg-abyss px-6 pt-12">
        <EmptyState message="No API key configured. Visit Settings first." />
        <TouchableOpacity
          className="mx-6 mt-4 items-center rounded-md border border-toxic-green px-6 py-3"
          onPress={() => router.push('/settings')}
          accessibilityLabel="Go to settings"
          accessibilityRole="button"
        >
          <Text className="font-mono text-sm text-toxic-green">
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-abyss px-6 pt-12">
      <Text className="font-mono text-2xl text-toxic-green">
        {'//'}
      </Text>
      <Text className="mt-2 font-mono text-xl text-terminal-text">
        TimeToRelax
      </Text>
      <Text className="mt-4 font-mono text-sm text-terminal-dim">
        You could be reading a book. But here we are.
      </Text>

      <TouchableOpacity
        className="mt-12 items-center rounded-md border border-toxic-green px-6 py-4"
        onPress={() => router.push('/session')}
        accessibilityLabel="Start new session"
        accessibilityRole="button"
      >
        <Text className="font-mono text-base text-toxic-green">
          Start a session
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-4 items-center rounded-md border border-terminal-dim px-6 py-3"
        onPress={() => router.push('/settings')}
        accessibilityLabel="Go to settings"
        accessibilityRole="button"
      >
        <Text className="font-mono text-sm text-terminal-dim">
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}
