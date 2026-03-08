// DiffFile.test.tsx -- Testing the single file diff component.
// Headers, expansion, color coding. The traffic light of code changes.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { DiffFile } from '@/components/DiffFile';
import type { FileDiff } from '@/types/diff';

const sampleDiff: FileDiff = {
  path: 'src/services/enabler.ts',
  action: 'modified',
  additions: 5,
  deletions: 2,
  hunks: [
    {
      startLine: 10,
      lines: [
        { type: 'context', content: 'import { something } from "somewhere";', lineNumber: 10 },
        { type: 'remove', content: 'const old = true;', lineNumber: 11 },
        { type: 'add', content: 'const new1 = true;', lineNumber: 11 },
        { type: 'add', content: 'const new2 = false;', lineNumber: 12 },
        { type: 'context', content: 'export default {};', lineNumber: 13 },
      ],
    },
  ],
};

const createdDiff: FileDiff = {
  path: 'src/new-file.ts',
  action: 'created',
  additions: 3,
  deletions: 0,
  hunks: [
    {
      startLine: 1,
      lines: [
        { type: 'add', content: 'export const hello = "world";', lineNumber: 1 },
      ],
    },
  ],
};

const deletedDiff: FileDiff = {
  path: 'src/old-file.ts',
  action: 'deleted',
  additions: 0,
  deletions: 4,
  hunks: [
    {
      startLine: 1,
      lines: [
        { type: 'remove', content: 'const dead = true;', lineNumber: 1 },
      ],
    },
  ],
};

describe('DiffFile', () => {
  it('should render the file header with path and stats', () => {
    const onToggle = jest.fn();
    render(<DiffFile diff={sampleDiff} isExpanded={false} onToggle={onToggle} />);

    expect(screen.getByText('src/services/enabler.ts')).toBeTruthy();
    expect(screen.getByText('+5')).toBeTruthy();
    expect(screen.getByText('-2')).toBeTruthy();
  });

  it('should show the action badge', () => {
    const onToggle = jest.fn();
    render(<DiffFile diff={sampleDiff} isExpanded={false} onToggle={onToggle} />);

    expect(screen.getByText('modified')).toBeTruthy();
  });

  it('should show created badge for new files', () => {
    const onToggle = jest.fn();
    render(<DiffFile diff={createdDiff} isExpanded={false} onToggle={onToggle} />);

    expect(screen.getByText('created')).toBeTruthy();
  });

  it('should show deleted badge for removed files', () => {
    const onToggle = jest.fn();
    render(<DiffFile diff={deletedDiff} isExpanded={false} onToggle={onToggle} />);

    expect(screen.getByText('deleted')).toBeTruthy();
  });

  it('should not show diff lines when collapsed', () => {
    const onToggle = jest.fn();
    render(<DiffFile diff={sampleDiff} isExpanded={false} onToggle={onToggle} />);

    // The content lines should not be visible when collapsed
    expect(screen.queryByText('const old = true;')).toBeNull();
    expect(screen.queryByText('const new1 = true;')).toBeNull();
  });

  it('should show diff lines when expanded', () => {
    const onToggle = jest.fn();
    render(<DiffFile diff={sampleDiff} isExpanded={true} onToggle={onToggle} />);

    // Expanded: lines should be visible
    expect(screen.getByText('const old = true;')).toBeTruthy();
    expect(screen.getByText('const new1 = true;')).toBeTruthy();
    expect(screen.getByText('const new2 = false;')).toBeTruthy();
  });

  it('should show line numbers when expanded', () => {
    const onToggle = jest.fn();
    render(<DiffFile diff={sampleDiff} isExpanded={true} onToggle={onToggle} />);

    // Line numbers from the hunk
    expect(screen.getByText('10')).toBeTruthy();
    // 11 appears twice (once for the remove line, once for the add line)
    expect(screen.getAllByText('11').length).toBeGreaterThanOrEqual(1);
  });

  it('should call onToggle when the header is pressed', () => {
    const onToggle = jest.fn();
    render(<DiffFile diff={sampleDiff} isExpanded={false} onToggle={onToggle} />);

    fireEvent.press(screen.getByText('src/services/enabler.ts'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should show collapse arrow when expanded and expand arrow when collapsed', () => {
    const onToggle = jest.fn();
    const { rerender } = render(
      <DiffFile diff={sampleDiff} isExpanded={false} onToggle={onToggle} />,
    );

    // Collapsed: right-pointing triangle
    expect(screen.getByText('\u25B6')).toBeTruthy();

    rerender(<DiffFile diff={sampleDiff} isExpanded={true} onToggle={onToggle} />);

    // Expanded: down-pointing triangle
    expect(screen.getByText('\u25BC')).toBeTruthy();
  });
});
