// MicButton.test.tsx -- Testing the big round hold-to-talk button.
// Because even voice input needs to be tested in silence. The irony.

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// Mock the useVoice hook before importing the component
const mockOpenMouth = jest.fn().mockResolvedValue(undefined);
const mockMercifully = jest.fn().mockResolvedValue('file:///tmp/test-recording.m4a');
const mockRequestPermission = jest.fn().mockResolvedValue(true);

const mockUseVoice = jest.fn().mockReturnValue({
  isRecording: false,
  hasPermission: true,
  openMouth: mockOpenMouth,
  mercifully: mockMercifully,
  requestPermission: mockRequestPermission,
  duration: 0,
});

jest.mock('@/hooks/useVoice', () => ({
  useVoice: (...args: unknown[]) => mockUseVoice(...args),
}));

// Silence the confession booth during tests
jest.spyOn(console, 'debug').mockImplementation(() => {});
jest.spyOn(console, 'info').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

import { MicButton } from '@/components/MicButton';

describe('MicButton', () => {
  const defaultOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVoice.mockReturnValue({
      isRecording: false,
      hasPermission: true,
      openMouth: mockOpenMouth,
      mercifully: mockMercifully,
      requestPermission: mockRequestPermission,
      duration: 0,
    });
  });

  it('should render in idle state showing hold to talk', () => {
    render(<MicButton onRecordingComplete={defaultOnComplete} />);
    expect(screen.getByText('Hold to talk')).toBeTruthy();
  });

  it('should show recording duration when recording', () => {
    mockUseVoice.mockReturnValue({
      isRecording: true,
      hasPermission: true,
      openMouth: mockOpenMouth,
      mercifully: mockMercifully,
      requestPermission: mockRequestPermission,
      duration: 3,
    });

    render(<MicButton onRecordingComplete={defaultOnComplete} />);
    expect(screen.getByText('3s')).toBeTruthy();
    expect(screen.getByText('Recording... release to stop')).toBeTruthy();
  });

  it('should show permission prompt when mic permission is denied', () => {
    mockUseVoice.mockReturnValue({
      isRecording: false,
      hasPermission: false,
      openMouth: mockOpenMouth,
      mercifully: mockMercifully,
      requestPermission: mockRequestPermission,
      duration: 0,
    });

    render(<MicButton onRecordingComplete={defaultOnComplete} />);
    expect(screen.getByText('Tap to enable mic')).toBeTruthy();
    expect(screen.getByText('We need permission to hear you')).toBeTruthy();
  });

  it('should show permission prompt when permission has not been checked yet', () => {
    mockUseVoice.mockReturnValue({
      isRecording: false,
      hasPermission: null,
      openMouth: mockOpenMouth,
      mercifully: mockMercifully,
      requestPermission: mockRequestPermission,
      duration: 0,
    });

    render(<MicButton onRecordingComplete={defaultOnComplete} />);
    expect(screen.getByText('Tap to enable mic')).toBeTruthy();
  });

  it('should call openMouth on press in', async () => {
    render(<MicButton onRecordingComplete={defaultOnComplete} />);

    const button = screen.getByLabelText('Hold to record voice');
    fireEvent(button, 'pressIn');

    await waitFor(() => {
      expect(mockOpenMouth).toHaveBeenCalledTimes(1);
    });
  });

  it('should call mercifully and onRecordingComplete on press out', async () => {
    render(<MicButton onRecordingComplete={defaultOnComplete} />);

    const button = screen.getByLabelText('Hold to record voice');

    // Press in first to set the ref
    fireEvent(button, 'pressIn');

    await waitFor(() => {
      expect(mockOpenMouth).toHaveBeenCalled();
    });

    // Then release
    fireEvent(button, 'pressOut');

    await waitFor(() => {
      expect(mockMercifully).toHaveBeenCalledTimes(1);
      expect(defaultOnComplete).toHaveBeenCalledWith('file:///tmp/test-recording.m4a');
    });
  });

  it('should not call onRecordingComplete when mercifully returns null', async () => {
    mockMercifully.mockResolvedValueOnce(null);

    render(<MicButton onRecordingComplete={defaultOnComplete} />);

    const button = screen.getByLabelText('Hold to record voice');

    fireEvent(button, 'pressIn');
    await waitFor(() => {
      expect(mockOpenMouth).toHaveBeenCalled();
    });

    fireEvent(button, 'pressOut');

    await waitFor(() => {
      expect(mockMercifully).toHaveBeenCalled();
    });

    expect(defaultOnComplete).not.toHaveBeenCalled();
  });

  it('should not start recording when disabled', async () => {
    render(<MicButton onRecordingComplete={defaultOnComplete} disabled />);

    const button = screen.getByRole('button');
    fireEvent(button, 'pressIn');

    // Give it a tick
    await waitFor(() => {
      expect(mockOpenMouth).not.toHaveBeenCalled();
    });
  });

  it('should request permission when tapped without permission', async () => {
    mockUseVoice.mockReturnValue({
      isRecording: false,
      hasPermission: false,
      openMouth: mockOpenMouth,
      mercifully: mockMercifully,
      requestPermission: mockRequestPermission,
      duration: 0,
    });

    render(<MicButton onRecordingComplete={defaultOnComplete} />);

    const button = screen.getByRole('button');
    fireEvent(button, 'pressIn');

    await waitFor(() => {
      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });

  it('should have correct accessibility label when idle', () => {
    render(<MicButton onRecordingComplete={defaultOnComplete} />);
    expect(screen.getByLabelText('Hold to record voice')).toBeTruthy();
  });

  it('should have correct accessibility label when recording', () => {
    mockUseVoice.mockReturnValue({
      isRecording: true,
      hasPermission: true,
      openMouth: mockOpenMouth,
      mercifully: mockMercifully,
      requestPermission: mockRequestPermission,
      duration: 5,
    });

    render(<MicButton onRecordingComplete={defaultOnComplete} />);
    expect(screen.getByLabelText('Stop recording')).toBeTruthy();
  });

  it('should show disabled sublabel when disabled', () => {
    render(<MicButton onRecordingComplete={defaultOnComplete} disabled />);
    expect(screen.getByText('Not right now')).toBeTruthy();
  });
});
