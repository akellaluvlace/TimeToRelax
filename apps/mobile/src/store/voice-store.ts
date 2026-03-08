// voice-store.ts -- Zustand store for voice state.
// Tracks whether the app is listening, talking, or experiencing
// the blessed silence between disasters.

import { create } from 'zustand';

import type { VoiceProvider, VoiceState } from '@timetorelax/shared';

import { openBooth } from '@/services/confessional';

const log = openBooth('voice-store');

/** The shape of the voice store. A diary of sounds and silences. */
interface VoiceStore {
  /** Current voice provider. The default until the user upgrades. */
  provider: VoiceProvider;
  /** What the voice system is doing right now. */
  voiceState: VoiceState;
  /** The last transcript from STT. What the user actually said (probably). */
  lastTranscript: string | null;
  /** Whether the mic is hot. */
  isMicActive: boolean;
  /** The last error from the voice system. */
  lastError: string | null;

  /**
   * Turns on the voices in the app.
   * Not the ones in your head. Those are a separate concern.
   */
  enableTheVoices: (provider: VoiceProvider) => void;

  /**
   * Opens the mic. The app is now listening.
   * Whatever you say can and will be used to generate code.
   */
  openMouth: () => void;

  /**
   * Closes the mic. Mercifully.
   * The silence is deafening. And welcome.
   */
  mercifully: () => void;

  /**
   * Updates the voice state machine.
   * From idle to listening to processing to speaking to idle.
   * The circle of voice.
   */
  updateVoiceState: (state: VoiceState) => void;

  /**
   * Stores the latest transcript from STT.
   * What the user mumbled into their phone on public transport.
   */
  captureConfession: (transcript: string) => void;

  /**
   * Records a voice error. Something broke in the audio pipeline.
   * Shocking, truly.
   */
  recordStaticNoise: (error: string | null) => void;
}

/**
 * The voice store. Manages the state of the voice pipeline,
 * from the user's mouth to the agent's ears to the agent's
 * inevitably disappointed response.
 */
export const useVoiceStore = create<VoiceStore>((set) => ({
  provider: 'deepgram',
  voiceState: 'idle',
  lastTranscript: null,
  isMicActive: false,
  lastError: null,

  enableTheVoices: (provider: VoiceProvider): void => {
    log.info('Voice provider set', { provider });
    set({ provider, voiceState: 'idle', lastError: null });
  },

  openMouth: (): void => {
    log.debug('Mic activated. Listening for instructions.');
    set({ isMicActive: true, voiceState: 'listening' });
  },

  mercifully: (): void => {
    log.debug('Mic deactivated. Blessed silence.');
    set({ isMicActive: false, voiceState: 'processing' });
  },

  updateVoiceState: (state: VoiceState): void => {
    log.debug('Voice state changed', { state });
    set({ voiceState: state });
  },

  captureConfession: (transcript: string): void => {
    log.debug('Transcript captured', { length: transcript.length });
    set({ lastTranscript: transcript });
  },

  recordStaticNoise: (error: string | null): void => {
    if (error) {
      log.error('Voice error', { error });
    }
    set({ lastError: error, voiceState: error ? 'unavailable' : 'idle' });
  },
}));
