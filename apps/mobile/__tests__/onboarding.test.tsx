// onboarding.test.tsx -- Testing the onboarding flow.
// Making sure rock bottom is rendered correctly
// and that the user can't escape without handing over their keys.

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import { OnboardingStep } from '@/components/OnboardingStep';
import { SessionHistory } from '@/components/SessionHistory';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { WelcomePhase } from '@/components/onboarding/WelcomePhase';
import { KeyInputPhase } from '@/components/onboarding/KeyInputPhase';
import { ReadyPhase } from '@/components/onboarding/ReadyPhase';

import type { SessionEvent } from '@/components/SessionHistory';

// Mock Linking so openURL doesn't try to actually open a browser on the test runner
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}));

describe('OnboardingStep', () => {
  it('should render the title in all its threatening glory', () => {
    render(
      <OnboardingStep title="You're here." description="No turning back.">
        <></>
      </OnboardingStep>,
    );
    expect(screen.getByText("You're here.")).toBeTruthy();
  });

  it('should render the description so the user knows what they signed up for', () => {
    render(
      <OnboardingStep title="Title" description="This is the description.">
        <></>
      </OnboardingStep>,
    );
    expect(screen.getByText('This is the description.')).toBeTruthy();
  });

  it('should render children because that is literally its job', () => {
    const { getByText } = render(
      <OnboardingStep title="Title" description="Desc">
        <>{React.createElement(require('react-native').Text, null, 'Child content')}</>
      </OnboardingStep>,
    );
    expect(getByText('Child content')).toBeTruthy();
  });
});

