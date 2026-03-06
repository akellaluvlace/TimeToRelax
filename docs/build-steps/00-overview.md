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
| 01 | Git Init & Monorepo Scaffold | not-started | | | |
| 02 | Shared Types Package | not-started | | | |
| 03 | Backend Fastify Skeleton | not-started | | | |
| 04 | Runtime Logger (dear-diary.ts) | not-started | | | |
| 05 | SSE Streaming (the-void.ts) | not-started | | | |
| 06 | Personality Engine (denial-engine.ts) | not-started | | | |
| 07 | Mobile Expo Skeleton | not-started | | | |
| 08 | Voice Capture (expo-audio) | not-started | | | |
| 09 | Deepgram STT/TTS Integration | not-started | | | |
| 10 | Agent SDK Session Manager (enabler.ts) | not-started | | | |
| 11 | E2B Sandbox Lifecycle (grass-toucher.ts) | not-started | | | |
| 12 | New Project Mode (end-to-end) | not-started | | | |
| 13 | GitHub OAuth & Repo Connect | not-started | | | |
| 14 | Existing Project Mode | not-started | | | |
| 15 | Diff View & File Tree UI | not-started | | | |
| 16 | Ship Flow (commit, push, PR) | not-started | | | |
| 17 | Session Resilience & Reconnection | not-started | | | |
| 18 | Grok Voice Upgrade Path | not-started | | | |
| 19 | Landing Page (timetorelax.app) | not-started | | | |
| 20 | Polish, Onboarding & Launch Prep | not-started | | | |

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

## Session Log

| Date | Session | Steps Touched | Notes |
|---|---|---|---|
| 2026-03-06 | Initial planning | 00 | Created build steps, design doc, updated CLAUDE.md |
