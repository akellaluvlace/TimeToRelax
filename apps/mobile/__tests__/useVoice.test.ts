// useVoice.test.ts -- Testing the voice recording hook.
// Making sure the app can hear you, even if it wishes it couldn't.

import { renderHook, act, waitFor } from '@testing-library/react-native';

import { useVoiceStore } from '@/store/voice-store';

// Mock expo-audio before importing the hook
const mockRecord = jest.fn();
const mockStop = jest.fn().mockResolvedValue(undefined);
const mockPrepareToRecordAsync = jest.fn().mockResolvedValue(undefined);
const mockGetStatus = jest.fn().mockReturnValue({
  canRecord: true,
  isRecording: false,
  durationMillis: 0,
  mediaServicesDidReset: false,
  url: null,
});

const mockRecorder = {
  record: mockRecord,
  stop: mockStop,
  prepareToRecordAsync: mockPrepareToRecordAsync,
  getStatus: mockGetStatus,
  uri: 'file:///tmp/recording-evidence.m4a',
  isRecording: false,
  id: 'test-recorder',
  currentTime: 0,
  getAvailableInputs: jest.fn().mockReturnValue([]),
  getCurrentInput: jest.fn().mockResolvedValue({ name: 'mic', type: 'mic', uid: 'mic' }),
  setInput: jest.fn(),
  startRecordingAtTime: jest.fn(),
  recordForDuration: jest.fn(),
  pause: jest.fn(),
  addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  emit: jest.fn(),
};

const mockRecorderState = {
  canRecord: true,
  isRecording: false,
  durationMillis: 0,
  mediaServicesDidReset: false,
  url: null,
};

const mockRequestRecordingPermissionsAsync = jest.fn();
const mockGetRecordingPermissionsAsync = jest.fn();