describe('WelcomePhase', () => {
  it('should render the welcome message at phase zero', () => {
    render(<WelcomePhase onNext={jest.fn()} />);
    expect(screen.getByText("You're here. That's step one.")).toBeTruthy();
  });

  it('should mention that there is no step four because there is not', () => {
    render(<WelcomePhase onNext={jest.fn()} />);
    expect(screen.getByText(/There is no step four/)).toBeTruthy();
  });

  it('should call onNext when the user accepts their fate', () => {
    const onNext = jest.fn();
    render(<WelcomePhase onNext={onNext} />);
    fireEvent.press(screen.getByText("Let's do this"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('should have an accessible button for screen readers who also code on buses', () => {
    render(<WelcomePhase onNext={jest.fn()} />);
    expect(screen.getByLabelText('Begin onboarding')).toBeTruthy();
  });
});

describe('KeyInputPhase', () => {
  it('should render the title and description for the key collection ritual', () => {
    render(
      <KeyInputPhase
        title="Enter your Anthropic API key."
        description="You already have one."
        placeholder="sk-ant-..."
        onSubmit={jest.fn()}
        inputLabel="Anthropic API key"
      />,
    );
    expect(screen.getByText('Enter your Anthropic API key.')).toBeTruthy();
    expect(screen.getByText('You already have one.')).toBeTruthy();
  });

  it('should render a secure text input because we are not savages', () => {
    render(
      <KeyInputPhase
        title="Title"
        description="Desc"
        placeholder="sk-ant-..."
        onSubmit={jest.fn()}
        inputLabel="Anthropic API key"
      />,
    );
    const input = screen.getByLabelText('Anthropic API key');
    expect(input).toBeTruthy();
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('should call onSubmit with the trimmed key when next is pressed', () => {
    const onSubmit = jest.fn();
    render(
      <KeyInputPhase
        title="Title"
        description="Desc"
        placeholder="sk-ant-..."
        onSubmit={onSubmit}
        inputLabel="API key"
      />,
    );
    fireEvent.changeText(screen.getByLabelText('API key'), '  sk-ant-test-key  ');
    fireEvent.press(screen.getByLabelText('Submit key and continue'));
    expect(onSubmit).toHaveBeenCalledWith('sk-ant-test-key');
  });

  it('should not submit when the input is empty because that would be pointless', () => {
    const onSubmit = jest.fn();
    render(
      <KeyInputPhase
        title="Title"
        description="Desc"
        placeholder="sk-ant-..."
        onSubmit={onSubmit}
        inputLabel="API key"
      />,
    );
    fireEvent.press(screen.getByLabelText('Submit key and continue'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should show a skip button when the step is optional because we are occasionally merciful', () => {
    const onSkip = jest.fn();
    render(
      <KeyInputPhase
        title="Title"
        description="Desc"
        placeholder="key"
        onSubmit={jest.fn()}
        optional
        onSkip={onSkip}
        inputLabel="Optional key"
      />,
    );
    expect(screen.getByText('Skip for now')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Skip this step'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('should not show a skip button when the step is required because standards', () => {
    render(
      <KeyInputPhase
        title="Title"
        description="Desc"
        placeholder="key"
        onSubmit={jest.fn()}
        inputLabel="Required key"
      />,
    );
    expect(screen.queryByText('Skip for now')).toBeNull();
  });

  it('should show a help link when helpUrl is provided', () => {
    render(
      <KeyInputPhase
        title="Title"
        description="Desc"
        placeholder="key"
        onSubmit={jest.fn()}
        helpUrl="https://console.anthropic.com"
        inputLabel="Key"
      />,
    );
    expect(screen.getByText('Where do I find this?')).toBeTruthy();
  });
});

describe('ReadyPhase', () => {
  it('should show all status lines when the user is fully configured', () => {
    render(
      <ReadyPhase
        hasXaiKey
        onNewProject={jest.fn()}
        onConnectRepo={jest.fn()}
      />,
    );
    expect(screen.getByText("You're set.")).toBeTruthy();
    expect(screen.getByText('alive')).toBeTruthy();
    expect(screen.getByText('connected')).toBeTruthy();
    expect(screen.getByText('Grok (the upgrade)')).toBeTruthy();
  });

  it('should show Deepgram as voice when xAI key was skipped because free is fine', () => {
    render(
      <ReadyPhase
        hasXaiKey={false}
        onNewProject={jest.fn()}
        onConnectRepo={jest.fn()}
      />,
    );
    expect(screen.getByText('Deepgram (sensible default)')).toBeTruthy();
  });

  it('should call onNewProject when the user picks new project', () => {
    const onNewProject = jest.fn();
    render(
      <ReadyPhase
        hasXaiKey={false}
        onNewProject={onNewProject}
        onConnectRepo={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText('New Project'));
    expect(onNewProject).toHaveBeenCalledTimes(1);
  });

  it('should call onConnectRepo when the user picks connect repo', () => {
    const onConnectRepo = jest.fn();
    render(
      <ReadyPhase
        hasXaiKey={false}
        onNewProject={jest.fn()}
        onConnectRepo={onConnectRepo}
      />,
    );
    fireEvent.press(screen.getByText('Connect Repo'));
    expect(onConnectRepo).toHaveBeenCalledTimes(1);
  });

  it('should have accessible buttons for both paths forward', () => {
    render(
      <ReadyPhase
        hasXaiKey={false}
        onNewProject={jest.fn()}
        onConnectRepo={jest.fn()}
      />,
    );
    expect(screen.getByLabelText('Start a new project')).toBeTruthy();
    expect(screen.getByLabelText('Connect an existing repository')).toBeTruthy();
  });
});

describe('SessionHistory', () => {
  const mockEvents: SessionEvent[] = [
    { id: '1', type: 'instruction', content: 'Build me a REST API', timestamp: 1709913600000 },
    { id: '2', type: 'response', content: 'Working on it.', timestamp: 1709913605000 },
    { id: '3', type: 'file_change', content: 'Created index.ts', timestamp: 1709913610000 },
    { id: '4', type: 'error', content: 'Build failed. Obviously.', timestamp: 1709913615000 },
  ];

  it('should render all events in the timeline', () => {
    render(<SessionHistory events={mockEvents} />);
    expect(screen.getByText('Build me a REST API')).toBeTruthy();
    expect(screen.getByText('Working on it.')).toBeTruthy();
    expect(screen.getByText('Created index.ts')).toBeTruthy();
    expect(screen.getByText('Build failed. Obviously.')).toBeTruthy();
  });

  it('should show the empty state when the void is empty', () => {
    render(<SessionHistory events={[]} />);
    expect(screen.getByText('No events yet. The void is patient.')).toBeTruthy();
  });

  it('should render event type labels for categorization purposes', () => {
    render(<SessionHistory events={mockEvents} />);
    expect(screen.getByText('instruction')).toBeTruthy();
    expect(screen.getByText('response')).toBeTruthy();
    expect(screen.getByText('file_change')).toBeTruthy();
    expect(screen.getByText('error')).toBeTruthy();
  });

  it('should render timestamps so the user can track their descent', () => {
    render(<SessionHistory events={[mockEvents[0]!]} />);
    // The timestamp 1709913600000 renders based on local timezone,
    // so we just check that some time string is present
    const timePattern = /\d{2}:\d{2}:\d{2}/;
    const allTexts = screen.getAllByText(timePattern);
    expect(allTexts.length).toBeGreaterThan(0);
  });
});

describe('ProjectSwitcher', () => {
  const mockRepos = [
    { name: 'my-app', fullName: 'akella/my-app' },
    { name: 'side-project', fullName: 'akella/side-project' },
    { name: 'abandoned-idea', fullName: 'akella/abandoned-idea' },
  ];

  it('should render the list of repos the user is neglecting', () => {
    render(
      <ProjectSwitcher repos={mockRepos} selected={null} onSelect={jest.fn()} />,
    );
    expect(screen.getByText(/akella\/my-app/)).toBeTruthy();
    expect(screen.getByText(/akella\/side-project/)).toBeTruthy();
    expect(screen.getByText(/akella\/abandoned-idea/)).toBeTruthy();
  });

  it('should show the empty message when no repos are connected', () => {
    render(
      <ProjectSwitcher repos={[]} selected={null} onSelect={jest.fn()} />,
    );
    expect(screen.getByText('No repos connected. Start a project first.')).toBeTruthy();
  });

  it('should call onSelect when a repo is tapped', () => {
    const onSelect = jest.fn();
    render(
      <ProjectSwitcher repos={mockRepos} selected={null} onSelect={onSelect} />,
    );
    fireEvent.press(screen.getByLabelText('Select repository my-app'));
    expect(onSelect).toHaveBeenCalledWith('akella/my-app');
  });

  it('should highlight the currently selected repo because feedback matters', () => {
    render(
      <ProjectSwitcher
        repos={mockRepos}
        selected="akella/side-project"
        onSelect={jest.fn()}
      />,
    );
    // The selected repo gets a '> ' prefix
    expect(screen.getByText(/> .*akella\/side-project/)).toBeTruthy();
  });

  it('should have accessible buttons for all repos', () => {
    render(
      <ProjectSwitcher repos={mockRepos} selected={null} onSelect={jest.fn()} />,
    );
    expect(screen.getByLabelText('Select repository my-app')).toBeTruthy();
    expect(screen.getByLabelText('Select repository side-project')).toBeTruthy();
    expect(screen.getByLabelText('Select repository abandoned-idea')).toBeTruthy();
  });
});
