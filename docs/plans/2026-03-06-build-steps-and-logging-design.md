# Build Steps & Logging System Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a comprehensive 20-step build plan in `docs/build-steps/` with a master progress tracker, update CLAUDE.md to reference it, and design both a build progress log and runtime logging system.

**Architecture:** Flat numbered markdown files (00-20) in `docs/build-steps/`. Each file is a self-contained work unit with dependencies, tasks, acceptance criteria. Step 00 is the master index and progress log. Runtime logger is `dear-diary.ts` (backend, pino-based) and `confessional.ts` (mobile, console wrapper). Both output structured JSON with personality in naming only.

**Tech Stack:** Markdown for plans, pino for backend logging, custom wrapper for mobile.

**Source Documents:**
- `timetorelax-spec-v2.2.md` -- Product spec (architecture, features, timeline)
- `CLAUDE.md` -- Operating manual (coding standards, naming, personality)
- `timetorelax-landing.md` -- Landing page copy + Grok system prompt + design specs

---

## Decisions

1. **Step granularity:** ~20 steps, each 0.5-2 days of work
2. **Step template:** Status, dependencies, done-when, tasks, files, acceptance criteria
3. **Progress tracking:** Step 00 doubles as master index + decision log + session log
4. **Runtime logger (backend):** `dear-diary.ts`, pino, structured JSON, standard levels
5. **Runtime logger (mobile):** `confessional.ts`, console wrapper, strips in production
6. **Personality scope:** File names and JSDoc only; log output stays parseable

## Step Index

| # | Title | Phase |
|---|---|---|
| 00 | Overview & Progress Log | -- |
| 01 | Git Init & Monorepo Scaffold | Week 1 |
| 02 | Shared Types Package | Week 1 |
| 03 | Backend Fastify Skeleton | Week 1 |
| 04 | Runtime Logger (dear-diary.ts) | Week 1 |
| 05 | SSE Streaming (the-void.ts) | Week 1 |
| 06 | Personality Engine (denial-engine.ts) | Week 1 |
| 07 | Mobile Expo Skeleton | Week 1 |
| 08 | Voice Capture (expo-audio) | Week 1 |
| 09 | Deepgram STT/TTS Integration | Week 1 |
| 10 | Agent SDK Session Manager (enabler.ts) | Week 1 |
| 11 | E2B Sandbox Lifecycle (grass-toucher.ts) | Week 1 |
| 12 | New Project Mode (end-to-end) | Week 1 |
| 13 | GitHub OAuth & Repo Connect | Week 2 |
| 14 | Existing Project Mode | Week 2 |
| 15 | Diff View & File Tree UI | Week 2 |
| 16 | Ship Flow (commit, push, PR) | Week 2 |
| 17 | Session Resilience & Reconnection | Week 3 |
| 18 | Grok Voice Upgrade Path | Week 3 |
| 19 | Landing Page (timetorelax.app) | Week 3 |
| 20 | Polish, Onboarding & Launch Prep | Week 4 |
