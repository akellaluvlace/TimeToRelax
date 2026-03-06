# Step 15: Diff View & File Tree UI

**Status:** not-started
**Depends on:** Step 07, Step 14
**Estimated scope:** ~8 files

## Done When

Mobile app shows a visual diff view (file-by-file, syntax highlighted, additions/deletions) and a collapsible file tree. Both update in real-time from SSE events. User can tap a file in the tree to preview its current state.

## Tasks

- [ ] Evaluate diff rendering: `react-native-diff-view` vs custom component
- [ ] Create `DiffView` component: file-by-file diffs with syntax highlighting
- [ ] Show additions (green), deletions (red), context lines
- [ ] Create `FileTree` component: collapsible tree, tap to preview file
- [ ] Create `FilePreview` component: shows file content with syntax highlighting
- [ ] Wire diff data from SSE `diff_update` events to DiffView
- [ ] Wire file tree from SSE `file_changed` events to FileTree
- [ ] Create session split view: diff/tree on top, preview on bottom (or swipeable)
- [ ] Handle large diffs: collapse by default, expand on tap
- [ ] Write test: DiffView renders additions and deletions correctly
- [ ] Write test: FileTree updates from SSE events
- [ ] Write test: file tap triggers preview

## Files To Create

```
apps/mobile/src/components/DiffView.tsx             # Visual diff renderer
apps/mobile/src/components/DiffFile.tsx             # Single file diff
apps/mobile/src/components/FileTree.tsx             # Updated: collapsible tree
apps/mobile/src/components/FilePreview.tsx          # File content viewer
apps/mobile/src/components/SessionView.tsx          # Split view: diff + preview
apps/mobile/src/__tests__/DiffView.test.tsx        # Diff render tests
apps/mobile/src/__tests__/FileTree.test.tsx        # Tree interaction tests
```

## Implementation Design

### DiffView
```tsx
/**
 * Renders file diffs like a code review.
 * Green lines: what the agent added. Red lines: what it removed.
 * On a 6-inch screen. On the bus. At 11pm.
 * Software engineering has peaked and this is it.
 *
 * @param diffs - Array of file diffs from the agent session
 */
function DiffView({ diffs }: DiffViewProps): JSX.Element;
```

### Diff Data Shape
```typescript
interface FileDiff {
  path: string;
  action: 'created' | 'modified' | 'deleted';
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}

interface DiffHunk {
  startLine: number;
  lines: DiffLine[];
}

interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber: number;
}
```

### FileTree
```tsx
/**
 * Collapsible file tree showing the repo structure.
 * Tap a file to preview its current state.
 * The tree updates in real-time as the agent creates/modifies files.
 * It's like watching your codebase grow in real-time horror.
 *
 * @param files - File nodes from manifest or SSE events
 * @param onFileSelect - Called when user taps a file
 */
function FileTree({ files, onFileSelect }: FileTreeProps): JSX.Element;
```

### SessionView Layout
```
┌─────────────────────────┐
│ [Diff] [Tree] [Preview] │  <- tab bar
├─────────────────────────┤
│                         │
│  Active tab content     │
│                         │
│                         │
├─────────────────────────┤
│  Voice bar (mic button) │
└─────────────────────────┘
```

## Acceptance Criteria

- [ ] Diff view shows file-by-file changes with syntax highlighting
- [ ] Additions render in green, deletions in red
- [ ] File tree is collapsible, shows repo structure
- [ ] Tap file in tree opens preview with syntax highlighting
- [ ] Both update in real-time from SSE events
- [ ] Large diffs collapse by default
- [ ] Summary line: "{n} files changed, {a} additions, {d} deletions"
- [ ] Works on small screen (6-inch phone)
- [ ] No inline styles longer than 3 properties
- [ ] `tsc --noEmit` passes
- [ ] All tests pass

## Notes

- Per spec: "Output is never a raw code dump. Always: files changed, summary card, diff."
- Syntax highlighting on RN is tricky. Evaluate `react-native-syntax-highlighter` or a lightweight custom solution.
- The diff data comes from the agent's file operations. The backend generates unified diffs from before/after states.
- Keep components small per CLAUDE.md: under 150 lines each. The SessionView orchestrates; DiffView, FileTree, FilePreview are leaf components.
- The voice bar with mic button stays visible at the bottom of all session views.
