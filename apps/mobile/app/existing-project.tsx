// existing-project.tsx -- The existing project screen.
// Clone someone's repo. Install deps. Read the codebase.
// Then tell the agent what to change. From a bus.
// What could go wrong? Everything. But here we are.

import type React from 'react';
import { useCallback, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SetupProgress } from '@/components/SetupProgress';
import { openBooth } from '@/services/confessional';
import { useRepoSession } from '@/hooks/useRepoSession';
import { useSettingsStore } from '@/store/settings-store';

const log = openBooth('existing-project-screen');

/**
 * Existing project screen. Three phases of acceptance:
 * 1. Enter repo URL (denial that you need a laptop)
 * 2. Watch setup progress (bargaining with the backend)
 * 3. Session ready (acceptance that you're coding on a bus)
 *
 * @returns The existing project screen component
 */
export default function ExistingProjectScreen(): React.ReactNode {
  const router = useRouter();
  const { hasAnthropicKey } = useSettingsStore();
  const { isSettingUp, setupProgress, sessionId, error, startSession } = useRepoSession();
  const [repoUrl, setRepoUrl] = useState('');
  const [subdirectory, setSubdirectory] = useState('');

  const onPressStart = useCallback(async () => {
    if (!repoUrl.trim()) return;

    // TODO(nikita): Pull actual key from expo-secure-store. For now, placeholder.
    const anthropicKey = 'sk-ant-placeholder';
    const subdir = subdirectory.trim() || undefined;

    log.info('Starting existing project session', { repoUrl, subdirectory: subdir });
    await startSession(repoUrl.trim(), anthropicKey, subdir);
  }, [repoUrl, subdirectory, startSession]);

  // No API key? Can't do anything.
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
          <Text className="font-mono text-sm text-toxic-green">Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Error state
  if (error && !isSettingUp) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          log.info('Retrying existing project setup');
          void onPressStart();
        }}
      />
    );
  }

  // Phase 2: Setup in progress
  if (isSettingUp) {
    return (
      <View className="flex-1 items-center justify-center bg-abyss px-6">
        <SetupProgress message={setupProgress} isActive />
      </View>
    );
  }

  // Phase 3: Session ready, navigate to session screen
  if (sessionId) {
    return (
      <View className="flex-1 items-center justify-center bg-abyss px-6">
        <Text className="font-mono text-lg text-toxic-green">Session ready.</Text>
        <Text className="mt-2 font-mono text-sm text-terminal-dim">
          Your codebase has been read. No comment.
        </Text>
        <TouchableOpacity
          className="mt-6 rounded-md border border-toxic-green px-6 py-3"
          onPress={() => router.push('/session')}
          accessibilityLabel="Start voice session"
          accessibilityRole="button"
        >
          <Text className="font-mono text-sm text-toxic-green">Start talking</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Phase 1: Enter repo URL
  return (
    <View className="flex-1 bg-abyss px-6 pt-12">
      <Text className="font-mono text-lg text-toxic-green">Existing Project</Text>
      <Text className="mt-2 font-mono text-sm text-terminal-dim">
        Paste a repo URL. We'll clone it, read it, and try not to judge.
      </Text>

      <TextInput
        className="mt-6 rounded-md border border-terminal-dim p-4 font-mono text-sm text-terminal-text"
        placeholder="https://github.com/user/repo.git"
        placeholderTextColor="#6b7280"
        value={repoUrl}
        onChangeText={setRepoUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        accessibilityLabel="Repository URL"
      />

      <TextInput
        className="mt-4 rounded-md border border-terminal-dim p-4 font-mono text-sm text-terminal-text"
        placeholder="Subdirectory (optional)"
        placeholderTextColor="#6b7280"
        value={subdirectory}
        onChangeText={setSubdirectory}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Subdirectory"
      />

      <TouchableOpacity
        className="mt-8 items-center rounded-md border border-toxic-green px-6 py-4"
        onPress={() => void onPressStart()}
        disabled={!repoUrl.trim()}
        accessibilityLabel="Clone and setup project"
        accessibilityRole="button"
      >
        <Text className="font-mono text-base text-toxic-green">
          {repoUrl.trim() ? 'Clone and explore' : 'Enter a repo URL first'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
