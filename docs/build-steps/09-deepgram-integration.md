# Step 09: Deepgram STT/TTS Integration

**Status:** not-started
**Depends on:** Step 03 (backend), Step 08 (mobile voice capture)
**Estimated scope:** ~10 files

## Done When

End-to-end voice loop works: user holds button -> audio streams to Deepgram Nova-3 -> transcript arrives at backend -> personality engine generates response -> Deepgram Aura-2 speaks it -> user hears cynical acknowledgment.

## Tasks

### Backend (Deepgram server-side proxy)
- [ ] Install Deepgram SDK (`@deepgram/sdk`)
- [ ] Create `mouth-and-ears.ts` -- Deepgram service wrapper
- [ ] Implement STT: WebSocket connection to Nova-3, streams audio, returns transcript
- [ ] Implement TTS: HTTP call to Aura-2, sends text, returns audio buffer
- [ ] Test 3-4 Aura-2 voices, pick default for best dry sarcasm delivery
- [ ] Create voice route: `POST /voice/transcribe` (receives audio, returns transcript)
- [ ] Create voice route: `POST /voice/speak` (receives text, returns audio)
- [ ] Deepgram key validation on backend startup (our key, not user's)
- [ ] Write test: STT returns transcript from audio (mocked WebSocket)
- [ ] Write test: TTS returns audio from text (mocked HTTP)

### Mobile (voice round-trip)
- [ ] Stream captured audio to backend voice endpoint
- [ ] Receive transcript, display in session view
- [ ] Receive TTS audio response, play back to user
- [ ] Handle WebSocket drops: auto-reconnect with backoff (1s, 2s, 4s, max 10s)
- [ ] Show subtle "Reconnecting voice..." indicator during reconnection
- [ ] Update voice Zustand store with transcript and playback state
- [ ] Write test: audio upload and transcript display flow

## Files To Create

```
apps/backend/src/services/mouth-and-ears.ts        # Deepgram STT/TTS wrapper
apps/backend/src/routes/voice-routes.ts            # POST /voice/transcribe, /voice/speak
apps/backend/__tests__/mouth-and-ears.test.ts      # Deepgram service tests
apps/backend/__tests__/voice-routes.test.ts        # Voice route tests
apps/mobile/src/services/voice-pipeline.ts         # Mobile voice streaming client
apps/mobile/src/hooks/useVoiceStream.ts            # Hook connecting capture -> backend -> playback
apps/mobile/src/__tests__/voice-pipeline.test.ts   # Voice pipeline tests
```

## Implementation Design

### mouth-and-ears.ts (Backend)
```typescript
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { openChapter } from '@/services/dear-diary';

const log = openChapter('mouth-and-ears');

// Deepgram config per spec
const STT_CONFIG = {
  model: 'nova-3',
  language: 'en',
  smart_format: true,
  punctuate: true,
};

// Voice selection -- test these during implementation, pick the driest one
const TTS_VOICE = 'aura-asteria-en'; // placeholder, A/B test 3-4 options

/**
 * Sends audio to Deepgram Nova-3 and returns what the user mumbled.
 * Works through bus noise, Irish accents, and existential dread.
 *
 * @param audioBuffer - Raw PCM audio from the user's phone
 * @returns The transcript of whatever they said
 */
async function hearConfession(audioBuffer: Buffer): Promise<string>;

/**
 * Sends text to Deepgram Aura-2 TTS and returns audio.
 * Delivers disappointment in approximately 200ms.
 *
 * @param text - The cynical response to speak aloud
 * @returns Audio buffer (mp3/wav) ready for playback
 */
async function deliverVerdict(text: string): Promise<Buffer>;
```

### Voice Round-Trip Flow
```
Mobile: hold button -> capture PCM audio
Mobile: POST /voice/transcribe { audio: Buffer }
Backend: hearConfession(audio) -> Deepgram Nova-3 -> transcript
Backend: craftDisapproval(state, context) -> personality text
Backend: deliverVerdict(text) -> Deepgram Aura-2 -> audio
Backend: respond { transcript, responseAudio, responseText }
Mobile: display transcript, play audio response
```

## Acceptance Criteria

- [ ] Audio streams to Deepgram and returns accurate transcript
- [ ] Personality response generates and speaks via Aura-2
- [ ] Full round-trip under 1.5 seconds (sub-300ms STT + sub-500ms personality + sub-200ms TTS)
- [ ] Deepgram key is server-side only, never touches mobile client
- [ ] WebSocket reconnection with exponential backoff works
- [ ] "Reconnecting voice..." indicator shows during reconnection
- [ ] Voice and agent are decoupled (voice drop doesn't kill agent session)
- [ ] `tsc --noEmit` passes
- [ ] All tests pass (with mocked Deepgram)

## Notes

- Deepgram runs on OUR credits ($200 pool). The user never provides a Deepgram key.
- Per spec: audio format is PCM 16-bit, 16kHz, mono
- Per spec: "No API key needed for voice on day one"
- Voice A/B testing: try Asteria, Orion, Luna, Athena voices. Pick the one that delivers "Build failed. Obviously." with the best deadpan.
- WebSocket reconnection is critical on mobile. Network switches (WiFi -> cellular) are common on buses.
- The agent session continues even if voice drops. User can still see SSE updates.
