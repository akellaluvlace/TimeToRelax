# TimeToRelax Build Progress

> **Start every agent session by reading this file.**
> Update it when you finish a step or make a decision.

## Source Documents

| Document | Purpose |
|---|---|
| `timetorelax-spec-v2.2.md` | Product spec, architecture, timeline |
| `CLAUDE.md` | Operating manual, coding standards, personality rules |
| `timetorelax-landing.md` | Landing page copy, Grok system prompt, design specs |
| `docs/plans/2026-03-06-build-steps-and-logging-design.md` | Design doc for this build plan |

## Status Dashboard

| # | Step | Status | Started | Completed | Notes |
|---|---|---|---|---|---|
| 01 | Git Init & Monorepo Scaffold | complete | 2026-03-06 | 2026-03-06 | Pushed to github.com/akellaluvlace/TimeToRelax |
| 02 | Shared Types Package | complete | 2026-03-07 | 2026-03-07 | 6 type files, all exports verified from backend + mobile |
| 03 | Backend Fastify Skeleton | complete | 2026-03-07 | 2026-03-07 | Fastify 5, CORS, rate-limit, health route, error handler, 6 tests pass |
| 04 | Runtime Logger (dear-diary.ts) | complete | 2026-03-07 | 2026-03-07 | Backend: pino logger, openChapter child factory, integrated into Fastify. Mobile: confessional.ts done in step 07. 15 backend tests pass. |
| 05 | SSE Streaming (the-void.ts) | complete | 2026-03-08 | 2026-03-08 | the-void.ts service + route, 28 new tests, 43 total pass |
| 06 | Personality Engine (denial-engine.ts) | complete | 2026-03-08 | 2026-03-08 | denial-engine.ts, templates.ts (17 states, 3+ each), banned-words.ts, consultTheOracle stub. 23 new tests, 38 total pass. |
| 07 | Mobile Expo Skeleton | complete | 2026-03-07 | 2026-03-07 | Expo 55, expo-router, NativeWind v4, Zustand, 3 screens, 3 stores, confessional.ts, 34 tests pass |
| 08 | Voice Capture (expo-audio) | complete | 2026-03-08 | 2026-03-08 | useVoice hook, MicButton, expo-audio PCM 16kHz, 23 tests |
| 09 | Deepgram STT/TTS Integration | complete | 2026-03-08 | 2026-03-08 | mouth-and-ears.ts (STT/TTS), voice-routes.ts, voice-pipeline.ts (mobile), 29 tests |
| 10 | Agent SDK Session Manager (enabler.ts) | complete | 2026-03-08 | 2026-03-08 | enabler.ts orchestrator, regret-tracker.ts session store with TTL, session-routes.ts (4 routes), mock SDK factory, 51 new tests, 117 total pass |
| 11 | E2B Sandbox Lifecycle (grass-toucher.ts) | complete | 2026-03-08 | 2026-03-08 | grass-toucher.ts (build/poke/destroy), sandbox-templates.ts, mock factory, 24 tests |
| 12 | New Project Mode (end-to-end) | complete | 2026-03-08 | 2026-03-08 | new-project-routes.ts, useAgentSession hook, FileTree/LivePreview/VoiceBrief components, 36 tests |
| 13 | GitHub OAuth & Repo Connect | complete | 2026-03-08 | 2026-03-08 | no-laptop-no-problem.ts, github-routes.ts, hide-the-evidence.ts (mobile), 22 tests |
| 14 | Existing Project Mode | complete | 2026-03-08 | 2026-03-08 | archaeologist.ts, existing-project-routes.ts, useRepoSession hook, SetupProgress, 20 tests |
| 15 | Diff View & File Tree UI | complete | 2026-03-08 | 2026-03-08 | DiffView, DiffFile, FilePreview, SessionView, useDiffParser, 25 tests |
| 16 | Ship Flow (commit, push, PR) | complete | 2026-03-08 | 2026-03-08 | ship-routes.ts, useShipFlow hook, ShipBar, noTakebacksies/shipFromInappropriateLocation/makeItSomeoneElsesProblem, 31 tests |
| 17 | Session Resilience & Reconnection | complete | 2026-03-08 | 2026-03-08 | intervention.ts, sleep-is-optional.ts, ConnectionStatus, useVoiceReconnect, 38 tests |
| 18 | Grok Voice Upgrade Path | complete | 2026-03-08 | 2026-03-08 | the-upgrade.ts, grok-routes.ts, grok-voice.ts (mobile), useGrokVoice hook, 30 tests |
| 19 | Landing Page (timetorelax.app) | complete | 2026-03-06 | 2026-03-06 | Next.js 16 on Vercel, timetorelax.app |
| 20 | Polish, Onboarding & Launch Prep | complete | 2026-03-08 | 2026-03-08 | Onboarding flow, SessionHistory, ProjectSwitcher, 28 tests. 277 backend + 193 mobile = 470 total tests |

