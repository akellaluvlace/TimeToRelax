// FileTree.test.tsx -- Testing the file tree component.
// Making sure color coding works, empty states render,
// and tapping files does what it should.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { FileTree } from '@/components/FileTree';
import type { FileChange } from '@/hooks/useAgentSession';

const sampleFiles: FileChange[] = [
  { path: 'src/index.ts', action: 'created' },
  { path: 'package.json', action: 'modified' },
  { path: 'old-config.js', action: 'deleted' },
];

describe('FileTree', () => {
  it('should render the empty state when no files are provided', () => {
    render(<FileTree files={[]} />);
    expect(screen.getByText('No files changed yet. The agent is warming up.')).toBeTruthy();
  });

  it('should render the list of files', () => {
    render(<FileTree files={sampleFiles} />);

    expect(screen.getByText('src/index.ts')).toBeTruthy();
    expect(screen.getByText('package.json')).toBeTruthy();
    expect(screen.getByText('old-config.js')).toBeTruthy();
  });

  it('should show action indicators for each file', () => {
    render(<FileTree files={sampleFiles} />);

    // + for created, ~ for modified, - for deleted
    const plusSigns = screen.getAllByText('+');
    expect(plusSigns.length).toBeGreaterThanOrEqual(1);

    const tildes = screen.getAllByText('~');
    expect(tildes.length).toBeGreaterThanOrEqual(1);

    const minuses = screen.getAllByText('-');
    expect(minuses.length).toBeGreaterThanOrEqual(1);
  });

  it('should display the file count', () => {
    render(<FileTree files={sampleFiles} />);
    expect(screen.getByText('3 files changed')).toBeTruthy();
  });

  it('should display singular "file" for a single file', () => {
    render(<FileTree files={[{ path: 'solo.ts', action: 'created' }]} />);
    expect(screen.getByText('1 file changed')).toBeTruthy();
  });

  it('should call onFileSelect when a file is tapped', () => {
    const onFileSelect = jest.fn();
    render(<FileTree files={sampleFiles} onFileSelect={onFileSelect} />);

    fireEvent.press(screen.getByText('src/index.ts'));
    expect(onFileSelect).toHaveBeenCalledWith('src/index.ts');
  });

  it('should not crash when onFileSelect is not provided', () => {
    // Should render without errors even without onFileSelect
    expect(() => {
      render(<FileTree files={sampleFiles} />);
    }).not.toThrow();
  });
});
