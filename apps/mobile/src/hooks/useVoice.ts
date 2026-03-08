// useVoice.ts -- The hook that gives the app ears.
// Uses expo-audio to capture whatever the user mumbles into their phone
// on public transport. Deepgram-compatible PCM 16-bit, 16kHz mono.
// Because quality matters, even when the context doesn't.

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
} from 'expo-audio';
import type { RecordingOptions, RecordingStatus } from 'expo-audio';

import { openBooth } from '@/services/confessional';
import { useVoiceStore } from '@/store/voice-store';

const log = openBooth('useVoice');

/**
 * Recording config tuned for Deepgram's STT.
 * 16kHz mono because Deepgram doesn't need your audiophile fantasies,
 * it needs clear speech at a reasonable sample rate.
 */
const DEEPGRAM_RECORDING_CONFIG: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  sampleRate: 16_000,
  numberOfChannels: 1,
  bitRate: 256_000,
};

/** What this hook gives back to the component. The voice pipeline controls. */
interface UseVoiceReturn {
  /** Whether the recorder is currently capturing audio. */
  isRecording: boolean;
  /** Whether we have mic permission. null = haven't checked yet. */
  hasPermission: boolean | null;
  /** Start recording. Checks permission first because we're responsible adults. */
  openMouth: () => Promise<void>;
  /** Stop recording and return the URI. Returns null if nothing was recorded. */
  mercifully: () => Promise<string | null>;
  /** Ask the OS for mic permission. Returns whether it was granted. */
  requestPermission: () => Promise<boolean>;
  /** How long the current recording has been going, in seconds. */
  duration: number;
}

/**
 * Voice recording hook. Wraps expo-audio's recorder into something
 * the rest of the app can use without thinking about audio formats,
 * permissions, or the existential dread of hearing your own voice played back.
 *
 * Records in PCM 16-bit, 16kHz mono for Deepgram compatibility.
 * Manages permissions, recording state, and syncs with the voice Zustand store.
 *
 * @returns Voice controls: openMouth, mercifully, permission state, duration
 */
export function useVoice(): UseVoiceReturn {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const isRecordingRef = useRef(false);

  // Zustand store sync
  const storeOpenMouth = useVoiceStore((s) => s.openMouth);
  const storeMercifully = useVoiceStore((s) => s.mercifully);
  const storeRecordStaticNoise = useVoiceStore((s) => s.recordStaticNoise);

  /**
   * Status listener for the recorder. Fires on recording events.
   * We use this to catch errors and completed recordings.
   */
  const onRecordingStatus = useCallback(
    (status: RecordingStatus) => {
      if (status.hasError && status.error) {
        log.error('Recording status error', { error: status.error });
        storeRecordStaticNoise(status.error);
      }
    },
    [storeRecordStaticNoise],
  );

  const recorder = useAudioRecorder(DEEPGRAM_RECORDING_CONFIG, onRecordingStatus);
  const recorderState = useAudioRecorderState(recorder, 500);

  // Check permission on mount. Just checking, not asking.
  // We're polite like that. For now.
  useEffect(() => {
    let mounted = true;

    async function checkPermission(): Promise<void> {
      try {
        const result = await getRecordingPermissionsAsync();
        if (mounted) {
          setHasPermission(result.granted);
          log.debug('Permission check on mount', { granted: result.granted });
        }
      } catch (err: unknown) {
        log.error('Failed to check recording permission', {
          error: err instanceof Error ? err.message : String(err),
        });
        if (mounted) {
          setHasPermission(false);
        }
      }
    }

    void checkPermission();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Asks the user for mic permission. Shows the OS dialog.
   * Returns true if granted, false if they said no.
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const result = await requestRecordingPermissionsAsync();
      setHasPermission(result.granted);
      log.info('Permission requested', { granted: result.granted });
      if (!result.granted) {
        storeRecordStaticNoise('Mic permission denied. We need ears to hear you.');
      }
      return result.granted;
    } catch (err: unknown) {
      log.error('Failed to request recording permission', {
        error: err instanceof Error ? err.message : String(err),
      });
      setHasPermission(false);
      storeRecordStaticNoise('Failed to request mic permission. The OS is not cooperating.');
      return false;
    }
  }, [storeRecordStaticNoise]);

  /**
   * Starts recording. Checks permission first.
   * If permission isn't granted, requests it.
   * If still no permission, gives up gracefully.
   */
  const openMouth = useCallback(async (): Promise<void> => {
    // Already recording? Don't stack recordings. That way lies madness.
    if (isRecordingRef.current) {
      log.warn('openMouth called while already recording. Ignoring.');
      return;
    }

    try {
      // Check or request permission
      let permitted = hasPermission;
      if (!permitted) {
        permitted = await requestPermission();
        if (!permitted) {
          log.warn('Cannot start recording. No mic permission.');
          return;
        }
      }

      await recorder.prepareToRecordAsync();
      recorder.record();
      isRecordingRef.current = true;
      storeOpenMouth();
      log.info('Recording started. The mic is hot.');
    } catch (err: unknown) {
      isRecordingRef.current = false;
      const message = err instanceof Error ? err.message : String(err);
      log.error('Failed to start recording', { error: message });
      storeRecordStaticNoise(`Recording failed to start: ${message}`);
    }
  }, [hasPermission, requestPermission, recorder, storeOpenMouth, storeRecordStaticNoise]);

  /**
   * Stops recording and returns the file URI.
   * Returns null if there was nothing to stop.
   */
  const mercifully = useCallback(async (): Promise<string | null> => {
    if (!isRecordingRef.current) {
      log.warn('mercifully called but nothing is recording. Moving on.');
      return null;
    }

    try {
      await recorder.stop();
      isRecordingRef.current = false;
      storeMercifully();

      const uri = recorder.uri;
      log.info('Recording stopped', { uri });
      return uri;
    } catch (err: unknown) {
      isRecordingRef.current = false;
      const message = err instanceof Error ? err.message : String(err);
      log.error('Failed to stop recording', { error: message });
      storeRecordStaticNoise(`Recording failed to stop cleanly: ${message}`);
      return null;
    }
  }, [recorder, storeMercifully, storeRecordStaticNoise]);

  return {
    isRecording: recorderState.isRecording,
    hasPermission,
    openMouth,
    mercifully,
    requestPermission,
    duration: Math.round(recorderState.durationMillis / 1_000),
  };
}
