# Step 07: Mobile Expo Skeleton

**Status:** not-started
**Depends on:** Step 01
**Estimated scope:** ~15 files

## Done When

`npx expo start` launches the app on Android (emulator or device), expo-router navigation works, NativeWind styles render, and Zustand store holds dummy state.

## Tasks

- [ ] Initialize Expo project in `apps/mobile` (SDK 52+, TypeScript template)
- [ ] Configure expo-router (file-based routing)
- [ ] Configure NativeWind (Tailwind for React Native)
- [ ] Set up Zustand store skeleton (`useSessionStore`, `useVoiceStore`, `useSettingsStore`)
- [ ] Create app layout with bottom tabs or stack navigation
- [ ] Create placeholder screens: Home, Session, Settings
- [ ] Each screen handles loading, error, empty states (even if dummy)
- [ ] Configure tsconfig paths (`@/*` -> `./src/*`)
- [ ] Configure `confessional.ts` logger (from step 04, or stub if step 04 mobile not done)
- [ ] Lock orientation to portrait
- [ ] Add app.json with proper config (name, slug, Android package)
- [ ] Verify builds and runs on Android emulator or device
- [ ] Write basic component render tests

## Files To Create

```
apps/mobile/app.json                           # Expo config
apps/mobile/app/_layout.tsx                    # Root layout (expo-router)
apps/mobile/app/index.tsx                      # Home screen route
apps/mobile/app/session.tsx                    # Session screen route
apps/mobile/app/settings.tsx                   # Settings screen route
apps/mobile/src/store/session-store.ts         # Zustand session state
apps/mobile/src/store/voice-store.ts           # Zustand voice state
apps/mobile/src/store/settings-store.ts        # Zustand settings state
apps/mobile/src/components/LoadingState.tsx     # Reusable loading component
apps/mobile/src/components/ErrorState.tsx       # Reusable error component
apps/mobile/src/components/EmptyState.tsx       # Reusable empty state component
apps/mobile/tailwind.config.js                 # NativeWind Tailwind config
apps/mobile/nativewind-env.d.ts                # NativeWind type declarations
apps/mobile/babel.config.js                    # Babel with NativeWind preset
apps/mobile/tsconfig.json                      # Updated with paths
apps/mobile/metro.config.js                    # Metro config for monorepo
```

## Key Patterns

### Zustand Store Pattern
```typescript
import { create } from 'zustand';
import { SessionState, SessionPhase } from '@timetorelax/shared';

interface SessionStore {
  currentSession: SessionState | null;
  phase: SessionPhase | null;
  spawnRegret: (config: SessionConfig) => void;
  assessDamage: () => SessionState | null;
  releaseYouFromYourself: () => void;
}

const useSessionStore = create<SessionStore>((set, get) => ({
  currentSession: null,
  phase: null,
  spawnRegret: (config) => { /* ... */ },
  assessDamage: () => get().currentSession,
  releaseYouFromYourself: () => set({ currentSession: null, phase: null }),
}));
```

### Screen Pattern (all 3 states)
```tsx
export default function SessionScreen(): JSX.Element {
  const { currentSession, phase } = useSessionStore();

  if (phase === null) return <EmptyState message="No active session. Voice something." />;
  if (phase === 'denial') return <LoadingState message="Spawning regret..." />;
  // ... render session UI
}
```

### Metro Config for Monorepo
```javascript
// Metro needs to resolve packages/shared from the monorepo root
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, '../../packages/shared')];
module.exports = config;
```

## Acceptance Criteria

- [ ] `npx expo start` launches without errors
- [ ] Navigation between Home, Session, Settings works
- [ ] NativeWind classes render correctly (test with a colored background)
- [ ] Zustand stores initialize and update via actions
- [ ] All screens show loading, error, and empty states
- [ ] Orientation locked to portrait
- [ ] `@timetorelax/shared` types importable from mobile
- [ ] `tsc --noEmit` passes
- [ ] Basic render tests pass
- [ ] Runs on Android emulator or real device

## Notes

- Android-first per spec. Don't worry about iOS config yet.
- Don't install expo-audio, expo-secure-store, or WebSocket deps yet. Those come in steps 08, 13.
- Keep screens under 150 lines per CLAUDE.md. Extract logic into hooks.
- No inline styles longer than 3 properties. NativeWind classes only.
- The cynical copy shows up in empty states and loading messages. Start the personality from day one.
- Metro config for monorepo is the #1 pain point. Get this right early.
