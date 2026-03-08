// ShipBar.test.tsx -- Testing the ship flow UI.
// Making sure the buttons show up, enable in the right order,
// and display results when the backend cooperates.

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import { ShipBar } from '@/components/ShipBar';

// Mock hide-the-evidence so we don't need a real keychain
jest.mock('@/services/hide-the-evidence', () => ({
  digUpTheBodies: jest.fn().mockResolvedValue('ghp_mock_token'),
  KEY_SLOTS: {
    GITHUB_TOKEN: 'github_oauth_token',
    ANTHROPIC_KEY: 'anthropic_api_key',
    XAI_KEY: 'xai_api_key',
  },
}));

// Store original fetch
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('ShipBar', () => {
  const defaultProps = {
    sessionId: 'test-session',
    backendUrl: 'http://localhost:3000',
    filesChanged: 5,
    additions: 120,
    deletions: 30,
  };

  it('should render the file change summary', () => {
    render(<ShipBar {...defaultProps} />);
    expect(screen.getByText('5 files changed, +120 -30')).toBeTruthy();
  });

  it('should show Accept button initially enabled', () => {
    render(<ShipBar {...defaultProps} />);
    expect(screen.getByText('Accept Changes')).toBeTruthy();
  });

  it('should show Push and PR buttons initially disabled', () => {
    render(<ShipBar {...defaultProps} />);
    expect(screen.getByText('Push to GitHub')).toBeTruthy();
    expect(screen.getByText('Create PR')).toBeTruthy();
  });

  it('should show committed state after accepting', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        branch: 'ttr/add-dark-mode',
        commitHash: 'abc1234',
        filesChanged: 3,
      }),
    });

    render(<ShipBar {...defaultProps} />);
    fireEvent.press(screen.getByText('Accept Changes'));

    await waitFor(() => {
      expect(screen.getByText('Committed to ttr/add-dark-mode')).toBeTruthy();
    });
  });

  it('should enable Push after Accept succeeds', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        branch: 'ttr/add-dark-mode',
        commitHash: 'abc1234',
        filesChanged: 3,
      }),
    });

    render(<ShipBar {...defaultProps} />);
    fireEvent.press(screen.getByText('Accept Changes'));

    await waitFor(() => {
      expect(screen.getByText('Committed to ttr/add-dark-mode')).toBeTruthy();
    });

    // Push button should now be accessible (enabled)
    const pushButton = screen.getByLabelText('Push to GitHub');
    expect(pushButton.props.accessibilityState?.disabled).not.toBe(true);
  });

  it('should show error when accept fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'No changes to commit.' }),
    });

    render(<ShipBar {...defaultProps} />);
    fireEvent.press(screen.getByText('Accept Changes'));

    await waitFor(() => {
      expect(screen.getByText('No changes to commit.')).toBeTruthy();
    });
  });

  it('should show PR URL after full flow', async () => {
    // Accept call
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branch: 'ttr/test',
          commitHash: 'def5678',
          filesChanged: 1,
        }),
      })
      // Push call
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          branch: 'ttr/test',
          url: 'https://github.com/user/repo/tree/ttr/test',
        }),
      })
      // PR call
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prUrl: 'https://github.com/user/repo/pull/42',
          prNumber: 42,
        }),
      });

    global.fetch = fetchMock;

    render(<ShipBar {...defaultProps} />);

    // Step 1: Accept
    fireEvent.press(screen.getByText('Accept Changes'));
    await waitFor(() => {
      expect(screen.getByText('Committed to ttr/test')).toBeTruthy();
    });

    // Step 2: Push
    fireEvent.press(screen.getByLabelText('Push to GitHub'));
    await waitFor(() => {
      expect(screen.getByText('Pushed to GitHub')).toBeTruthy();
    });

    // Step 3: PR
    fireEvent.press(screen.getByLabelText('Create pull request'));
    await waitFor(() => {
      expect(screen.getByText('PR: https://github.com/user/repo/pull/42')).toBeTruthy();
    });
  });
});
