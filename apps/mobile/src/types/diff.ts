// diff.ts -- Types for rendering diffs on a phone screen.
// Because nothing says "I'm a serious engineer" like
// reviewing pull requests on the 46A bus.

/** The action performed on a file. Creation, modification, or deletion. The circle of code life. */
type FileAction = 'created' | 'modified' | 'deleted';

/** The type of a diff line. Added, removed, or context. Traffic light colors for your mistakes. */
type DiffLineType = 'add' | 'remove' | 'context';

/**
 * A single line in a diff hunk.
 * Each line knows what it is: an addition, a removal, or just context
 * awkwardly standing around like a bystander at a car crash.
 */
interface DiffLine {
  /** Whether this line was added, removed, or is just context for the carnage. */
  type: DiffLineType;
  /** The actual text content of the line. */
  content: string;
  /** The line number in the file. Zero-indexed would be chaos, so it's one-indexed. */
  lineNumber: number;
}

/**
 * A contiguous block of changes in a file.
 * Hunks are how diffs organize themselves. Each hunk has a starting line
 * and a list of diff lines. Like paragraphs, but for destruction.
 */
interface DiffHunk {
  /** The line number where this hunk starts in the original file. */
  startLine: number;
  /** The lines in this hunk. Added, removed, and context lines together. */
  lines: DiffLine[];
}

/**
 * A complete diff for a single file.
 * Contains everything you need to understand what happened to this file
 * and how many lines of code were born or killed.
 */
interface FileDiff {
  /** The file path relative to the project root. */
  path: string;
  /** What happened to the file: created, modified, or deleted. */
  action: FileAction;
  /** The hunks of changes. Where the actual diff lives. */
  hunks: DiffHunk[];
  /** Number of lines added. The optimistic metric. */
  additions: number;
  /** Number of lines removed. The productive metric. */
  deletions: number;
}

export type { DiffLine, DiffLineType, DiffHunk, FileDiff, FileAction };
