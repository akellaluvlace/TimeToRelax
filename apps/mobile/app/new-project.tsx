// new-project.tsx -- The new project screen.
// Where a vague idea mumbled on a bus becomes a scaffolded project
// running in a cloud sandbox. The future is weird.

import type React from 'react';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FileTree } from '@/components/FileTree';
import { LivePreview } from '@/components/LivePreview';
import { LoadingState } from '@/components/LoadingState';
import { VoiceBrief } from '@/components/VoiceBrief';
import { useAgentSession } from '@/hooks/useAgentSession';
import { openBooth } from '@/services/confessional';
import { useSettingsStore } from '@/store/settings-store';

const log = openBooth('new-project-screen');

// TODO(nikita): Move this to a config/env system when we have one.
// Hardcoding the backend URL is a rite of passage for every MVP.
const BACKEND_URL = 'http://localhost:3000';

/** The three phases of new project creation. Like the three acts of a tragedy. */
type NewProjectPhase = 'briefing' | 'building' | 'preview';

/**
 * New project screen. Composes VoiceBrief, FileTree, and LivePreview
 * into a flow that takes the user from "I want to build something"
 * to "what have I done" in three acts.
 *
 * Act 1: Voice brief (user describes project)
 * Act 2: Agent working (file tree growing, SSE events streaming)
 * Act 3: Preview ready (link to running app)
 *
 * @returns The new project screen component
 */
export default function NewProjectScreen(): React.ReactNode {
  const { hasAnthropicKey } = useSettingsStore();
  const {
    filesChanged,
    previewUrl,
    phase: sessionPhase,
    isConnected,
    error: sessionError,
    connect,
  } = useAgentSession();

  const [screenPhase, setScreenPhase] = useState<NewProjectPhase>('briefing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // No API key? Can't do much.
  if (!hasAnthropicKey) {
    return (
      <EmptyState message="No API key configured. Visit Settings before starting a project." />
    );
  }

  // Session-level error
  if (sessionError && screenPhase === 'building') {
    return (
      <ErrorState
        message={sessionError}
        onRetry={() => setScreenPhase('briefing')}
      />
    );
  }

  /**
   * Handles the completed voice brief. Sends it to the backend,
   * gets a session ID, and connects to the SSE stream.
   */
  const onBriefComplete = useCallback(async (transcript: string) => {
    log.info('Brief complete, creating new project', { transcriptLength: transcript.length });
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/session/new-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'local-user',
        },
        body: JSON.stringify({
          // TODO(nikita): Get the actual API key from secure store.
          // For now we use a placeholder. The enabler will validate it.
          anthropicKey: 'sk-ant-placeholder',
          transcript,
        }),
      });

      if (!response.ok) {
        const body: Record<string, unknown> = await response.json();
        throw new Error((body['error'] as string) ?? `Server returned ${response.status}`);
      }

      const data: Record<string, unknown> = await response.json();
      const sessionId = data['sessionId'] as string;

      log.info('New project session created', { sessionId });

      // Connect to SSE stream for real-time updates
      connect(sessionId, BACKEND_URL);
      setScreenPhase('building');
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : 'Failed to create project. The bus hit a pothole.';
      log.error('New project creation failed', { error: message });
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [connect]);

  // Submission error during briefing phase
  if (submitError) {
    return (
      <ErrorState
        message={submitError}
        onRetry={() => {
          setSubmitError(null);
          setScreenPhase('briefing');
        }}
      />
    );
  }

  // Loading state during submission
  if (isSubmitting) {
    return <LoadingState message="Spawning your project... Hold tight." />;
  }

  return (
    <ScrollView className="flex-1 bg-abyss px-6 pt-6">
      {/* Phase 1: Voice brief */}
      {screenPhase === 'briefing' ? (
        <View>
          <Text className="mb-4 font-mono text-lg text-toxic-green">
            New Project
          </Text>
          <VoiceBrief onBriefComplete={(t) => void onBriefComplete(t)} />
        </View>
      ) : null}

      {/* Phase 2: Agent working */}
      {screenPhase === 'building' ? (
        <View>
          <Text className="mb-2 font-mono text-lg text-toxic-green">
            Building...
          </Text>
          <Text className="mb-4 font-mono text-xs text-terminal-dim">
            Phase: {sessionPhase} | {isConnected ? 'Connected' : 'Reconnecting...'}
          </Text>
          <FileTree files={filesChanged} />

          {/* Show preview once available, transition screen phase */}
          {previewUrl ? (
            <View className="mt-4">
              <LivePreview url={previewUrl} />
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Bottom spacer for scroll */}
      <View className="h-12" />
    </ScrollView>
  );
}
