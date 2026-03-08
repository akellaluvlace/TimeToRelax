// useVoiceReconnect.test.ts -- Testing the voice reconnection hook.
// Making sure we retry with backoff and track attempts
// without spiraling into infinite reconnect loops.

import { renderHook, act } from '@testing-library/react-native';

import { useVoiceReconnect, RECONNECT_DELAYS, MAX_RECONNECT_ATTEMPTS } from '@/hooks/useVoiceReconnect';

describe('useVoiceReconnect', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start connected and not reconnecting', () => {
    const reconnectFn = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useVoiceReconnect(reconnectFn));

    expect(result.current.isConnected).toBe(true);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.reconnectAttempt).toBe(0);
    expect(result.current.maxAttempts).toBe(MAX_RECONNECT_ATTEMPTS);
  });

  it('should set isReconnecting on disconnect', () => {
    const reconnectFn = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useVoiceReconnect(reconnectFn));

    act(() => {
      result.current.onDisconnect();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isReconnecting).toBe(true);
  });

  it('should attempt reconnection after the first delay', async () => {
    const reconnectFn = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useVoiceReconnect(reconnectFn));

    act(() => {
      result.current.onDisconnect();
    });

    expect(reconnectFn).not.toHaveBeenCalled();

    // Advance past the first backoff delay
    await act(async () => {
      jest.advanceTimersByTime(RECONNECT_DELAYS[0]!);
    });

    expect(reconnectFn).toHaveBeenCalledTimes(1);
    expect(result.current.reconnectAttempt).toBe(1);
  });

  it('should increment attempt count on each reconnect try', async () => {
    // Each call rejects to trigger the next attempt
    const reconnectFn = jest.fn().mockRejectedValue(new Error('still dead'));
    const { result } = renderHook(() => useVoiceReconnect(reconnectFn));

    act(() => {
      result.current.onDisconnect();
    });

    // First attempt
    await act(async () => {
      jest.advanceTimersByTime(RECONNECT_DELAYS[0]!);
    });
    expect(result.current.reconnectAttempt).toBe(1);

    // Second attempt (triggered by the failure handler calling onDisconnect)
    await act(async () => {
      jest.advanceTimersByTime(RECONNECT_DELAYS[1]!);
    });
    expect(result.current.reconnectAttempt).toBe(2);
  });

  it('should reset state on successful connect', async () => {
    const reconnectFn = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useVoiceReconnect(reconnectFn));

    act(() => {
      result.current.onDisconnect();
    });

    expect(result.current.isConnected).toBe(false);

    act(() => {
      result.current.onConnect();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.reconnectAttempt).toBe(0);
  });

  it('should stop reconnecting after max attempts', async () => {
    // Each reconnect attempt fails, triggering the next attempt via onDisconnect
    const reconnectFn = jest.fn().mockRejectedValue(new Error('still dead'));
    const { result } = renderHook(() => useVoiceReconnect(reconnectFn));

    // Trigger initial disconnect
    act(() => {
      result.current.onDisconnect();
    });

    // Run through all reconnect delays until we exhaust attempts
    for (let i = 0; i < MAX_RECONNECT_ATTEMPTS; i++) {
      await act(async () => {
        jest.advanceTimersByTime(RECONNECT_DELAYS[i] ?? RECONNECT_DELAYS[RECONNECT_DELAYS.length - 1]!);
      });
    }

    // After exhausting all attempts, the next onDisconnect should give up
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.isConnected).toBe(false);
  });

  it('should reset everything on manual reset', () => {
    const reconnectFn = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useVoiceReconnect(reconnectFn));

    act(() => {
      result.current.onDisconnect();
    });

    expect(result.current.isConnected).toBe(false);

    act(() => {
      result.current.reset();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.reconnectAttempt).toBe(0);
  });

  it('should expose the correct max attempts constant', () => {
    const reconnectFn = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useVoiceReconnect(reconnectFn));

    expect(result.current.maxAttempts).toBe(RECONNECT_DELAYS.length);
  });
});