## Dependency Graph

```
01 Monorepo Scaffold
├── 02 Shared Types
│   └── 06 Personality Engine
├── 03 Backend Fastify
│   ├── 04 Logger (dear-diary.ts)
│   │   ├── 05 SSE (the-void.ts)
│   │   ├── 06 Personality Engine
│   │   └── 10 Agent SDK (enabler.ts)
│   ├── 05 SSE (the-void.ts)
│   │   └── 10 Agent SDK (enabler.ts)
│   ├── 09 Deepgram STT/TTS
│   └── 13 GitHub OAuth
├── 07 Mobile Expo
│   ├── 08 Voice Capture
│   │   └── 09 Deepgram STT/TTS
│   ├── 13 GitHub OAuth
│   └── 15 Diff View & File Tree
├── 10 Agent SDK (enabler.ts)
│   └── 11 E2B (grass-toucher.ts)
│       ├── 12 New Project Mode
│       └── 14 Existing Project Mode
├── 16 Ship Flow (needs 13, 14)
├── 17 Resilience (needs 05, 09, 10)
├── 18 Grok Voice (needs 06, 09)
├── 19 Landing Page (independent)
└── 20 Polish & Launch (needs all)
```

## Decision Log

| Date | Decision | Rationale | Step |
|---|---|---|---|
| 2026-03-06 | Flat numbered step files in docs/build-steps/ | Easy to reference, no nesting overhead | -- |
| 2026-03-06 | ~20 steps, each 0.5-2 days | Granular enough for session pickup, not overhead-heavy | -- |
| 2026-03-06 | Logger: pino (backend), console wrapper (mobile) | Structured JSON, personality in naming only | 04 |
| 2026-03-06 | Logger file names: dear-diary.ts / confessional.ts | Brand in the name, professional output | 04 |
| 2026-03-07 | Jest 29 for mobile (not 30) | Jest 30 has scope check (`isInsideTestCode`) incompatible with jest-expo in monorepos with hoisted deps | 07 |
| 2026-03-07 | `react-native-worklets` added as peer dep | Required by `react-native-reanimated` v4 for Babel plugin | 07 |
| 2026-03-08 | Pluggable SessionFactory for Agent SDK | SDK not published yet; mock factory allows end-to-end testing. setSessionFactory() swaps in the real SDK later. | 10 |
| 2026-03-08 | Separate SDK session map from regret-tracker | SDK session handle is an implementation detail; SessionState is the contract. Keeps concerns clean. | 10 |

## Session Log

| Date | Session | Steps Touched | Notes |
|---|---|---|---|
| 2026-03-06 | Initial planning | 00 | Created build steps, design doc, updated CLAUDE.md |
| 2026-03-06 | Step 01 implementation | 01 | Monorepo scaffold, pushed to GitHub. Remote: akellaluvlace/TimeToRelax |
| 2026-03-06 | Landing page | 19 | Next.js 16 landing page, deployed to Vercel at timetorelax.app |
| 2026-03-07 | Step 02 implementation | 02 | Shared types: session, events, voice, errors, api, personality. All compile clean. |
| 2026-03-07 | Step 03 implementation | 03 | Fastify skeleton: app factory, config, health route, error handler, Dockerfile. 6/6 tests pass. |
| 2026-03-07 | Step 04 implementation | 04 | Backend logger: dear-diary.ts with pino, openChapter child factory, integrated into app.ts + entry point. 9 new tests, 15 total pass. |
| 2026-03-07 | Step 07 implementation | 07 | Mobile Expo skeleton: SDK 55, expo-router, NativeWind v4, Zustand stores, 3 screens w/ all states, confessional.ts logger, RadioGroup, 34/34 tests pass. |
| 2026-03-08 | Step 05 implementation | 05 | SSE streaming: the-void.ts service (ring buffer, reconnection replay, multi-client), the-void-route.ts (GET /session/:id/stream), 28 new tests, 43 total pass. |
| 2026-03-08 | Step 06 implementation | 06 | Personality engine: denial-engine.ts (craftDisapproval + consultTheOracle stub), templates.ts (17 states, 3+ per state), banned-words.ts, ERROR_RECOVERY added to shared types. 23 new tests, 38 total pass. |
| 2026-03-08 | Step 10 implementation | 10 | Agent SDK session manager: enabler.ts (spawn/instruct/resume/terminate), regret-tracker.ts (TTL store, shame threshold), session-routes.ts (4 Fastify routes), mock SDK factory. 51 new tests, 117 total pass. |
| 2026-03-08 | Steps 08-09, 11-18, 20 | 08-18, 20 | Full build blitz: voice capture, Deepgram, E2B, new/existing project modes, GitHub OAuth, diff view, ship flow, resilience, Grok voice, onboarding. 277 backend + 193 mobile = 470 total tests. |
