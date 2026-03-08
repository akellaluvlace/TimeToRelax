// DiffView.test.tsx -- Testing the diff view component.
// Making sure summaries render, file headers show up,
// empty states work, and onFileSelect fires when it should.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { DiffView } from '@/components/DiffView';
import type { FileDiff } from '@/types/diff';

const sampleDiffs: FileDiff[] = [
  {
    path: 'src/index.ts',
    action: 'created',
    additions: 10,
    deletions: 0,
    hunks: [
      {
        startLine: 1,
        lines: [
          { type: 'add', content: 'const x = 1;', lineNumber: 1 },
          { type: 'add', content: 'const y = 2;', lineNumber: 2 },
        ],
      },
    ],
  },
  {
    path: 'package.json',
    action: 'modified',
    additions: 3,
    deletions: 1,
    hunks: [
      {
        startLine: 5,
        lines: [
          { type: 'context', content: '"name": "test"', lineNumber: 5 },
          { type: 'remove', content: '"version": "1.0.0"', lineNumber: 6 },
          { type: 'add', content: '"version": "2.0.0"', lineNumber: 6 },
        ],
      },
    ],
  },
  {
    path: 'old-config.js',
    action: 'deleted',
    additions: 0,
    deletions: 5,
    hunks: [
      {
        startLine: 1,
        lines: [
          { type: 'remove', content: 'module.exports = {};', lineNumber: 1 },
        ],
      },
    ],
  },
];

describe('DiffView', () => {
  it('should render the summary with file count, additions, and deletions', () => {
    render(<DiffView diffs={sampleDiffs} />);

    // Summary: "3 files changed, 13 additions, 6 deletions"
    expect(screen.getByText(/3 files changed/)).toBeTruthy();
    expect(screen.getByText(/13 additions/)).toBeTruthy();
    expect(screen.getByText(/6 deletions/)).toBeTruthy();
  });

  it('should render file headers with paths', () => {
    render(<DiffView diffs={sampleDiffs} />);

    expect(screen.getByText('src/index.ts')).toBeTruthy();
    expect(screen.getByText('package.json')).toBeTruthy();
    expect(screen.getByText('old-config.js')).toBeTruthy();
  });

  it('should show empty state when no diffs are provided', () => {
    render(<DiffView diffs={[]} />);

    expect(
      screen.getByText("No diffs yet. The agent hasn't broken anything. Yet."),
    ).toBeTruthy();
  });

  it('should handle singular file/addition/deletion counts', () => {
    const singleDiff: FileDiff[] = [
      {
        path: 'solo.ts',
        action: 'modified',
        additions: 1,
        deletions: 1,
        hunks: [],
      },
    ];

    render(<DiffView diffs={singleDiff} />);

    expect(screen.getByText(/1 file changed/)).toBeTruthy();
    expect(screen.getByText(/1 addition,/)).toBeTruthy();
    expect(screen.getByText(/1 deletion/)).toBeTruthy();
  });

  it('should call onFileSelect when expanding a file', () => {
    const onFileSelect = jest.fn();
    render(<DiffView diffs={sampleDiffs} onFileSelect={onFileSelect} />);

    // Tap the first file header to expand it
    fireEvent.press(screen.getByText('src/index.ts'));
    expect(onFileSelect).toHaveBeenCalledWith('src/index.ts');
  });

  it('should not crash when onFileSelect is not provided', () => {
    expect(() => {
      render(<DiffView diffs={sampleDiffs} />);
    }).not.toThrow();
  });
});
