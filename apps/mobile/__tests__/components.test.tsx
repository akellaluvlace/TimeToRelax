// components.test.tsx -- Testing the state components.
// Making sure loading, error, and empty states render
// without blowing up. The bar is low. We clear it.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

describe('LoadingState', () => {
  it('should render with default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Working on it. Unlike you.')).toBeTruthy();
  });

  it('should render with custom message', () => {
    render(<LoadingState message="Spawning regret..." />);
    expect(screen.getByText('Spawning regret...')).toBeTruthy();
  });
});

describe('ErrorState', () => {
  it('should render with default message', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something broke. Naturally.')).toBeTruthy();
  });

  it('should render with custom message', () => {
    render(<ErrorState message="Sandbox died. This is fine." />);
    expect(screen.getByText('Sandbox died. This is fine.')).toBeTruthy();
  });

  it('should render retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByText('Try again despite evidence')).toBeTruthy();
  });

  it('should call onRetry when retry button is pressed', () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} />);
    fireEvent.press(screen.getByText('Try again despite evidence'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not render retry button when onRetry is not provided', () => {
    render(<ErrorState />);
    expect(screen.queryByText('Try again despite evidence')).toBeNull();
  });
});

describe('EmptyState', () => {
  it('should render with default message', () => {
    render(<EmptyState />);
    expect(screen.getByText('Nothing here. Yet. Give it time.')).toBeTruthy();
  });

  it('should render with custom message', () => {
    render(<EmptyState message="No sessions. The void is empty." />);
    expect(screen.getByText('No sessions. The void is empty.')).toBeTruthy();
  });
});
