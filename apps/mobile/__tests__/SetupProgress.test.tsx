// SetupProgress.test.tsx -- Testing the setup progress component.
// Making sure the spinner shows up when it should,
// and disappears when it shouldn't. Low bar. We clear it.

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { SetupProgress } from '@/components/SetupProgress';

describe('SetupProgress', () => {
  it('should render the progress message when active', () => {
    render(<SetupProgress message="Cloning repository..." isActive />);
    expect(screen.getByText('Cloning repository...')).toBeTruthy();
  });

  it('should render the filler text when active', () => {
    render(<SetupProgress message="Installing dependencies..." isActive />);
    expect(screen.getByText('This takes a moment. Use the time wisely. Or don\'t.')).toBeTruthy();
  });

  it('should render nothing when isActive is false', () => {
    const { toJSON } = render(
      <SetupProgress message="Should not appear" isActive={false} />,
    );
    expect(toJSON()).toBeNull();
  });

  it('should show different messages for different setup phases', () => {
    const { rerender } = render(
      <SetupProgress message="Cloning repository..." isActive />,
    );
    expect(screen.getByText('Cloning repository...')).toBeTruthy();

    rerender(<SetupProgress message="Reading codebase..." isActive />);
    expect(screen.getByText('Reading codebase...')).toBeTruthy();
  });
});
