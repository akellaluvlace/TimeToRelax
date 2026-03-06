# Step 12: New Project Mode (End-to-End)

**Status:** not-started
**Depends on:** Step 09, Step 10, Step 11
**Estimated scope:** ~8 files

## Done When

A user can voice a project idea, hear a cynical acknowledgment, watch the agent scaffold a project in a live sandbox, see the file tree update in real-time via SSE, and view a running preview of the scaffolded app in an embedded WebView.

## Tasks

- [ ] Create New Project screen in mobile app
- [ ] Implement voice brief flow: hold to talk -> transcript -> personality response
- [ ] Backend: parse transcript into agent instruction with scaffolding context
- [ ] Backend: select E2B template based on detected stack (Next.js, Express, etc.)
- [ ] Agent SDK: send scaffolding instruction with pre-warmed sandbox
- [ ] Stream file creation events via SSE to mobile app
- [ ] Mobile: render real-time file tree as files are created
- [ ] Mobile: embedded WebView for live preview URL from E2B
- [ ] Mobile: basic diff view showing created files
- [ ] Mobile: personality voice response on completion ("It works. Don't touch it.")
- [ ] Write test: full flow with mocked agent (voice -> scaffold -> preview)
- [ ] Write test: file tree updates from SSE events
- [ ] Write test: preview URL renders in WebView

## Files To Create

```
apps/mobile/app/new-project.tsx                     # New project screen
apps/mobile/src/components/FileTree.tsx              # File tree display component
apps/mobile/src/components/LivePreview.tsx           # WebView for E2B preview
apps/mobile/src/components/VoiceBrief.tsx            # Voice input + transcript display
apps/mobile/src/hooks/useAgentSession.ts            # Hook: manages SSE connection + events
apps/backend/src/routes/new-project-routes.ts       # POST /session/new-project
apps/mobile/src/__tests__/useAgentSession.test.ts   # Session hook tests
apps/mobile/src/__tests__/FileTree.test.ts          # Component tests
```

## Implementation Design

### Flow
```
1. User opens New Project screen
2. User holds mic button, describes project
3. Audio -> Deepgram STT -> transcript
4. Backend: personality response ("Let's pretend this is productive.")
5. Backend: create session + sandbox (pre-warmed template)
6. Backend: send instruction to agent: "Scaffold a {stack} project: {transcript}"
7. Agent: creates files, installs deps, starts dev server
8. SSE events stream to mobile: file_changed, preview_ready
9. Mobile: file tree grows in real-time, preview loads in WebView
10. Personality response: "It works. Don't touch it."
```

### New Project Route
```typescript
// POST /session/new-project
// Body: { anthropicKey, transcript, stack?: string }
// Response: { sessionId } + SSE stream begins
```

### useAgentSession Hook
```typescript
/**
 * Connects to the SSE stream for an agent session.
 * Watches the agent work in real-time like watching a car crash in slow motion.
 * Except the car is your codebase and the crash might actually be a feature.
 *
 * @param sessionId - The session to watch
 * @returns Events, file changes, preview URL, and session state
 */
function useAgentSession(sessionId: string): {
  events: AgentEvent[];
  filesChanged: FileChange[];
  previewUrl: string | null;
  phase: SessionPhase;
  isConnected: boolean;
}
```

## Acceptance Criteria

- [ ] Voice -> transcript -> agent instruction works end-to-end
- [ ] Personality response plays before agent starts working
- [ ] File tree updates in real-time as agent creates files
- [ ] Preview URL loads in embedded WebView
- [ ] Pre-warmed template used (sandbox creation <200ms)
- [ ] Completion personality response plays when agent finishes
- [ ] Works on real Android device
- [ ] `tsc --noEmit` passes
- [ ] All tests pass

## Notes

- This is the Week 1 deliverable from the spec: "Voice a project idea, watch the agent build it, see it running in preview."
- Stack detection can be simple: if transcript mentions "Next", "React", "Express", "FastAPI", pick the matching template. Default to Node.js.
- The file tree component is reused in step 15 (diff view). Keep it generic.
- The `useAgentSession` hook is reused everywhere. Build it well.
- Per CLAUDE.md: screens must handle loading, error, and empty states.
- Keep the New Project screen under 150 lines. Logic goes in hooks.
