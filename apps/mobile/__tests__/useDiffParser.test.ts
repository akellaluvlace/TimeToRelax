// useDiffParser.test.ts -- Testing the diff parser.
// Making sure raw unified diffs become structured objects
// that a FlatList won't choke on. The bar is low. We clear it.

import { parseDiff } from '@/hooks/useDiffParser';

describe('parseDiff', () => {
  it('should parse a simple unified diff with additions and deletions', () => {
    const diffString = [
      '@@ -1,3 +1,4 @@',
      ' const a = 1;',
      '-const b = 2;',
      '+const b = 3;',
      '+const c = 4;',
      ' const d = 5;',
    ].join('\n');

    const result = parseDiff(diffString, 'src/index.ts', 'modified');

    expect(result.path).toBe('src/index.ts');
    expect(result.action).toBe('modified');
    expect(result.additions).toBe(2);
    expect(result.deletions).toBe(1);
    expect(result.hunks).toHaveLength(1);

    const hunk = result.hunks[0]!;
    expect(hunk.startLine).toBe(1);
    expect(hunk.lines).toHaveLength(5);
  });

  it('should correctly identify line types', () => {
    const diffString = [
      '@@ -1,2 +1,2 @@',
      ' context line',
      '-removed line',
      '+added line',
    ].join('\n');

    const result = parseDiff(diffString, 'test.ts', 'modified');
    const lines = result.hunks[0]!.lines;

    expect(lines[0]!.type).toBe('context');
    expect(lines[0]!.content).toBe('context line');

    expect(lines[1]!.type).toBe('remove');
    expect(lines[1]!.content).toBe('removed line');

    expect(lines[2]!.type).toBe('add');
    expect(lines[2]!.content).toBe('added line');
  });

  it('should count additions and deletions correctly', () => {
    const diffString = [
      '@@ -1,5 +1,7 @@',
      '+new line 1',
      '+new line 2',
      '+new line 3',
      ' context',
      '-old line 1',
      '-old line 2',
      ' more context',
    ].join('\n');

    const result = parseDiff(diffString, 'counter.ts', 'modified');

    expect(result.additions).toBe(3);
    expect(result.deletions).toBe(2);
  });

  it('should handle empty diff strings', () => {
    const result = parseDiff('', 'empty.ts', 'modified');

    expect(result.path).toBe('empty.ts');
    expect(result.action).toBe('modified');
    expect(result.additions).toBe(0);
    expect(result.deletions).toBe(0);
    expect(result.hunks).toHaveLength(0);
  });

  it('should handle whitespace-only diff strings', () => {
    const result = parseDiff('   \n\t\n  ', 'blank.ts', 'created');

    expect(result.additions).toBe(0);
    expect(result.deletions).toBe(0);
    expect(result.hunks).toHaveLength(0);
  });

  it('should parse multiple hunks', () => {
    const diffString = [
      '@@ -1,3 +1,3 @@',
      ' line 1',
      '-old line 2',
      '+new line 2',
      '@@ -10,3 +10,3 @@',
      ' line 10',
      '-old line 11',
      '+new line 11',
    ].join('\n');

    const result = parseDiff(diffString, 'multi.ts', 'modified');

    expect(result.hunks).toHaveLength(2);
    expect(result.hunks[0]!.startLine).toBe(1);
    expect(result.hunks[1]!.startLine).toBe(10);
  });

  it('should skip diff header lines (---, +++, diff --git, index)', () => {
    const diffString = [
      'diff --git a/file.ts b/file.ts',
      'index abc123..def456 100644',
      '--- a/file.ts',
      '+++ b/file.ts',
      '@@ -1,2 +1,2 @@',
      '-old',
      '+new',
    ].join('\n');

    const result = parseDiff(diffString, 'file.ts', 'modified');

    expect(result.additions).toBe(1);
    expect(result.deletions).toBe(1);
    // Should not include the header lines as diff content
    expect(result.hunks).toHaveLength(1);
    expect(result.hunks[0]!.lines).toHaveLength(2);
  });

  it('should handle diffs without @@ headers by creating an implicit hunk', () => {
    const diffString = [
      '+first line',
      '+second line',
      '+third line',
    ].join('\n');

    const result = parseDiff(diffString, 'no-header.ts', 'created');

    expect(result.hunks).toHaveLength(1);
    expect(result.hunks[0]!.startLine).toBe(1);
    expect(result.hunks[0]!.lines).toHaveLength(3);
    expect(result.additions).toBe(3);
  });

  it('should preserve the file action passed in', () => {
    const diffString = '@@ -1,1 +1,0 @@\n-deleted line';

    const created = parseDiff(diffString, 'a.ts', 'created');
    const modified = parseDiff(diffString, 'b.ts', 'modified');
    const deleted = parseDiff(diffString, 'c.ts', 'deleted');

    expect(created.action).toBe('created');
    expect(modified.action).toBe('modified');
    expect(deleted.action).toBe('deleted');
  });

  it('should handle line numbers correctly for context and additions', () => {
    const diffString = [
      '@@ -5,4 +5,5 @@',
      ' context at line 5',
      '+added at line 6',
      ' context at line 7',
      '-removed from line 8',
      '+added at line 8',
    ].join('\n');

    const result = parseDiff(diffString, 'lines.ts', 'modified');
    const lines = result.hunks[0]!.lines;

    expect(lines[0]!.lineNumber).toBe(5); // context
    expect(lines[1]!.lineNumber).toBe(6); // add
    expect(lines[2]!.lineNumber).toBe(7); // context
    expect(lines[3]!.lineNumber).toBe(8); // remove (keeps the line number of what follows)
    expect(lines[4]!.lineNumber).toBe(8); // add (takes the same line number since remove doesn't advance)
  });
});