jest.mock('expo-audio', () => ({
  useAudioRecorder: jest.fn(() => mockRecorder),
  useAudioRecorderState: jest.fn(() => mockRecorderState),
  RecordingPresets: {
    HIGH_QUALITY: {
      extension: '.m4a',
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      android: { outputFormat: 'mpeg4', audioEncoder: 'aac' },
      ios: {
        outputFormat: 'aac ',
        audioQuality: 127,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
    },
  },
  requestRecordingPermissionsAsync: (...args: unknown[]) =>
    mockRequestRecordingPermissionsAsync(...args),
  getRecordingPermissionsAsync: (...args: unknown[]) =>
    mockGetRecordingPermissionsAsync(...args),
}));

// Silence the confession booth during tests
jest.spyOn(console, 'debug').mockImplementation(() => {});
jest.spyOn(console, 'info').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Import after mocks are set up
import { useVoice } from '@/hooks/useVoice';

describe('useVoice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRecorderState.isRecording = false;
    mockRecorderState.durationMillis = 0;
    mockRecorder.uri = 'file:///tmp/recording-evidence.m4a';

    // Reset the voice store
    useVoiceStore.setState({
      provider: 'deepgram',
      voiceState: 'idle',
      lastTranscript: null,
      isMicActive: false,
      lastError: null,
      recordingUri: null,
    });

    // Default: permission granted
    mockGetRecordingPermissionsAsync.mockResolvedValue({
      granted: true,
      status: 'granted',
      canAskAgain: true,
      expires: 'never',
    });
    mockRequestRecordingPermissionsAsync.mockResolvedValue({
      granted: true,
      status: 'granted',
      canAskAgain: true,
      expires: 'never',
    });
  });

  it('should check permissions on mount like a responsible citizen', async () => {
    renderHook(() => useVoice());

    await waitFor(() => {
      expect(mockGetRecordingPermissionsAsync).toHaveBeenCalledTimes(1);
    });
  });

  it('should report hasPermission as true when the OS cooperates', async () => {
    const { result } = renderHook(() => useVoice());

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(true);
    });
  });

  it('should report hasPermission as false when the user says no', async () => {
    mockGetRecordingPermissionsAsync.mockResolvedValue({
      granted: false,
      status: 'denied',
      canAskAgain: true,
      expires: 'never',
    });

    const { result } = renderHook(() => useVoice());

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(false);
    });
  });

  it('should start recording when openMouth is called with permission', async () => {
    const { result } = renderHook(() => useVoice());

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(true);
    });

    await act(async () => {
      await result.current.openMouth();
    });

    expect(mockPrepareToRecordAsync).toHaveBeenCalled();
    expect(mockRecord).toHaveBeenCalled();
  });

  it('should not start recording without permission and request it instead', async () => {
    mockGetRecordingPermissionsAsync.mockResolvedValue({
      granted: false,
      status: 'denied',
      canAskAgain: true,
      expires: 'never',
    });

    // Permission request also denied
    mockRequestRecordingPermissionsAsync.mockResolvedValue({
      granted: false,
      status: 'denied',
      canAskAgain: true,
      expires: 'never',
    });

    const { result } = renderHook(() => useVoice());

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(false);
    });

    await act(async () => {
      await result.current.openMouth();
    });

    // Should have tried to request permission
    expect(mockRequestRecordingPermissionsAsync).toHaveBeenCalled();
    // Should NOT have started recording
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it('should stop recording and return URI when mercifully is called', async () => {
    const { result } = renderHook(() => useVoice());

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(true);
    });

    // Start recording first
    await act(async () => {
      await result.current.openMouth();
    });

    // Stop recording
    let uri: string | null = null;
    await act(async () => {
      uri = await result.current.mercifully();
    });

    expect(mockStop).toHaveBeenCalled();
    expect(uri).toBe('file:///tmp/recording-evidence.m4a');
  });

  it('should return null from mercifully when nothing is recording', async () => {
    const { result } = renderHook(() => useVoice());

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(true);
    });

    let uri: string | null = 'should-be-null';
    await act(async () => {
      uri = await result.current.mercifully();
    });

    expect(uri).toBeNull();
    expect(mockStop).not.toHaveBeenCalled();
  });

  it('should handle permission denied gracefully without throwing', async () => {
    mockGetRecordingPermissionsAsync.mockResolvedValue({
      granted: false,
      status: 'denied',
      canAskAgain: false,
      expires: 'never',
    });

    mockRequestRecordingPermissionsAsync.mockResolvedValue({
      granted: false,
      status: 'denied',
      canAskAgain: false,
      expires: 'never',
    });

    const { result } = renderHook(() => useVoice());

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(false);
    });

    // Should not throw
    const granted = await act(async () => {
      return result.current.requestPermission();
    });

    expect(granted).toBe(false);
  });

  it('should expose duration from recorder state in seconds not milliseconds', async () => {
    mockRecorderState.durationMillis = 5_500;

    const { result } = renderHook(() => useVoice());

    // Duration should be in seconds, rounded
    expect(result.current.duration).toBe(6);
  });

  it('should sync with voice store on openMouth', async () => {
    const { result } = renderHook(() => useVoice());

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(true);
    });

    await act(async () => {
      await result.current.openMouth();
    });

    const storeState = useVoiceStore.getState();
    expect(storeState.isMicActive).toBe(true);
    expect(storeState.voiceState).toBe('listening');
  });

  it('should sync with voice store on mercifully', async () => {
    const { result } = renderHook(() => useVoice());

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(true);
    });

    await act(async () => {
      await result.current.openMouth();
    });

    await act(async () => {
      await result.current.mercifully();
    });

    const storeState = useVoiceStore.getState();
    expect(storeState.isMicActive).toBe(false);
    expect(storeState.voiceState).toBe('processing');
  });

  it('should not double-start if openMouth is called while already recording', async () => {
    const { result } = renderHook(() => useVoice());

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(true);
    });

    await act(async () => {
      await result.current.openMouth();
    });

    // Try to start again
    await act(async () => {
      await result.current.openMouth();
    });

    // prepareToRecordAsync should only be called once
    expect(mockPrepareToRecordAsync).toHaveBeenCalledTimes(1);
  });

  it('should record error in voice store when recording fails to start', async () => {
    mockPrepareToRecordAsync.mockRejectedValueOnce(new Error('Mic exploded'));

    const { result } = renderHook(() => useVoice());

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(true);
    });

    await act(async () => {
      await result.current.openMouth();
    });

    const storeState = useVoiceStore.getState();
    expect(storeState.lastError).toContain('Mic exploded');
  });
});
