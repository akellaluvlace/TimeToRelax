// ShipBar.tsx -- The ship flow UI. Three buttons that take your code
// from "local changes" to "someone else's problem" in three taps.
// Accept -> Push -> Create PR. Order matters. Chaos doesn't ship.

import type React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { useShipFlow } from '@/hooks/useShipFlow';

/** Props for the ship bar. The numbers that make you feel productive. */
interface ShipBarProps {
  sessionId: string;
  backendUrl: string;
  filesChanged: number;
  additions: number;
  deletions: number;
}

/**
 * The ship flow UI component. Shows a summary of changes and
 * three sequential action buttons: Accept, Push, Create PR.
 * Each button enables after the previous step completes.
 * Under 150 lines because we have standards.
 *
 * @param props - Session info and change statistics
 * @returns The ship bar UI
 */
export function ShipBar({
  sessionId,
  backendUrl,
  filesChanged,
  additions,
  deletions,
}: ShipBarProps): React.ReactNode {
  const {
    isAccepting,
    isPushing,
    isCreatingPR,
    acceptResult,
    pushResult,
    prUrl,
    error,
    acceptChanges,
    pushToGitHub,
    createPR,
  } = useShipFlow(sessionId, backendUrl);

  const canPush = acceptResult !== null && pushResult === null;
  const canCreatePR = pushResult !== null && prUrl === null;

  return (
    <View className="bg-abyss border-t border-terminal-dim/20 px-4 py-3">
      {/* Change summary */}
      <Text className="mb-3 font-mono text-sm text-terminal-dim">
        {filesChanged} files changed, +{additions} -{deletions}
      </Text>

      {/* Error display */}
      {error ? (
        <Text className="mb-2 font-mono text-xs text-danger-red">
          {error}
        </Text>
      ) : null}

      {/* Step 1: Accept */}
      <TouchableOpacity
        className={`mb-2 rounded-md border px-4 py-3 ${
          acceptResult
            ? 'border-toxic-green/50 bg-toxic-green/10'
            : 'border-toxic-green'
        }`}
        onPress={() => void acceptChanges('session changes')}
        disabled={isAccepting || acceptResult !== null}
        accessibilityLabel="Accept changes"
        accessibilityRole="button"
      >
        {isAccepting ? (
          <ActivityIndicator size="small" color="#39ff14" />
        ) : (
          <Text className="text-center font-mono text-sm text-toxic-green">
            {acceptResult
              ? `Committed to ${acceptResult.branch}`
              : 'Accept Changes'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Step 2: Push */}
      <TouchableOpacity
        className={`mb-2 rounded-md border px-4 py-3 ${
          pushResult
            ? 'border-toxic-green/50 bg-toxic-green/10'
            : canPush
              ? 'border-toxic-green'
              : 'border-terminal-dim/30'
        }`}
        onPress={() => void pushToGitHub('https://github.com/user/repo.git')}
        disabled={!canPush || isPushing}
        accessibilityLabel="Push to GitHub"
        accessibilityRole="button"
      >
        {isPushing ? (
          <ActivityIndicator size="small" color="#39ff14" />
        ) : (
          <Text
            className={`text-center font-mono text-sm ${
              pushResult || canPush ? 'text-toxic-green' : 'text-terminal-dim/40'
            }`}
          >
            {pushResult ? 'Pushed to GitHub' : 'Push to GitHub'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Step 3: Create PR */}
      <TouchableOpacity
        className={`rounded-md border px-4 py-3 ${
          prUrl
            ? 'border-toxic-green/50 bg-toxic-green/10'
            : canCreatePR
              ? 'border-toxic-green'
              : 'border-terminal-dim/30'
        }`}
        onPress={() => void createPR('user/repo', 'feat: session changes', 'Shipped from a bus.')}
        disabled={!canCreatePR || isCreatingPR}
        accessibilityLabel="Create pull request"
        accessibilityRole="button"
      >
        {isCreatingPR ? (
          <ActivityIndicator size="small" color="#39ff14" />
        ) : (
          <Text
            className={`text-center font-mono text-sm ${
              prUrl || canCreatePR ? 'text-toxic-green' : 'text-terminal-dim/40'
            }`}
          >
            {prUrl ? `PR: ${prUrl}` : 'Create PR'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export type { ShipBarProps };
