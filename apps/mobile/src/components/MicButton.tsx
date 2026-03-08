// MicButton.tsx -- The big round button you hold to talk.
// Press and hold to record. Release to stop.
// The simplest interaction model for the most complicated thing we do.

import type React from 'react';
import { useCallback, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useVoice } from '@/hooks/useVoice';
import { openBooth } from '@/services/confessional';

const log = openBooth('MicButton');

/** Props for the mic button. Minimal by design. */
interface MicButtonProps {
  /** Called with the recording URI when the user releases the button. */
  onRecordingComplete: (uri: string) => void;
  /** Whether the button should be disabled. For when we're busy or ashamed. */
  disabled?: boolean;
}

/**
 * Hold-to-record microphone button.
 * Press and hold to start recording, release to stop.
 * Handles permission requests, visual state changes, and the
 * deeply personal act of speaking to your phone in public.
 *
 * @param props - onRecordingComplete callback and optional disabled flag
 * @returns A big round button that listens to your problems
 */
export function MicButton({ onRecordingComplete, disabled = false }: MicButtonProps): React.ReactNode {
  const { isRecording, hasPermission, openMouth, mercifully, requestPermission, duration } =
    useVoice();
  const isPressingRef = useRef(false);

  const onPressIn = useCallback(async () => {
    if (disabled) return;

    // If no permission yet, request it on tap. Don't start recording.
    if (hasPermission === false || hasPermission === null) {
      const granted = await requestPermission();
      if (!granted) {
        log.warn('User denied mic permission. Their loss.');
        return;
      }
    }

    isPressingRef.current = true;
    await openMouth();
  }, [disabled, hasPermission, requestPermission, openMouth]);

  const onPressOut = useCallback(async () => {
    if (!isPressingRef.current) return;
    isPressingRef.current = false;

    const uri = await mercifully();
    if (uri) {
      log.info('Recording complete, passing URI upstream', { uri });
      onRecordingComplete(uri);
    }
  }, [mercifully, onRecordingComplete]);

  // Determine button text and style based on state
  const getButtonContent = (): { label: string; sublabel: string | null } => {
    if (hasPermission === false) {
      return { label: 'Tap to enable mic', sublabel: 'We need permission to hear you' };
    }
    if (hasPermission === null) {
      return { label: 'Tap to enable mic', sublabel: null };
    }
    if (disabled) {
      return { label: 'Hold to talk', sublabel: 'Not right now' };
    }
    if (isRecording) {
      return { label: `${duration}s`, sublabel: 'Recording... release to stop' };
    }
    return { label: 'Hold to talk', sublabel: null };
  };

  const { label, sublabel } = getButtonContent();

  // Visual state classes
  const borderColor = isRecording
    ? 'border-danger-red'
    : disabled
      ? 'border-terminal-dim'
      : 'border-toxic-green';

  const textColor = isRecording
    ? 'text-danger-red'
    : disabled
      ? 'text-terminal-dim'
      : 'text-toxic-green';

  const bgClass = isRecording ? 'bg-danger-red/10' : 'bg-transparent';

  return (
    <View className="items-center">
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled && hasPermission !== false && hasPermission !== null}
        className={`h-28 w-28 items-center justify-center rounded-full border-2 ${borderColor} ${bgClass}`}
        accessibilityLabel={isRecording ? 'Stop recording' : 'Hold to record voice'}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        <Text className={`font-mono text-lg font-bold ${textColor}`}>{label}</Text>
      </Pressable>
      {sublabel ? (
        <Text className="mt-2 font-mono text-xs text-terminal-dim">{sublabel}</Text>
      ) : null}
    </View>
  );
}
