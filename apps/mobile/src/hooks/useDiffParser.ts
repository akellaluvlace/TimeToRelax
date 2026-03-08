// useDiffParser.ts -- Parses unified diff strings into structured objects.
// Because staring at raw diffs on a phone is a new form of masochism,
// and we at least owe our users structured masochism.

import type { DiffHunk, DiffLine, DiffLineType, FileAction, FileDiff } from '@/types/diff';

/**
 * Parses a unified diff string into a structured FileDiff object.
 * Takes the raw text output from `git diff` and turns it into
 * something a FlatList can render without having a seizure.
 *
 * Supports standard unified diff format:
 * - Lines starting with '+' are additions
 * - Lines starting with '-' are removals
 * - Lines starting with ' ' or anything else are context
 * - Lines starting with '@@' are hunk headers
 *
 * @param diffString - The raw unified diff text. Straight from the agent's chaos.
 * @param path - The file path this diff belongs to
 * @param action - Whether the file was created, modified, or deleted
 * @returns A structured FileDiff ready for rendering on a tiny screen
 */
export function parseDiff(diffString: string, path: string, action: FileAction): FileDiff {
  if (!diffString.trim()) {
    return {
      path,
      action,
      hunks: [],
      additions: 0,
      deletions: 0,
    };
  }

  const lines = diffString.split('\n');
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffHunk | null = null;
  let additions = 0;
  let deletions = 0;
  let lineNumber = 1;

  for (const line of lines) {
    // Hunk header: @@ -start,count +start,count @@
    if (line.startsWith('@@')) {
      const match = /@@ -\d+(?:,\d+)? \+(\d+)/.exec(line);
      const captured = match?.[1];
      const startLine = captured ? parseInt(captured, 10) : 1;

      currentHunk = { startLine, lines: [] };
      hunks.push(currentHunk);
      lineNumber = startLine;
      continue;
    }

    // Skip diff headers (---, +++, diff --git, index lines)
    if (
      line.startsWith('---') ||
      line.startsWith('+++') ||
      line.startsWith('diff --git') ||
      line.startsWith('index ')
    ) {
      continue;
    }

    // If we're not inside a hunk yet, start one implicitly
    // (some diffs from agents don't include @@ headers)
    if (!currentHunk) {
      currentHunk = { startLine: 1, lines: [] };
      hunks.push(currentHunk);
    }

    let type: DiffLineType;
    let content: string;

    if (line.startsWith('+')) {
      type = 'add';
      content = line.slice(1);
      additions++;
    } else if (line.startsWith('-')) {
      type = 'remove';
      content = line.slice(1);
      deletions++;
    } else {
      type = 'context';
      // Remove the leading space if present (standard unified diff format)
      content = line.startsWith(' ') ? line.slice(1) : line;
    }

    const diffLine: DiffLine = {
      type,
      content,
      lineNumber,
    };

    currentHunk.lines.push(diffLine);

    // Only increment line number for context and additions
    // (removals don't exist in the new file)
    if (type !== 'remove') {
      lineNumber++;
    }
  }

  return {
    path,
    action,
    hunks,
    additions,
    deletions,
  };
}
