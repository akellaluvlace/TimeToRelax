// session.tsx -- The session screen.
// Where you watch your code being written by an agent
// while you sit on a bus pretending this is normal.

import type React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useSessionStore } from '@/store/session-store';
import { useVoiceStore } from '@/store/voice-store';

/**
 * Session screen. The main event.
 * Shows the agent's progress, voice controls, and the growing
 * list of files that are being modified without a laptop in sight.
 *
 * @returns The session screen component
 */
export default function SessionScreen(): React.ReactNode {
  const { currentSession, phase, isLoading, lastError } = useSessionStore();
  const { voiceState, isMicActive, lastTranscript } = useVoiceStore();

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

  // Active session. Show the grief cycle in action.
  return (
    <View className="flex-1 bg-abyss px-6 pt-6">
      {/* Phase indicator */}
      <View className="mb-6 rounded-md border border-terminal-dim p-4">
        <Text className="font-mono text-xs uppercase text-terminal-dim">
          Current Phase
        </Text>
        <Text className="mt-1 font-mono text-lg text-toxic-green">
          {phase}
        </Text>
        <Text className="mt-2 font-mono text-xs text-terminal-dim">
          {currentSession.turnsUsed} turns used | {currentSession.filesChanged} files changed
        </Text>
      </View>

      {/* Voice status */}
      <View className="mb-6 rounded-md border border-terminal-dim p-4">
        <Text className="font-mono text-xs uppercase text-terminal-dim">
          Voice
        </Text>
        <Text className="mt-1 font-mono text-sm text-terminal-text">
          {voiceState} {isMicActive ? '(mic hot)' : ''}
        </Text>
        {lastTranscript ? (
          <Text className="mt-2 font-mono text-xs text-terminal-dim">
            Last: &quot;{lastTranscript}&quot;
          </Text>
        ) : null}
      </View>

      {/* Voice control placeholder */}
      <TouchableOpacity
        className={`items-center rounded-full border px-6 py-4 ${
          isMicActive ? 'border-danger-red' : 'border-toxic-green'
        }`}
        onPress={() => {
          if (isMicActive) {
            useVoiceStore.getState().mercifully();
          } else {
            useVoiceStore.getState().openMouth();
          }
        }}
        accessibilityLabel={isMicActive ? 'Stop recording' : 'Start recording'}
        accessibilityRole="button"
      >
        <Text
          className={`font-mono text-base ${
            isMicActive ? 'text-danger-red' : 'text-toxic-green'
          }`}
        >
          {isMicActive ? 'Shut it' : 'Speak'}
        </Text>
      </TouchableOpacity>

      {/* End session */}
      <TouchableOpacity
        className="mt-6 items-center rounded-md border border-danger-red px-6 py-3"
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
