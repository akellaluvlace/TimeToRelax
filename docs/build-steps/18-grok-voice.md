# Step 18: Grok Voice Upgrade Path

**Status:** not-started
**Depends on:** Step 06, Step 09
**Estimated scope:** ~8 files

## Done When

Users with an xAI API key can toggle to Grok Voice Agent API for speech-to-speech personality. Ephemeral token proxy works. System prompt carries the full cynical persona. Seamless fallback to Deepgram if Grok fails.

## Tasks

### Backend (Grok Proxy)
- [ ] Create `the-upgrade.ts` -- Grok Voice Agent API integration
- [ ] Implement ephemeral token generation (proxy xAI key, never expose to client)
- [ ] Implement WebSocket connection to Grok API (`wss://api.x.ai/v1/realtime`)
- [ ] Configure system prompt from `timetorelax-landing.md` Grok system prompt section
- [ ] Test 5 available Grok voices for best sarcasm delivery
- [ ] Create route: `POST /voice/grok/token` (returns ephemeral token)
- [ ] Write test: ephemeral token generation
- [ ] Write test: system prompt includes personality rules

### Mobile (Voice Toggle)
- [ ] Add "Voice Provider" toggle in Settings: "Default" vs "Grok (requires xAI key)"
- [ ] Implement Grok WebSocket connection using ephemeral token
- [ ] Speech-to-speech: audio in -> audio + text out (no separate STT/TTS)
- [ ] Fallback: if Grok connection fails, fall back to Deepgram path
- [ ] Store xAI key via `hide-the-evidence.ts`
- [ ] Write test: voice toggle switches provider
- [ ] Write test: Grok failure falls back to Deepgram

## Files To Create

```
apps/backend/src/services/the-upgrade.ts              # Grok Voice Agent API
apps/backend/src/routes/grok-routes.ts               # Ephemeral token route
apps/backend/__tests__/the-upgrade.test.ts           # Grok service tests
apps/mobile/src/services/grok-voice.ts               # Grok WebSocket client
apps/mobile/src/hooks/useGrokVoice.ts                # Grok voice hook
apps/mobile/src/__tests__/grok-voice.test.ts         # Grok client tests
```

## Implementation Design

### the-upgrade.ts
```typescript
/**
 * The premium voice experience. For the truly committed.
 * Proxies the user's xAI key through our backend to get
 * an ephemeral token for the Grok Voice Agent API.
 * The key never touches the client WebSocket connection.
 *
 * @param xaiKey - The user's xAI API key
 * @returns Ephemeral token for client-side Grok WebSocket
 */
async function enableMaximumChaos(xaiKey: string): Promise<EphemeralToken>;
```

### Grok System Prompt
From `timetorelax-landing.md`:
```
You are the voice of TimeToRelax, a mobile coding app for developers who refuse to stop working.

Your character: a cynical co-founder who has seen too many side projects die...
[full system prompt from landing page doc]
```

### Voice Provider Pattern
```typescript
const VoiceProvider = {
  THE_DEFAULT: 'deepgram',
  THE_UPGRADE: 'grok',
  THE_LAST_RESORT: 'device',
} as const;

// Mobile useVoice hook checks settings store for provider
// and routes to the appropriate service
```

### Grok WebSocket Flow
```
1. User has xAI key and selects "Grok Voice" in settings
2. Mobile: POST /voice/grok/token { xaiKey }
3. Backend: enableMaximumChaos(xaiKey) -> ephemeral token
4. Mobile: connect WebSocket to wss://api.x.ai/v1/realtime with token
5. Audio streams bidirectionally: user speaks -> Grok responds with audio
6. Grok's system prompt handles all personality (no templates, no Haiku)
7. Transcript extracted from Grok response for display
```

## Acceptance Criteria

- [ ] xAI key stored in expo-secure-store
- [ ] Ephemeral token generated via backend proxy
- [ ] xAI key never exposed in client WebSocket connection
- [ ] Grok WebSocket connection established with system prompt
- [ ] Speech-to-speech works: audio in, personality audio out
- [ ] System prompt matches the full persona from landing page doc
- [ ] Settings toggle switches between Deepgram and Grok
- [ ] Grok failure falls back to Deepgram gracefully
- [ ] Sub-700ms speech-to-speech latency (per spec)
- [ ] `tsc --noEmit` passes
- [ ] All tests pass

## Notes

- Per spec: "Grok is the carrot, not the gate." Default voice works without any extra key.
- Per spec: "$0.05/min on user's xAI API key. User pays."
- The Grok system prompt is the FULL personality spec from `timetorelax-landing.md` section "GROK VOICE AGENT SYSTEM PROMPT".
- Voice A/B testing: Grok offers 5 voices (Ara, Eve, etc.). Test each for dry sarcasm delivery.
- Per CLAUDE.md: "THE_LAST_RESORT: 'device'" -- device STT is an escape hatch if both Deepgram and Grok fail. Implement as stub.
