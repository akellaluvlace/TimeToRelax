// SessionView.tsx -- The split-view session interface.
// Three tabs: Diff, Files, Preview. Plus a mic button glued to the bottom.
// Like a tiny IDE on your phone, except less useful and more cynical.

import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { DiffView } from '@/components/DiffView';
import { EmptyState } from '@/components/EmptyState';
import { FilePreview } from '@/components/FilePreview';
import { FileTree } from '@/components/FileTree';
import { LivePreview } from '@/components/LivePreview';
import { MicButton } from '@/components/MicButton';
import { useAgentSession } from '@/hooks/useAgentSession';
import { parseDiff } from '@/hooks/useDiffParser';
import { openBooth } from '@/services/confessional';
import type { FileDiff } from '@/types/diff';

const log = openBooth('SessionView');

/** The tabs in the session view. The grief navigation bar. */
const SESSION_TABS = ['Diff', 'Files', 'Preview'] as const;
type SessionTab = (typeof SESSION_TABS)[number];

/** Props for the SessionView component. */
interface SessionViewProps {
  /** The session ID to connect to. */
  sessionId: string;
  /** The backend URL for SSE streaming. */
  backendUrl: string;
}

/**
 * The main session UI with tabbed navigation.
 * Shows diffs, file tree, and live preview across three tabs
 * with a mic button permanently anchored at the bottom.
 * Because you need to keep talking to the agent even while
 * reviewing its questionable decisions.
 *
 * @param props - Session ID and backend URL for SSE connection
 * @returns A tabbed session view with voice controls
 */
export function SessionView({ sessionId, backendUrl }: SessionViewProps): React.ReactNode {
  const [activeTab, setActiveTab] = useState<SessionTab>('Diff');
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  const { events, filesChanged, previewUrl } = useAgentSession();

  // Parse diffs from SSE events that contain diff data
  // The agent sends diff_update events with raw unified diffs
  const diffs: FileDiff[] = useMemo(() => {
    return events
      .filter((e) => e.type === 'diff_update')
      .map((e) => {
        const data = e.data as { diff?: string; path?: string; action?: string };
        if (!data.diff || !data.path) return null;
        const action = (data.action ?? 'modified') as 'created' | 'modified' | 'deleted';
        return parseDiff(data.diff, data.path, action);
      })
      .filter((d): d is FileDiff => d !== null);
  }, [events]);

  // Find file content from events for the preview tab
  const selectedFileContent = useMemo(() => {
    if (!selectedFilePath) return null;
    // Look through events for file content matching the selected path
    const contentEvent = [...events]
      .reverse()
      .find((e) => {
        const data = e.data as { path?: string; content?: string };
        return (e.type === 'file_changed' || e.type === 'diff_update') &&
          data.path === selectedFilePath &&
          typeof data.content === 'string';
      });
    if (contentEvent) {
      return (contentEvent.data as { content: string }).content;
    }
    return null;
  }, [events, selectedFilePath]);

  const onFileSelect = useCallback((path: string) => {
    log.info('File selected for preview', { path });
    setSelectedFilePath(path);
    setActiveTab('Preview');
  }, []);

  // TODO(nikita): Wire this to the STT pipeline once Deepgram integration lands.
  // For now we just log the URI. Baby steps toward full voice control.
  const onRecordingComplete = useCallback((uri: string) => {
    log.info('Recording complete in session view', { uri, sessionId });
  }, [sessionId]);

  const renderTabContent = (): React.ReactNode => {
    switch (activeTab) {
      case 'Diff':
        return <DiffView diffs={diffs} onFileSelect={onFileSelect} />;

      case 'Files':
        return <FileTree files={filesChanged} onFileSelect={onFileSelect} />;

      case 'Preview':
        if (selectedFilePath && selectedFileContent) {
          return <FilePreview content={selectedFileContent} path={selectedFilePath} />;
        }
        return <LivePreview url={previewUrl} />;

      default:
        return <EmptyState message="Tab not found. This shouldn't happen." />;
    }
  };

  return (
    <View className="flex-1 bg-abyss">
      {/* Tab bar */}
      <View className="flex-row border-b border-terminal-dim">
        {SESSION_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            className={`flex-1 items-center py-3 ${activeTab === tab ? 'border-b-2 border-toxic-green' : ''}`}
            onPress={() => setActiveTab(tab)}
            accessibilityLabel={`${tab} tab`}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
          >
            <Text
              className={`font-mono text-sm ${activeTab === tab ? 'text-toxic-green' : 'text-terminal-dim'}`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View className="flex-1">
        {renderTabContent()}
      </View>

      {/* Mic button -- always visible at bottom */}
      <View className="border-t border-terminal-dim bg-abyss py-4">
        <MicButton onRecordingComplete={onRecordingComplete} />
      </View>
    </View>
  );
}
