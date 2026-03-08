# Step 07: Mobile Expo Skeleton

**Status:** complete
**Depends on:** Step 01
**Estimated scope:** ~15 files

## Done When

`npx expo start` launches the app on Android (emulator or device), expo-router navigation works, NativeWind styles render, and Zustand store holds dummy state.

## Tasks

- [x] Initialize Expo project in `apps/mobile` (SDK 55, TypeScript template)
- [x] Configure expo-router (file-based routing, stack navigation)
- [x] Configure NativeWind v4 (Tailwind for React Native)
- [x] Set up Zustand store skeleton (`useSessionStore`, `useVoiceStore`, `useSettingsStore`)
- [x] Create app layout with stack navigation
- [x] Create placeholder screens: Home, Session, Settings
- [x] Each screen handles loading, error, empty states
- [x] Configure tsconfig paths (`@/*` -> `./src/*`)
- [x] Configure `confessional.ts` logger (openBooth pattern, strips debug in prod)
- [x] Lock orientation to portrait (app.json)
- [x] Add app.json with proper config (name, slug, Android package)
- [ ] Verify builds and runs on Android emulator or device (needs device/emulator)
- [x] Write basic component render tests (34 tests pass)

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

- [ ] `npx expo start` launches without errors (needs device/emulator)
- [ ] Navigation between Home, Session, Settings works (needs runtime)
- [ ] NativeWind classes render correctly (needs runtime)
- [x] Zustand stores initialize and update via actions (tested)
- [x] All screens show loading, error, and empty states
- [x] Orientation locked to portrait (app.json)
- [x] `@timetorelax/shared` types importable from mobile (stores import them)
- [x] `tsc --noEmit` passes
- [x] Basic render tests pass (34/34)
- [ ] Runs on Android emulator or real device (needs device)

## Notes

- Android-first per spec. Don't worry about iOS config yet.
- Don't install expo-audio, expo-secure-store, or WebSocket deps yet. Those come in steps 08, 13.
- Keep screens under 150 lines per CLAUDE.md. Extract logic into hooks.
- No inline styles longer than 3 properties. NativeWind classes only.
- The cynical copy shows up in empty states and loading messages. Start the personality from day one.
- Metro config for monorepo is the #1 pain point. Get this right early.
