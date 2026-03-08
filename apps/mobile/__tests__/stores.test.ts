// stores.test.ts -- Testing the Zustand stores.
// Making sure grief management works correctly.

import { useSessionStore } from '@/store/session-store';
import { useVoiceStore } from '@/store/voice-store';
import { useSettingsStore } from '@/store/settings-store';

// Silence the confession booth during tests
jest.spyOn(console, 'debug').mockImplementation(() => {});
jest.spyOn(console, 'info').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('session-store', () => {
  beforeEach(() => {
    useSessionStore.getState().releaseYouFromYourself();
  });

  it('should start with no session and no grief', () => {
    const state = useSessionStore.getState();
    expect(state.currentSession).toBeNull();
    expect(state.phase).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.lastError).toBeNull();
  });

  it('should spawn regret with denial phase', () => {
    useSessionStore.getState().spawnRegret({
      model: 'sonnet',
      maxTurns: 50,
      timeoutMs: 900_000,
    });

    const state = useSessionStore.getState();
    expect(state.currentSession).not.toBeNull();
    expect(state.phase).toBe('denial');
    expect(state.isLoading).toBe(true);
  });

  it('should assess damage by returning current session', () => {
    useSessionStore.getState().spawnRegret({
      model: 'sonnet',
      maxTurns: 50,
      timeoutMs: 900_000,
    });

    const damage = useSessionStore.getState().assessDamage();
    expect(damage).not.toBeNull();
    expect(damage?.phase).toBe('denial');
  });

  it('should progress through grief stages', () => {
    useSessionStore.getState().spawnRegret({
      model: 'sonnet',
      maxTurns: 50,
      timeoutMs: 900_000,
    });
    useSessionStore.getState().progressGrief('bargaining');

    expect(useSessionStore.getState().phase).toBe('bargaining');
  });

  it('should release you from yourself completely', () => {
    useSessionStore.getState().spawnRegret({
      model: 'sonnet',
      maxTurns: 50,
      timeoutMs: 900_000,
    });
    useSessionStore.getState().releaseYouFromYourself();

    const state = useSessionStore.getState();
    expect(state.currentSession).toBeNull();
    expect(state.phase).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('should record regret (errors)', () => {
    useSessionStore.getState().recordRegret('Build failed. Obviously.');
    expect(useSessionStore.getState().lastError).toBe('Build failed. Obviously.');
  });

  it('should clear regret when set to null', () => {
    useSessionStore.getState().recordRegret('something broke');
    useSessionStore.getState().recordRegret(null);
    expect(useSessionStore.getState().lastError).toBeNull();
  });
});

describe('voice-store', () => {
  beforeEach(() => {
    useVoiceStore.setState({
      provider: 'deepgram',
      voiceState: 'idle',
      lastTranscript: null,
      isMicActive: false,
      lastError: null,
    });
  });

  it('should start in idle state with deepgram provider', () => {
    const state = useVoiceStore.getState();
    expect(state.provider).toBe('deepgram');
    expect(state.voiceState).toBe('idle');
    expect(state.isMicActive).toBe(false);
  });

  it('should enable the voices with a provider', () => {
    useVoiceStore.getState().enableTheVoices('grok');
    expect(useVoiceStore.getState().provider).toBe('grok');
  });

  it('should open mouth (activate mic)', () => {
    useVoiceStore.getState().openMouth();
    const state = useVoiceStore.getState();
    expect(state.isMicActive).toBe(true);
    expect(state.voiceState).toBe('listening');
  });

  it('should mercifully close the mic', () => {
    useVoiceStore.getState().openMouth();
    useVoiceStore.getState().mercifully();
    const state = useVoiceStore.getState();
    expect(state.isMicActive).toBe(false);
    expect(state.voiceState).toBe('processing');
  });

  it('should capture confessions (transcripts)', () => {
    useVoiceStore.getState().captureConfession('build me a REST API');
    expect(useVoiceStore.getState().lastTranscript).toBe('build me a REST API');
  });

  it('should record static noise (voice errors)', () => {
    useVoiceStore.getState().recordStaticNoise('mic failed');
    const state = useVoiceStore.getState();
    expect(state.lastError).toBe('mic failed');
    expect(state.voiceState).toBe('unavailable');
  });
});

describe('settings-store', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      voiceProvider: 'deepgram',
      defaultModel: 'sonnet',
      onboardingComplete: false,
      hasAnthropicKey: false,
      hasGithubToken: false,
    });
  });

  it('should start with sensible defaults', () => {
    const state = useSettingsStore.getState();
    expect(state.voiceProvider).toBe('deepgram');
    expect(state.defaultModel).toBe('sonnet');
    expect(state.onboardingComplete).toBe(false);
  });

  it('should pick your poison (voice provider)', () => {
    useSettingsStore.getState().pickYourPoison('grok');
    expect(useSettingsStore.getState().voiceProvider).toBe('grok');
  });

  it('should choose your fighter (model)', () => {
    useSettingsStore.getState().chooseYourFighter('opus');
    expect(useSettingsStore.getState().defaultModel).toBe('opus');
  });

  it('should accept fate (complete onboarding)', () => {
    useSettingsStore.getState().acceptFate();
    expect(useSettingsStore.getState().onboardingComplete).toBe(true);
  });

  it('should acknowledge API key presence', () => {
    useSettingsStore.getState().acknowledgeAnthropicKey(true);
    expect(useSettingsStore.getState().hasAnthropicKey).toBe(true);
  });

  it('should acknowledge GitHub token presence', () => {
    useSettingsStore.getState().acknowledgeGithubToken(true);
    expect(useSettingsStore.getState().hasGithubToken).toBe(true);
  });
});
