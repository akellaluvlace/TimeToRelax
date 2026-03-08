// useAgentSession.test.ts -- Testing the SSE connection hook.
// Making sure we can parse events, track files, and handle errors
// without panicking. The hook panics so the user doesn't have to.

import { renderHook, act } from '@testing-library/react-native';

import { useAgentSession } from '@/hooks/useAgentSession';

// ---------------------------------------------------------------------------
// Mock fetch for SSE streaming
// ---------------------------------------------------------------------------

// Helper to create a mock ReadableStream that yields SSE-formatted chunks
function createMockSSEStream(events: Array<{ id: string; type: string; data: Record<string, unknown> }>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < events.length) {
        const event = events[index];
        if (event) {
          const chunk = `id:${event.id}\nevent:${event.type}\ndata:${JSON.stringify(event.data)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        }
        index++;
      } else {
        controller.close();
      }
    },
  });
}

// Store original fetch so we can restore it
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('useAgentSession', () => {
  it('should start with idle phase and no connection', () => {
    const { result } = renderHook(() => useAgentSession());

    expect(result.current.phase).toBe('idle');
    expect(result.current.isConnected).toBe(false);
    expect(result.current.events).toEqual([]);
    expect(result.current.filesChanged).toEqual([]);
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should connect and parse incoming SSE events', async () => {
    const mockEvents = [
      { id: 'evt-1', type: 'agent_thinking', data: { message: 'Thinking...' } },
      { id: 'evt-2', type: 'agent_writing', data: { file: 'src/app.ts' } },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: createMockSSEStream(mockEvents),
    });

    const { result } = renderHook(() => useAgentSession());

    await act(async () => {
      result.current.connect('session-123', 'http://localhost:3000');
      // Give the stream time to process
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.events.length).toBe(2);
    expect(result.current.events[0]?.type).toBe('agent_thinking');
    expect(result.current.events[1]?.type).toBe('agent_writing');
  });

  it('should track file changes from FILE_CHANGED events', async () => {
    const mockEvents = [
      {
        id: 'evt-1',
        type: 'file_changed',
        data: { filePath: 'src/index.ts', action: 'created' },
      },
      {
        id: 'evt-2',
        type: 'file_changed',
        data: { filePath: 'package.json', action: 'modified' },
      },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: createMockSSEStream(mockEvents),
    });

    const { result } = renderHook(() => useAgentSession());

    await act(async () => {
      result.current.connect('session-456', 'http://localhost:3000');
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.filesChanged).toHaveLength(2);
    expect(result.current.filesChanged[0]).toEqual({ path: 'src/index.ts', action: 'created' });
    expect(result.current.filesChanged[1]).toEqual({ path: 'package.json', action: 'modified' });
  });

  it('should extract preview URL from PREVIEW_READY events', async () => {
    const mockEvents = [
      {
        id: 'evt-1',
        type: 'preview_ready',
        data: { url: 'https://sandbox-abc.e2b.dev' },
      },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: createMockSSEStream(mockEvents),
    });

    const { result } = renderHook(() => useAgentSession());

    await act(async () => {
      result.current.connect('session-789', 'http://localhost:3000');
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.previewUrl).toBe('https://sandbox-abc.e2b.dev');
  });

  it('should update phase based on event types', async () => {
    const mockEvents = [
      { id: 'evt-1', type: 'agent_thinking', data: {} },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: createMockSSEStream(mockEvents),
    });

    const { result } = renderHook(() => useAgentSession());

    await act(async () => {
      result.current.connect('session-phase', 'http://localhost:3000');
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.phase).toBe('bargaining');
  });

  it('should set error on fetch failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useAgentSession());

    await act(async () => {
      result.current.connect('session-err', 'http://localhost:3000');
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isConnected).toBe(false);
  });

  it('should handle network errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

    const { result } = renderHook(() => useAgentSession());

    await act(async () => {
      result.current.connect('session-net-err', 'http://localhost:3000');
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isConnected).toBe(false);
  });

  it('should disconnect and abort the connection', async () => {
    const abortFn = jest.fn();
    global.fetch = jest.fn().mockImplementation((_url: string, options: { signal: AbortSignal }) => {
      // Listen for abort
      options.signal.addEventListener('abort', abortFn);
      // Return a stream that never resolves (simulates long-running connection)
      return Promise.resolve({
        ok: true,
        body: new ReadableStream({
          // Intentionally never closes to simulate an ongoing SSE connection
          start() {},
        }),
      });
    });

    const { result } = renderHook(() => useAgentSession());

    await act(async () => {
      result.current.connect('session-disconnect', 'http://localhost:3000');
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    act(() => {
      result.current.disconnect();
    });

    expect(abortFn).toHaveBeenCalled();
    expect(result.current.isConnected).toBe(false);
  });

  it('should reset state on new connection', async () => {
    const mockEvents = [
      { id: 'evt-1', type: 'agent_thinking', data: {} },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: createMockSSEStream(mockEvents),
    });

    const { result } = renderHook(() => useAgentSession());

    // First connection
    await act(async () => {
      result.current.connect('session-1', 'http://localhost:3000');
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.events.length).toBeGreaterThan(0);

    // Second connection should reset
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: createMockSSEStream([]),
    });

    await act(async () => {
      result.current.connect('session-2', 'http://localhost:3000');
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Events should be reset (the new stream had no events)
    expect(result.current.events).toEqual([]);
  });

  it('should replace file entry when same path changes again', async () => {
    const mockEvents = [
      {
        id: 'evt-1',
        type: 'file_changed',
        data: { filePath: 'src/app.ts', action: 'created' },
      },
      {
        id: 'evt-2',
        type: 'file_changed',
        data: { filePath: 'src/app.ts', action: 'modified' },
      },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: createMockSSEStream(mockEvents),
    });

    const { result } = renderHook(() => useAgentSession());

    await act(async () => {
      result.current.connect('session-dedup', 'http://localhost:3000');
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Should have one entry, not two, since the same file was updated
    expect(result.current.filesChanged).toHaveLength(1);
    expect(result.current.filesChanged[0]?.action).toBe('modified');
  });
});
