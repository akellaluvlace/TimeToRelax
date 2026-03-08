// VoiceBrief.tsx -- The voice input and transcript display
// for the new project flow. Hold the button, describe your project,
// and pray the transcription captures more than bus announcements.

import type React from 'react';
import { useCallback, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { MicButton } from '@/components/MicButton';
import { openBooth } from '@/services/confessional';

const log = openBooth('VoiceBrief');

/** Props for the VoiceBrief component. */
interface VoiceBriefProps {
  /** Called when the user finishes their voice brief. */
  onBriefComplete: (transcript: string) => void;
  /** Whether to disable the mic button. For when we're busy processing. */
  disabled?: boolean;
}

/**
 * Voice brief input component. The user holds the mic button,
 * describes their project idea, and we show the transcript.
 * Once they're happy with it (or have given up caring), they confirm.
 *
 * @param props - Callback for brief completion and optional disabled flag
 * @returns A voice input UI with transcript display and confirm button
 */
export function VoiceBrief({ onBriefComplete, disabled = false }: VoiceBriefProps): React.ReactNode {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // TODO(nikita): Replace this stub with actual Deepgram STT integration.
  // Right now we just capture the recording URI and set a placeholder.
  // The real pipeline comes in step 09 (Voice Pipeline).
  const onRecordingComplete = useCallback((uri: string) => {
    log.info('Voice brief recorded', { uri });
    setIsProcessing(true);

    // Simulate transcription delay. The real STT will be async.
    // For now, we use a placeholder that's at least honest about
    // what's happening.
    setTimeout(() => {
      // In production, this will be the actual transcript from Deepgram.
      // For now, the user gets a placeholder they can work with.
      setTranscript('(Voice transcription will appear here once STT is connected)');
      setIsProcessing(false);
    }, 500);
  }, []);

  const onConfirm = useCallback(() => {
    if (transcript) {
      log.info('Brief confirmed', { transcriptLength: transcript.length });
      onBriefComplete(transcript);
    }
  }, [transcript, onBriefComplete]);

  return (
    <View>
      {/* Instructions */}
      <Text className="mb-4 font-mono text-sm text-terminal-dim">
        Hold the button and describe your project. Keep it brief.
        The agent will fill in the gaps. That's literally its job.
      </Text>

      {/* Mic button */}
      <View className="mb-4 items-center">
        <MicButton
          onRecordingComplete={onRecordingComplete}
          disabled={disabled || isProcessing}
        />
      </View>

      {/* Processing indicator */}
      {isProcessing ? (
        <View className="rounded-md border border-terminal-dim p-3">
          <Text className="font-mono text-sm text-terminal-dim">
            Processing your voice... Trying to separate words from bus noise.
          </Text>
        </View>
      ) : null}

      {/* Transcript display */}
      {transcript && !isProcessing ? (
        <View className="rounded-md border border-terminal-dim p-3">
          <Text className="font-mono text-xs uppercase text-terminal-dim">
            Your Brief
          </Text>
          <Text className="mt-2 font-mono text-sm text-terminal-text">
            {transcript}
          </Text>

          {/* Confirm button */}
          <TouchableOpacity
            className="mt-4 items-center rounded-md border border-toxic-green px-4 py-3"
            onPress={onConfirm}
            disabled={disabled}
            accessibilityLabel="Confirm project brief"
            accessibilityRole="button"
          >
            <Text className="font-mono text-sm text-toxic-green">
              Ship it. No takebacks.
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
