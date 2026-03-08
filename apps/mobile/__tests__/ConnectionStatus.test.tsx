// ConnectionStatus.test.tsx -- Testing the connection status bar.
// Making sure it shows up when we lose connection and disappears
// when things are fine. The bar is low. The bar is also literally a bar.

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { ConnectionStatus } from '@/components/ConnectionStatus';

describe('ConnectionStatus', () => {
  it('should hide when connected, because nobody needs a reminder that things are fine', () => {
    const { toJSON } = render(
      <ConnectionStatus isConnected={true} isReconnecting={false} />,
    );
    expect(toJSON()).toBeNull();
  });

  it('should show reconnecting message when disconnected and reconnecting', () => {
    render(
      <ConnectionStatus isConnected={false} isReconnecting={true} />,
    );
    expect(screen.getByText('Reconnecting. Hold on.')).toBeTruthy();
  });

  it('should show lost connection message when disconnected but not yet reconnecting', () => {
    render(
      <ConnectionStatus isConnected={false} isReconnecting={false} />,
    );
    expect(screen.getByText('Lost connection. Reconnecting shortly.')).toBeTruthy();
  });

  it('should display custom message when provided', () => {
    render(
      <ConnectionStatus
        isConnected={false}
        isReconnecting={true}
        message="The void has collapsed. Rebuilding."
      />,
    );
    expect(screen.getByText('The void has collapsed. Rebuilding.')).toBeTruthy();
  });

  it('should prefer custom message over default when disconnected', () => {
    render(
      <ConnectionStatus
        isConnected={false}
        isReconnecting={false}
        message="Custom disconnection message."
      />,
    );
    expect(screen.getByText('Custom disconnection message.')).toBeTruthy();
    expect(screen.queryByText('Lost connection. Reconnecting shortly.')).toBeNull();
  });
});
