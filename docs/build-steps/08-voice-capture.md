# Step 08: Voice Capture (expo-audio)

**Status:** not-started
**Depends on:** Step 07
**Estimated scope:** ~6 files

## Done When

User can hold a button to record audio, release to stop, and the app captures PCM audio ready to stream to Deepgram. Walkie-talkie UX. No permission dialog on every press.

## Tasks

- [ ] Install `expo-audio` (NOT expo-av)
- [ ] Configure audio permissions in app.json/app.config.ts (microphone)
- [ ] Create `useVoice` hook: manages recording lifecycle
- [ ] Implement hold-to-record pattern (pressIn = start, pressOut = stop)
- [ ] Request audio permissions on first launch, cache permission state
- [ ] Configure audio recording: PCM 16-bit, 16kHz sample rate (Deepgram format)
- [ ] Create `MicButton` component (pressable, visual feedback on hold)
- [ ] Update voice Zustand store with recording state
- [ ] Write test: permission request flow
- [ ] Write test: recording state transitions (idle -> recording -> stopped)
- [ ] Test on real Android device (audio behaves differently than emulator)

## Files To Create

```
apps/mobile/src/hooks/useVoice.ts               # Voice recording hook
apps/mobile/src/components/MicButton.tsx          # Hold-to-record button
apps/mobile/src/__tests__/useVoice.test.ts       # Hook tests (mocked expo-audio)
apps/mobile/src/__tests__/MicButton.test.ts      # Component render tests
```

## Implementation Design

### useVoice Hook
```typescript
import { useAudioRecorder } from 'expo-audio';

interface UseVoiceReturn {
  isRecording: boolean;
  hasPermission: boolean;
  openMouth: () => Promise<void>;       // Start recording
  mercifully: () => Promise<AudioData>; // Stop recording, return audio
  requestPermission: () => Promise<boolean>;
}

/**
 * Manages the walkie-talkie voice capture lifecycle.
 * Hold to talk. Release to stop. Pray Deepgram understands your bus accent.
 *
 * @returns Voice recording controls and state
 */
function useVoice(): UseVoiceReturn { ... }
```

### MicButton Component
```tsx
/**
 * The big button you hold to talk into the void.
 * Press and hold = recording. Release = done. Tap = nothing (intentional).
 * Visual feedback: idle (dim), recording (pulsing accent color), processing (spinning).
 */
function MicButton({ onRecordingComplete }: MicButtonProps): JSX.Element {
  // onPressIn -> openMouth()
  // onPressOut -> mercifully() -> onRecordingComplete(audioData)
  // Visual: pulsing border or glow when recording
}
```

### Audio Config
```typescript
// Deepgram Nova-3 expects:
// - PCM 16-bit linear
// - 16kHz sample rate
// - Single channel (mono)
const RECORDING_OPTIONS = {
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 256000,
  // expo-audio handles encoding format per platform
};
```

## Acceptance Criteria

- [ ] Hold button starts recording, release stops
- [ ] No permission dialog after initial grant
- [ ] Audio captured at 16kHz, 16-bit, mono (Deepgram-compatible)
- [ ] Recording state reflected in Zustand voice store
- [ ] MicButton shows visual feedback during recording
- [ ] Works on real Android device (not just emulator)
- [ ] Graceful handling: permission denied, audio hardware unavailable
- [ ] `tsc --noEmit` passes
- [ ] All tests pass (with mocked expo-audio)

## Notes

- **expo-audio, NOT expo-av.** CLAUDE.md is explicit about this. expo-av is the deprecated path.
- expo-audio has a config plugin for Android foreground service. Don't enable it yet; that's a Week 3 concern per spec.
- The walkie-talkie UX means the app is in foreground during recording. Background audio is an edge case for MVP.
- Audio data from this step feeds into step 09 (Deepgram integration). For now, just capture and return the data.
- Test on a real device. Emulator audio is synthetic and behaves differently.
- Per spec: "Hold = instant capture. No permission dialog on every press."
